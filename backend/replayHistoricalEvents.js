import { ethers } from "ethers";
import winston from "winston";
import mongoose from "mongoose";
import { config } from "./config.js";
import { saveTransferEvent } from "./db.js";
import { analyzeTransfer } from "./aiAnalysis.js";
import { sendTelegramAlert, sendDiscordAlert } from "./notifier.js";
import EventStatus from "./eventStatusManager.js";
import { ensureDir } from "fs-extra";

// 确保日志目录存在
await ensureDir(config.logging.dir);

// ==================== 日志系统配置 ====================
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "replayHistoricalEvents" },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: `${config.logging.dir}/${config.logging.files.replay}`,
    }),
    new winston.transports.File({
      filename: `${config.logging.dir}/${config.logging.files.error}`,
      level: "error",
    }),
  ],
});

// ==================== 数据库连接 ====================
async function connectDB() {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info("✅ 数据库连接成功");
  } catch (error) {
    logger.error("❌ 数据库连接失败:", error);
    process.exit(1);
  }
}

// ==================== 区块处理 ====================
class BlockProcessor {
  constructor(provider, contract) {
    this.provider = provider;
    this.contract = contract;
    this.stats = {
      totalEvents: 0,
      highRiskEvents: 0,
      failedEvents: 0,
      startTime: Date.now(),
    };
  }

  /**
   * 获取区块时间戳
   * @param {number} blockNumber - 区块号
   * @returns {Promise<number>} 区块时间戳
   */
  async getBlockTimestamp(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block.timestamp;
    } catch (error) {
      logger.error(`获取区块 ${blockNumber} 时间戳失败:`, error);
      throw error;
    }
  }

  /**
   * 处理单个 Transfer 事件
   * @param {Object} event - 原始事件对象
   * @returns {Promise<void>}
   */
  async processTransferEvent(event) {
    const txHash = event.transactionHash;
    const chainId = (await this.provider.getNetwork()).chainId;

    // 检查事件状态，避免重复处理
    let eventStatus = await EventStatus.findOne({ chainId, txHash });
    if (eventStatus && eventStatus.status === "Success") {
      logger.info(`事件 ${txHash} 已处理，跳过`, { chainId });
      return;
    }

    // 初始化事件状态
    if (!eventStatus) {
      eventStatus = new EventStatus({
        chainId,
        txHash,
        status: "Pending",
        source: "replay",
      });
      await eventStatus.save();
    }

    try {
      eventStatus.status = "Processing";
      await eventStatus.save();

      // 解析事件数据
      const parsedEvent = {
        chainId,
        txHash,
        blockNumber: event.blockNumber,
        from: event.args.from,
        to: event.args.to,
        amount: ethers.formatEther(event.args.value),
        value: event.args.value.toString(),
        timestamp: await this.getBlockTimestamp(event.blockNumber),
        source: "replay",
      };

      logger.info(`🔁 回放事件: ${txHash}`, {
        chainId,
        amount: `${parsedEvent.amount} ETH`,
        from: parsedEvent.from,
        to: parsedEvent.to,
        blockNumber: parsedEvent.blockNumber,
      });

      // 存储事件
      await saveTransferEvent(parsedEvent);

      // AI 分析
      const riskResult = await analyzeTransfer(parsedEvent);
      parsedEvent.riskLevel = riskResult.riskLevel;

      // 更新存储记录
      await saveTransferEvent(parsedEvent);

      // 发送通知（高风险事件）
      if (riskResult.riskLevel === "HIGH") {
        const alertMsg = `⚠️ 高风险转账回放\n${parsedEvent.amount} ETH\nFrom: ${parsedEvent.from}\nTo: ${parsedEvent.to}\nTxHash: ${txHash}`;
        await Promise.all([
          sendTelegramAlert(alertMsg),
          sendDiscordAlert(alertMsg),
        ]);
        eventStatus.status = "Alerted";
        this.stats.highRiskEvents++;
      } else {
        eventStatus.status = "Success";
      }

      logger.info(`✅ 事件 ${txHash} 处理完毕`, {
        chainId,
        riskLevel: riskResult.riskLevel,
        amount: parsedEvent.amount,
      });
      this.stats.totalEvents++;
    } catch (error) {
      eventStatus.status = "Failed";
      eventStatus.lastError = error.message;
      eventStatus.retryCount = (eventStatus.retryCount || 0) + 1;
      logger.error(`❌ 处理事件 ${txHash} 失败:`, {
        chainId,
        error: error.message,
      });
      this.stats.failedEvents++;
    } finally {
      eventStatus.updatedAt = Date.now();
      await eventStatus.save();
    }
  }

  /**
   * 处理区块范围内的所有事件
   * @param {number} startBlock - 起始区块
   * @param {number} endBlock - 结束区块
   * @returns {Promise<void>}
   */
  async processBlockRange(startBlock, endBlock) {
    try {
      const chainId = (await this.provider.getNetwork()).chainId;
      logger.info(
        `⏪ 开始回放区块 ${startBlock} 到 ${endBlock} 的 Transfer 事件`,
        {
          chainId,
          startBlock,
          endBlock,
        }
      );

      // 查询 Transfer 事件
      const filter = this.contract.filters.Transfer();
      const events = await this.contract.queryFilter(
        filter,
        startBlock,
        endBlock
      );

      if (events.length === 0) {
        logger.warn("未找到任何 Transfer 事件", {
          chainId,
          startBlock,
          endBlock,
        });
        return;
      }

      // 批量处理事件
      for (let i = 0; i < events.length; i += config.replay.batchSize) {
        const batch = events.slice(i, i + config.replay.batchSize);
        await Promise.all(
          batch.map((event) => this.processTransferEvent(event))
        );

        // 记录进度
        logger.info(
          `处理进度: ${Math.min(i + config.replay.batchSize, events.length)}/${
            events.length
          }`,
          {
            chainId,
            currentBatch: Math.floor(i / config.replay.batchSize) + 1,
            totalBatches: Math.ceil(events.length / config.replay.batchSize),
          }
        );
      }

      // 输出统计信息
      const duration = (Date.now() - this.stats.startTime) / 1000;
      logger.info("🎉 历史事件回放完成", {
        chainId,
        totalEvents: this.stats.totalEvents,
        highRiskEvents: this.stats.highRiskEvents,
        failedEvents: this.stats.failedEvents,
        duration: `${duration.toFixed(2)}秒`,
      });
    } catch (error) {
      logger.error("回放历史事件失败:", error);
      throw error;
    }
  }
}

