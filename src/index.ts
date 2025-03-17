import 'dotenv/config';
import { Logger } from './utils/logger';
import { loadConfig } from '../config';
import { connectDatabase } from './database/db';
import { startApiServer } from './api/server';
import { EventPipeline } from './pipeline/eventPipeline';
import { BlockchainMonitor } from './blockchain/blockchainMonitor';
import { generateTraceId } from './utils/traceId';
import { PipelineMonitor } from './pipeline/pipelineMonitor';
import { Redis } from 'ioredis';

// 创建全局Logger实例
const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
});

/**
 * 应用程序主启动函数
 */
async function bootstrap(): Promise<void> {
  const traceId = generateTraceId();
  logger.info(`应用程序启动 [${traceId}]`, { 
    env: process.env.NODE_ENV, 
    version: process.env.PACKAGE_VERSION 
  });

  try {
    // 加载配置
    logger.info(`正在加载配置 [${traceId}]`);
    const config = loadConfig();
    
    // 初始化Redis客户端
    logger.info(`初始化Redis连接 [${traceId}]`);
    const redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    // 初始化数据库连接
    logger.info(`初始化数据库连接 [${traceId}]`);
    const db = await connectDatabase(config.database, logger);

    // 初始化流水线监控
    logger.info(`初始化流水线监控 [${traceId}]`);
    const pipelineMonitor = new PipelineMonitor(config.pipeline, logger);

    // 初始化事件处理流水线
    logger.info(`初始化事件处理流水线 [${traceId}]`);
    const pipeline = new EventPipeline(
      config.pipeline,
      logger,
      redis
    );

    // 启动区块链监听器
    logger.info(`启动区块链监听器 [${traceId}]`);
    const blockchainMonitor = new BlockchainMonitor(
      config.blockchain,
      logger,
      (event) => pipeline.processEvent(event)
    );
    await blockchainMonitor.start();

    // 启动API服务器
    logger.info(`启动API服务器 [${traceId}]`);
    const server = await startApiServer({
      port: config.api.port,
      logger,
      pipeline,
      pipelineMonitor,
      db,
    });

    // 注册进程信号处理
    process.on('SIGTERM', () => shutdown(server, redis, db, blockchainMonitor));
    process.on('SIGINT', () => shutdown(server, redis, db, blockchainMonitor));

    logger.info(`ChainIntelAI系统启动完成 [${traceId}]`, {
      apiPort: config.api.port,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    logger.error(`应用程序启动失败 [${traceId}]`, { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

/**
 * 优雅关闭应用程序
 */
async function shutdown(server: any, redis: Redis, db: any, blockchainMonitor: BlockchainMonitor): Promise<void> {
  const traceId = generateTraceId();
  logger.info(`开始优雅关闭服务 [${traceId}]`);
  
  try {
    // 关闭API服务器
    await new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => {
        if (err) return reject(err);
        resolve();
      });
    });
    logger.info(`API服务器已关闭 [${traceId}]`);

    // 关闭区块链监听器
    await blockchainMonitor.stop();
    logger.info(`区块链监听器已关闭 [${traceId}]`);

    // 关闭Redis连接
    await redis.quit();
    logger.info(`Redis连接已关闭 [${traceId}]`);

    // 关闭数据库连接
    await db.close();
    logger.info(`数据库连接已关闭 [${traceId}]`);

    logger.info(`服务已完全关闭 [${traceId}]`);
    process.exit(0);
  } catch (error) {
    logger.error(`关闭服务时发生错误 [${traceId}]`, {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// 启动应用程序
bootstrap(); 