import mongoose from "mongoose";
import { ethers } from "ethers";
import logger from "./config/logger.js";
import { config } from "./config.js";

// 健康检查状态
let isHealthy = true;

// 检查数据库连接
async function checkDatabase() {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    const db = mongoose.connection;

    // 检查数据库状态
    if (db.readyState !== 1) {
      throw new Error("数据库未连接");
    }

    // 检查集合是否存在
    const collections = await db.db.listCollections().toArray();
    const requiredCollections = ["transferevents", "eventstatus"];

    for (const collection of requiredCollections) {
      if (!collections.find((c) => c.name === collection)) {
        throw new Error(`缺少必要的集合: ${collection}`);
      }
    }

    logger.info("数据库健康检查通过");
    return true;
  } catch (error) {
    logger.error("数据库健康检查失败:", error);
    return false;
  }
}

// 检查区块链节点连接
async function checkBlockchainNode() {
  try {
    const provider = new ethers.WebSocketProvider(config.rpc.ws);

    // 检查节点连接
    const network = await provider.getNetwork();
    if (!network) {
      throw new Error("无法获取网络信息");
    }

    // 检查区块同步
    const latestBlock = await provider.getBlockNumber();
    if (!latestBlock) {
      throw new Error("无法获取最新区块");
    }

    logger.info("区块链节点健康检查通过", {
      chainId: network.chainId,
      latestBlock,
    });
    return true;
  } catch (error) {
    logger.error("区块链节点健康检查失败:", error);
    return false;
  }
}

// 检查日志系统
function checkLogging() {
  try {
    // 检查日志目录权限
    const fs = require("fs");
    const logDir = "./logs";

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 测试写入日志
    logger.info("日志系统健康检查");
    return true;
  } catch (error) {
    logger.error("日志系统健康检查失败:", error);
    return false;
  }
}

// 主健康检查函数
async function healthCheck() {
  try {
    const dbCheck = await checkDatabase();
    const nodeCheck = await checkBlockchainNode();
    const logCheck = checkLogging();

    isHealthy = dbCheck && nodeCheck && logCheck;

    if (!isHealthy) {
      logger.error("健康检查失败");
      process.exit(1);
    }

    logger.info("所有健康检查通过");
    process.exit(0);
  } catch (error) {
    logger.error("健康检查过程出错:", error);
    process.exit(1);
  }
}

// 启动健康检查
healthCheck();
