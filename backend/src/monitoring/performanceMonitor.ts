/**
 * 性能监控模块
 * 
 * 用于记录API性能数据，暴露Prometheus指标，并在性能异常时触发告警
 */

import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram, register, Gauge } from 'prom-client';
import { logger } from '../utils/logger';
import { SlackWebhook as SlackClient } from '../utils/notifications/slack';
import { config } from '../config';
import { TelegramBot } from '../utils/notifications/telegram';
import { EmailSender } from '../utils/notifications/email';

// 性能阈值配置
const PERFORMANCE_THRESHOLDS = {
  P95_LATENCY_MS: 500, // P95延迟阈值（毫秒）
  ERROR_RATE_PERCENT: 5, // 错误率阈值（百分比）
  CACHE_HIT_RATIO_MIN: 0.7, // 最小缓存命中率（70%）
  DB_QUERY_LATENCY_MS: 200 // 数据库查询延迟阈值（毫秒）
};

// 最近的性能数据
let recentLatencies: number[] = [];
const MAX_LATENCY_SAMPLES = 1000; // 最多保存1000个延迟样本
let lastAlertTime = 0; // 上次告警时间

// 初始化Prometheus指标
const httpRequestDurationMicroseconds = new Histogram({
  name: 'api_latency_seconds',
  help: 'API请求延迟（秒）',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10], // 10ms到10s的分布
});

const httpRequestCounter = new Counter({
  name: 'request_count_total',
  help: '总请求数',
  labelNames: ['method', 'route', 'status_code'],
});

// 请求计数器
const requestCounter = new Counter({
  name: 'api_request_count_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status']
});

// 请求延迟直方图
const requestLatency = new Histogram({
  name: 'api_latency_seconds',
  help: 'API request latency in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// 错误计数器
const errorCounter = new Counter({
  name: 'api_error_count_total',
  help: 'Total number of API errors',
  labelNames: ['method', 'route', 'error_type']
});

// 数据库查询延迟直方图
const dbQueryLatency = new Histogram({
  name: 'db_query_latency_seconds',
  help: 'Database query latency in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2]
});

// 缓存命中率
const cacheHitCounter = new Counter({
  name: 'cache_hit_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

const cacheMissCounter = new Counter({
  name: 'cache_miss_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
});

// 缓存命中率计算
const cacheHitRatio = new Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio',
  labelNames: ['cache_type'],
  collect() {
    const redisHits = cacheHitCounter.labels({ cache_type: 'redis' }).get();
    const redisMisses = cacheMissCounter.labels({ cache_type: 'redis' }).get();
    const total = redisHits + redisMisses;
    
    if (total > 0) {
      this.set({ cache_type: 'redis' }, redisHits / total);
    }
  }
});

// 活跃连接数
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type']
});

// 存储延迟数据用于计算百分位数
let latencyValues: number[] = [];
let dbLatencyValues: { [key: string]: number[] } = {};
let errorCount = 0;
let requestCount = 0;

/**
 * 计算百分位数
 * @param values 数值数组
 * @param percentile 百分位数（0-100）
 * @returns 百分位数值
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sortedValues = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * 发送性能告警
 * @param p95Latency P95延迟（毫秒）
 */