// ==================== 主流程 ====================
async function main() {
  try {
    // 连接数据库
    await connectDB();

    // 初始化 provider 和合约
    const provider = new ethers.WebSocketProvider(config.rpc.ws);
    const contract = new ethers.Contract(
      config.contract.address,
      config.contract.abi,
      provider
    );

    // 创建区块处理器
    const processor = new BlockProcessor(provider, contract);

    // 获取结束区块
    const endBlock =
      config.replay.endBlock === "latest"
        ? await provider.getBlockNumber()
        : parseInt(config.replay.endBlock);

    // 全局重试逻辑
    for (let attempt = 1; attempt <= config.replay.maxRetries; attempt++) {
      try {
        await processor.processBlockRange(config.replay.startBlock, endBlock);
        break; // 成功后跳出重试
      } catch (error) {
        logger.error(`❗️ 第 ${attempt} 次回放失败:`, error);
        if (attempt < config.replay.maxRetries) {
          logger.warn(`⏳ ${config.replay.retryDelay}ms 后重试...`);
          await new Promise((r) => setTimeout(r, config.replay.retryDelay));
        } else {
          logger.error("🚨 所有重试失败，程序退出");
          process.exit(1);
        }
      }
    }

    // 优雅退出
    process.exit(0);
  } catch (error) {
    logger.error("程序异常退出:", error);
    process.exit(1);
  }
}

// 启动程序
main().catch((error) => {
  logger.error("程序异常退出:", error);
  process.exit(1);
});
