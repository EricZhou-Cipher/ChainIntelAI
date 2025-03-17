import cron from "node-cron";
import { ethers } from "ethers";
import {
  client as prometheusClient,
  Counter,
  Gauge,
  Histogram,
} from "prom-client";
import logger from "../config/logger.js";
import { getChainConfig } from "../config/chains.js";
import { replayEvents } from "../replayHistoricalEvents.js";

// Prometheus 指标定义
const replaySuccessCounter = new Counter({
  name: "replay_success_count",
  help: "成功完成的回放任务数",
});

const replayFailureCounter = new Counter({
  name: "replay_failure_count",
  help: "失败的回放任务数",
});

const replayDurationHistogram = new Histogram({
  name: "replay_duration_seconds",
  help: "回放任务执行时长(秒)",
  buckets: [60, 300, 600, 1800, 3600],
});

const replayEventCounter = new Counter({
  name: "replay_event_count",
  help: "已回放的事件总数",
  labelNames: ["chain_id", "status"],
});

const lastReplayBlockGauge = new Gauge({
  name: "last_replay_block",
  help: "最近一次回放的区块高度",
  labelNames: ["chain_id"],
});

class ReplayScheduler {
  constructor() {
    this.isRunning = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 5 * 60 * 1000; // 5分钟
  }

  // 启动定时任务
  start() {
    logger.info("启动回放调度器");

    // 每小时整点执行回放
    cron.schedule("0 * * * *", async () => {
      if (this.isRunning) {
        logger.warn("上一次回放任务仍在执行中,跳过本次调度");
        return;
      }

      try {
        await this.executeReplay();
      } catch (error) {
        logger.error("回放任务执行失败:", error);
        this.handleFailure(error);
      }
    });

    logger.info("回放调度器已启动,将在每小时整点执行");
  }

  // 执行回放任务
  async executeReplay() {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      // 获取所有链的配置
      const chains = Object.values(getChainConfig());

      for (const chain of chains) {
        const provider = new ethers.WebSocketProvider(chain.nodeWss);

        // 获取当前区块
        const currentBlock = await provider.getBlockNumber();
        const startBlock = currentBlock - 5760; // 约1小时的区块

        logger.info(`开始回放链 ${chain.chainId} 的历史事件`, {
          startBlock,
          endBlock: currentBlock,
        });

        const result = await replayEvents({
          chainId: chain.chainId,
          startBlock,
          endBlock: currentBlock,
          batchSize: 100,
        });

        // 更新指标
        replayEventCounter.inc(
          { chain_id: chain.chainId, status: "success" },
          result.processedCount
        );
        lastReplayBlockGauge.set({ chain_id: chain.chainId }, currentBlock);

        logger.info(`链 ${chain.chainId} 回放完成`, {
          processedEvents: result.processedCount,
          failedEvents: result.failedCount,
        });

        await provider.destroy();
      }

      // 记录成功
      replaySuccessCounter.inc();
      this.retryCount = 0;
    } catch (error) {
      replayFailureCounter.inc();
      throw error;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      replayDurationHistogram.observe(duration);
      this.isRunning = false;
    }
  }

  // 处理失败情况
  async handleFailure(error) {
    this.retryCount++;

    if (this.retryCount <= this.maxRetries) {
      logger.warn(
        `回放任务失败,${this.retryDelay / 1000}秒后第${this.retryCount}次重试`,
        {
          error: error.message,
        }
      );

      // 延迟重试
      setTimeout(async () => {
        try {
          await this.executeReplay();
        } catch (retryError) {
          logger.error(`第${this.retryCount}次重试失败:`, retryError);
        }
      }, this.retryDelay);
    } else {
      logger.error("回放任务重试次数已达上限,请人工介入处理", {
        error: error.message,
        retryCount: this.retryCount,
      });

      // TODO: 发送告警通知
    }
  }
}

export const scheduler = new ReplayScheduler();