async function sendPerformanceAlert(alertType: string, value: number, threshold: number, details: any = {}): Promise<void> {
  const now = Date.now();
  
  // 检查是否在冷却期内
  if (now - lastAlertTime < (PERFORMANCE_THRESHOLDS as any).ALERT_COOLDOWN_MS) {
    return;
  }
  
  // 更新上次告警时间
  lastAlertTime = now;
  
  // 记录告警日志
  logger.warn(`性能告警: ${alertType} (${value}) 超过阈值 (${threshold})`, details);
  
  const alertMessage = `⚠️ *性能告警*\n*类型*: ${alertType}\n*当前值*: ${value}\n*阈值*: ${threshold}\n*环境*: ${(config as any).env}\n*时间*: ${new Date().toISOString()}`;
  
  // 发送Slack告警
  try {
    if ((config as any).notifications?.slack?.enabled) {
      const slackClient = new SlackClient((config as any).notifications.slack.webhookUrl);
      await slackClient.send({
        text: `⚠️ 性能告警: ${alertType} (${value}) 超过阈值 (${threshold})`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: alertMessage
            }
          }
        ]
      });
    }
  } catch (error: any) {
    logger.error('发送Slack告警失败', { error: error.message });
  }
  
  // 发送Telegram告警
  try {
    if ((config as any).notifications?.telegram?.enabled) {
      const telegramBot = new TelegramBot(
        (config as any).notifications.telegram.token,
        (config as any).notifications.telegram.chatId
      );
      await telegramBot.sendMessage(alertMessage);
    }
  } catch (error: any) {
    logger.error('发送Telegram告警失败', { error: error.message });
  }
  
  // 发送Email告警
  try {
    if ((config as any).notifications?.email?.enabled) {
      const emailSender = new EmailSender((config as any).notifications.email);
      await emailSender.sendEmail({
        subject: `[${(config as any).env}] 性能告警: ${alertType}`,
        text: alertMessage,
        html: `<h2>性能告警</h2>
               <p><strong>类型:</strong> ${alertType}</p>
               <p><strong>当前值:</strong> ${value}</p>
               <p><strong>阈值:</strong> ${threshold}</p>
               <p><strong>环境:</strong> ${(config as any).env}</p>
               <p><strong>时间:</strong> ${new Date().toISOString()}</p>
               <p><strong>详情:</strong> ${JSON.stringify(details)}</p>`
      });
    }
  } catch (error: any) {
    logger.error('发送Email告警失败', { error: error.message });
  }
}

/**
 * 性能监控中间件
 * 记录请求延迟并更新Prometheus指标
 */
