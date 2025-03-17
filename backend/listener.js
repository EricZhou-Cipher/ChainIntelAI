import { ethers } from "ethers";
import dotenv from "dotenv";
import winston from "winston";
import { saveTransferEvent } from "./db.js";
import { analyzeTransfer } from "./aiAnalysis.js";
import { sendTelegramAlert, sendDiscordAlert } from "./notifier.js";
import EventStatus from "./eventStatusManager.js";
import {
  getChainConfig,
  getChainProvider,
  getChainContract,
} from "./config/chains.js";

// 加载环境变量
dotenv.config();

// ==================== 日志系统配置 ====================
// 配置 winston 日志记录器，包含时间戳和 JSON 格式，输出到控制台和文件
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

// ==================== 配置区 ====================
// 初始化 provider
let provider;
let chainConfig;
let contract;

// 定义一个 Set 用于去重，防止重复处理同一交易；超出最大缓存时清空以释放内存
const seenTxHashes = new Set();
const MAX_TX_CACHE = 10000;

// ==================== ChainId 缓存 ====================
// 在启动时获取链网络的 chainId，减少每次事件处理时的网络查询
let chainId;
async function initChainId() {
  try {
    console.log("开始初始化...");
    provider = await getChainProvider(31337); // Hardhat 网络
    console.log("Provider 已创建");
    const network = await provider.getNetwork();
    console.log("网络信息:", network);
    chainId = network.chainId;
    console.log("获取到 chainId:", chainId);
    chainConfig = getChainConfig(chainId);
    console.log("获取到链配置:", chainConfig);
    contract = await getChainContract(chainId);
    console.log("获取到合约实例");
    logger.info(`成功获取 ChainId: ${chainId}`);
  } catch (err) {
    console.error("初始化错误详情:", err);
    logger.error("初始化 ChainId 失败:", err);
    process.exit(1);
  }
}

// ==================== 事件处理 ====================
let lastProcessedBlock = 0;
let lastBlockTimestamp = Date.now();

async function handleTransferEvent(from, to, value, event) {
  try {
    if (seenTxHashes.has(event.transactionHash)) {
      logger.info(`🔄 重复事件 ${event.transactionHash}，跳过处理`);
      return;
    }
    seenTxHashes.add(event.transactionHash);
    if (seenTxHashes.size > MAX_TX_CACHE) seenTxHashes.clear();

    const threshold = chainConfig.riskConfig.amountThresholds.high;
    if (value < threshold) return;

    const amountStr = ethers.formatEther(value);
    logger.info(`捕获大额转账`, {
      from,
      to,
      amount: amountStr,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    });

    const transferRecord = {
      chainId,
      from,
      to,
      value: value.toString(),
      amount: amountStr,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: Date.now(),
      aiStatus: "pending",
    };

    await saveTransferEvent(transferRecord);

    try {
      // 创建默认的 context 对象
      const context = {
        fromHistory: {
          totalTransactions: 1,
          uniqueAddresses: 1,
        },
        toHistory: {
          totalTransactions: 1,
          uniqueAddresses: 1,
        },
        blacklist: [],
        contractData: {
          isContract: false,
          hasComplexLogic: false,
          hasHighRiskFunctions: false,
          isVerified: true,
          hasAudit: true,
        },
        behaviorData: {
          isFirstTimeSender: true,
          isFirstTimeReceiver: true,
          hasRecentHighValueTransfers: false,
          hasMultipleContractsInvolved: false,
        },
      };

      const analysisResult = await analyzeTransfer(transferRecord, context);
      if (analysisResult?.riskLevel === "HIGH") {
        const alertMsg = `⚠️ 高风险转账预警\n${amountStr} ETH\nFrom: ${from}\nTo: ${to}\nTxHash: ${event.transactionHash}`;
        await Promise.all([
          sendTelegramAlert(alertMsg),
          sendDiscordAlert(alertMsg),
        ]);
      }
      transferRecord.aiStatus = "done";
    } catch (aiError) {
      logger.error(`风险分析失败:`, aiError);
      transferRecord.aiStatus = "failed";
    }
    await saveTransferEvent(transferRecord);
  } catch (err) {
    logger.error(`❌ 处理 Transfer 事件异常:`, err);
  }
}

function startListeners() {
  contract.on("Transfer", handleTransferEvent);

  provider.on("block", (blockNumber) => {
    logger.info(`📦 新区块：${blockNumber}`);
    const now = Date.now();
    if (now - lastBlockTimestamp > 60000) {
      logger.warn("⚠️ 已60秒未更新区块，可能节点异常");
    }
    lastBlockTimestamp = now;
    lastProcessedBlock = blockNumber;
  });
}

process.on("uncaughtException", (err) =>
  logger.error("Uncaught Exception:", err)
);
process.on("unhandledRejection", (reason) =>
  logger.error("Unhandled Rejection:", reason)
);

await initChainId();
startListeners();
logger.info("✅ 已启动 Transfer 事件监听");