export function performanceMonitor() {
  // 每小时重置性能统计数据
  setInterval(() => {
    resetPerformanceStats();
  }, 60 * 60 * 1000);
  
  // 每分钟检查性能指标
  setInterval(async () => {
    // 计算P95延迟
    const p95Latency = calculatePercentile(latencyValues, 95) * 1000; // 转换为毫秒
    
    // 计算错误率
    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
    
    // 计算缓存命中率
    const redisHits = cacheHitCounter.labels({ cache_type: 'redis' }).get();
    const redisMisses = cacheMissCounter.labels({ cache_type: 'redis' }).get();
    const cacheTotal = redisHits + redisMisses;
    const cacheHitRatioValue = cacheTotal > 0 ? redisHits / cacheTotal : 1;
    
    // 计算数据库查询P95延迟
    const dbP95Latencies: { [key: string]: number } = {};
    for (const [operation, values] of Object.entries(dbLatencyValues)) {
      dbP95Latencies[operation] = calculatePercentile(values, 95) * 1000; // 转换为毫秒
    }
    
    // 检查是否超过阈值
    if (p95Latency > PERFORMANCE_THRESHOLDS.P95_LATENCY_MS) {
      await sendPerformanceAlert('P95延迟', p95Latency, PERFORMANCE_THRESHOLDS.P95_LATENCY_MS, { latencyValues });
    }
    
    if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT) {
      await sendPerformanceAlert('错误率', errorRate, PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT, { errorCount, requestCount });
    }
    
    if (cacheHitRatioValue < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATIO_MIN && cacheTotal > 100) {
      await sendPerformanceAlert('缓存命中率', cacheHitRatioValue * 100, PERFORMANCE_THRESHOLDS.CACHE_HIT_RATIO_MIN * 100, { hits: redisHits, misses: redisMisses });
    }
    
    for (const [operation, latency] of Object.entries(dbP95Latencies)) {
      if (latency > PERFORMANCE_THRESHOLDS.DB_QUERY_LATENCY_MS) {
        await sendPerformanceAlert(`数据库查询延迟 (${operation})`, latency, PERFORMANCE_THRESHOLDS.DB_QUERY_LATENCY_MS, { operation });
      }
    }
    
    // 记录性能指标
    logger.info('性能指标', {
      p95Latency,
      errorRate,
      cacheHitRatio: cacheHitRatioValue,
      dbP95Latencies,
      activeConnections: {
        mongodb: activeConnections.labels({ type: 'mongodb' }).get(),
        redis: activeConnections.labels({ type: 'redis' }).get()
      }
    });
  }, 60 * 1000);
  
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    const path = req.path;
    const method = req.method;
    
    // 增加请求计数
    requestCount++;
    
    // 记录活跃连接
    activeConnections.labels({ type: 'http' }).inc();
    
    // 捕获响应
    const originalSend = res.send;
    res.send = function(body) {
      const diff = process.hrtime(start);
      const responseTimeInSeconds = diff[0] + diff[1] / 1e9;
      
      // 记录延迟
      requestLatency.labels({ method, route: path }).observe(responseTimeInSeconds);
      latencyValues.push(responseTimeInSeconds);
      
      // 记录请求状态
      const statusCode = res.statusCode;
      requestCounter.labels({ method, route: path, status: statusCode.toString() }).inc();
      
      // 记录错误
      if (statusCode >= 400) {
        errorCounter.labels({ 
          method, 
          route: path, 
          error_type: statusCode >= 500 ? 'server_error' : 'client_error' 
        }).inc();
        errorCount++;
      }
      
      // 减少活跃连接
      activeConnections.labels({ type: 'http' }).dec();
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * 记录数据库查询延迟
 */
export function recordDbQueryLatency(operation: string, collection: string, durationInSeconds: number): void {
  dbQueryLatency.labels({ operation, collection }).observe(durationInSeconds);
  
  if (!dbLatencyValues[operation]) {
    dbLatencyValues[operation] = [];
  }
  
  dbLatencyValues[operation].push(durationInSeconds);
}

/**
 * 记录缓存命中/未命中
 */
export function recordCacheHit(cacheType: string = 'redis'): void {
  cacheHitCounter.labels({ cache_type: cacheType }).inc();
}

export function recordCacheMiss(cacheType: string = 'redis'): void {
  cacheMissCounter.labels({ cache_type: cacheType }).inc();
}

/**
 * 记录数据库连接
 */
export function recordDbConnection(type: string, increment: boolean = true): void {
  if (increment) {
    activeConnections.labels({ type }).inc();
  } else {
    activeConnections.labels({ type }).dec();
  }
}

/**
 * 获取Prometheus指标
 * @returns Prometheus指标
 */
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

/**
 * 获取当前性能统计
 * @returns 性能统计数据
 */
export function getPerformanceStats() {
  const p95Latency = calculatePercentile(latencyValues, 95) * 1000; // 转换为毫秒
  const p99Latency = calculatePercentile(latencyValues, 99) * 1000; // 转换为毫秒
  
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
  
  const redisHits = cacheHitCounter.labels({ cache_type: 'redis' }).get();
  const redisMisses = cacheMissCounter.labels({ cache_type: 'redis' }).get();
  const cacheTotal = redisHits + redisMisses;
  const cacheHitRatioValue = cacheTotal > 0 ? redisHits / cacheTotal : 1;
  
  const dbP95Latencies: { [key: string]: number } = {};
  for (const [operation, values] of Object.entries(dbLatencyValues)) {
    dbP95Latencies[operation] = calculatePercentile(values, 95) * 1000; // 转换为毫秒
  }
  
  return {
    latency: {
      p95: p95Latency,
      p99: p99Latency
    },
    errorRate,
    cacheHitRatio: cacheHitRatioValue,
    dbLatency: dbP95Latencies,
    activeConnections: {
      mongodb: activeConnections.labels({ type: 'mongodb' }).get(),
      redis: activeConnections.labels({ type: 'redis' }).get(),
      http: activeConnections.labels({ type: 'http' }).get()
    },
    requestCount,
    errorCount
  };
}

/**
 * 重置性能统计数据
 */
export function resetPerformanceStats(): void {
  latencyValues = [];
  dbLatencyValues = {};
  errorCount = 0;
  requestCount = 0;
  logger.info('性能统计数据已重置');
}

// 导出Prometheus注册表
export { register as prometheusRegister }; 