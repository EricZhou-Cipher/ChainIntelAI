/**
 * 本地性能监控工具
 *
 * 该脚本实现了本地性能监控，包括CPU、内存、事件循环滞后和错误率监控，以及自动优化功能
 *
 * 用法:
 * const { startMonitoring, getPerformanceStats } = require('./localPerformanceMonitor');
 * startMonitoring();
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const { logger } = require('../utils/logger');
const { register, Gauge } = require('prom-client');

// 监控数据存储
let stats = {
  cpuLoad: [],
  memoryUsage: [],
  eventLoopLag: [],
  requestLatency: [],
  errorRate: 0,
  requestCount: 0,
  errorCount: 0,
  lastOptimization: 0,
  isApiDegraded: false,
  degradedEndpoints: new Set(),
  p95Latency: 0,
};

// 性能阈值配置
const PERFORMANCE_THRESHOLDS = {
  CPU_HIGH: 70, // CPU负载高阈值（百分比）
  CPU_CRITICAL: 85, // CPU负载临界阈值（百分比）
  MEMORY_HIGH: 75, // 内存使用高阈值（百分比）
  MEMORY_CRITICAL: 90, // 内存使用临界阈值（百分比）
  EVENT_LOOP_LAG_HIGH: 100, // 事件循环滞后高阈值（毫秒）
  EVENT_LOOP_LAG_CRITICAL: 200, // 事件循环滞后临界阈值（毫秒）
  ERROR_RATE_HIGH: 5, // 错误率高阈值（百分比）
  ERROR_RATE_CRITICAL: 15, // 错误率临界阈值（百分比）
  P95_LATENCY_HIGH: 500, // P95延迟高阈值（毫秒）
  P95_LATENCY_CRITICAL: 1000, // P95延迟临界阈值（毫秒）
  OPTIMIZATION_COOLDOWN: 60000, // 优化冷却时间（毫秒）
  STATS_HISTORY_SIZE: 60, // 历史数据保留数量
  COLLECTION_INTERVAL: 5000, // 数据收集间隔（毫秒）
};

// Prometheus指标
const cpuLoadGauge = new Gauge({
  name: 'node_cpu_load',
  help: 'CPU load average (1 minute)',
  labelNames: ['instance'],
});

const memoryUsageGauge = new Gauge({
  name: 'node_memory_usage_percent',
  help: 'Memory usage percentage',
  labelNames: ['instance'],
});

const eventLoopLagGauge = new Gauge({
  name: 'node_event_loop_lag_ms',
  help: 'Event loop lag in milliseconds',
  labelNames: ['instance'],
});

const errorRateGauge = new Gauge({
  name: 'api_error_rate_percent',
  help: 'API error rate percentage',
  labelNames: ['instance'],
});

const p95LatencyGauge = new Gauge({
  name: 'api_p95_latency_ms',
  help: 'API P95 latency in milliseconds',
  labelNames: ['instance'],
});

const apiDegradedGauge = new Gauge({
  name: 'api_degraded',
  help: 'API degradation status (0 = normal, 1 = degraded)',
  labelNames: ['instance'],
});

// 计算CPU负载
function getCpuLoad() {
  return (os.loadavg()[0] * 100) / os.cpus().length; // 转换为百分比并考虑CPU核心数
}

// 获取内存使用情况
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return ((totalMem - freeMem) / totalMem) * 100;
}

// 计算事件循环滞后 (event loop lag)
function measureEventLoopLag() {
  const start = process.hrtime();
  return new Promise((resolve) => {
    setTimeout(() => {
      const delta = process.hrtime(start);
      const lag = delta[0] * 1e3 + delta[1] / 1e6 - 0; // 转换为毫秒，减去预期的0毫秒
      resolve(lag);
    }, 0);
  });
}

// 计算错误率（从日志文件统计）
function getErrorRate() {
  try {
    const logDir = path.resolve(process.cwd(), '../logs');
    const logFile = path.join(logDir, 'error.log');

    if (!fs.existsSync(logFile)) {
      return stats.errorCount > 0 ? (stats.errorCount / Math.max(stats.requestCount, 1)) * 100 : 0;
    }

    const logs = fs.readFileSync(logFile, 'utf8').split('\n');
    const recentLogs = logs.filter((log) => {
      if (!log.trim()) return false;

      try {
        const logData = JSON.parse(log);
        const logTime = new Date(logData.timestamp || logData.time || '');
        return !isNaN(logTime.getTime()) && Date.now() - logTime.getTime() < 5 * 60 * 1000;
      } catch (e) {
        const timestamp = log.match(/\[(.*?)\]/);
        if (timestamp) {
          const logTime = new Date(timestamp[1]);
          return !isNaN(logTime.getTime()) && Date.now() - logTime.getTime() < 5 * 60 * 1000;
        }
        return false;
      }
    });

    const errorLogs = recentLogs.filter(
      (log) => log.includes('error') || log.includes('Error') || log.includes('ERROR')
    );
    return errorLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0;
  } catch (error) {
    logger.error('获取错误率失败:', error);
    return stats.errorCount > 0 ? (stats.errorCount / Math.max(stats.requestCount, 1)) * 100 : 0;
  }
}

// 计算P95延迟
function calculateP95Latency() {
  if (stats.requestLatency.length === 0) return 0;

  const sortedLatencies = [...stats.requestLatency].sort((a, b) => a - b);
  const idx = Math.floor(sortedLatencies.length * 0.95);
  return sortedLatencies[idx];
}

// 记录请求延迟
function recordRequestLatency(latencyMs) {
  stats.requestLatency.push(latencyMs);
  stats.requestCount++;

  // 保持历史数据大小
  if (stats.requestLatency.length > PERFORMANCE_THRESHOLDS.STATS_HISTORY_SIZE * 10) {
    stats.requestLatency = stats.requestLatency.slice(
      -PERFORMANCE_THRESHOLDS.STATS_HISTORY_SIZE * 5
    );
  }

  // 更新P95延迟
  if (stats.requestLatency.length % 10 === 0) {
    stats.p95Latency = calculateP95Latency();
  }
}

// 记录错误
function recordError() {
  stats.errorCount++;
}

// 收集性能数据
async function collectStats() {
  try {
    const cpuLoad = getCpuLoad();
    const memoryUsage = getMemoryUsage();
    const eventLoopLag = await measureEventLoopLag();
    const errorRate = getErrorRate();

    // 更新历史数据
    stats.cpuLoad.push(cpuLoad);
    stats.memoryUsage.push(memoryUsage);
    stats.eventLoopLag.push(eventLoopLag);
    stats.errorRate = errorRate;

    // 保持历史数据大小
    if (stats.cpuLoad.length > PERFORMANCE_THRESHOLDS.STATS_HISTORY_SIZE) {
      stats.cpuLoad.shift();
    }
    if (stats.memoryUsage.length > PERFORMANCE_THRESHOLDS.STATS_HISTORY_SIZE) {
      stats.memoryUsage.shift();
    }
    if (stats.eventLoopLag.length > PERFORMANCE_THRESHOLDS.STATS_HISTORY_SIZE) {
      stats.eventLoopLag.shift();
    }

    // 更新Prometheus指标
    cpuLoadGauge.set({ instance: 'app' }, cpuLoad);
    memoryUsageGauge.set({ instance: 'app' }, memoryUsage);
    eventLoopLagGauge.set({ instance: 'app' }, eventLoopLag);
    errorRateGauge.set({ instance: 'app' }, errorRate);
    p95LatencyGauge.set({ instance: 'app' }, stats.p95Latency);
    apiDegradedGauge.set({ instance: 'app' }, stats.isApiDegraded ? 1 : 0);

    // 记录性能日志
    if (process.env.NODE_ENV !== 'test') {
      logger.debug('性能指标', {
        cpuLoad,
        memoryUsage,
        eventLoopLag,
        errorRate,
        p95Latency: stats.p95Latency,
        isApiDegraded: stats.isApiDegraded,
        degradedEndpoints: Array.from(stats.degradedEndpoints),
      });
    }

    return {
      cpuLoad,
      memoryUsage,
      eventLoopLag,
      errorRate,
      p95Latency: stats.p95Latency,
    };
  } catch (error) {
    logger.error('收集性能数据失败:', error);
    return null;
  }
}

// 自动优化
async function autoOptimize() {
  try {
    // 检查是否在冷却期
    if (Date.now() - stats.lastOptimization < PERFORMANCE_THRESHOLDS.OPTIMIZATION_COOLDOWN) {
      return;
    }

    // 计算平均值
    const avgCpu = stats.cpuLoad.reduce((a, b) => a + b, 0) / stats.cpuLoad.length;
    const avgMem = stats.memoryUsage.reduce((a, b) => a + b, 0) / stats.memoryUsage.length;
    const avgLag = stats.eventLoopLag.reduce((a, b) => a + b, 0) / stats.eventLoopLag.length;

    // 检查是否需要降级API
    const needsDegradation =
      avgCpu > PERFORMANCE_THRESHOLDS.CPU_HIGH ||
      avgMem > PERFORMANCE_THRESHOLDS.MEMORY_HIGH ||
      avgLag > PERFORMANCE_THRESHOLDS.EVENT_LOOP_LAG_HIGH ||
      stats.errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_HIGH ||
      stats.p95Latency > PERFORMANCE_THRESHOLDS.P95_LATENCY_HIGH;

    // 检查是否需要重启应用
    const needsRestart =
      avgCpu > PERFORMANCE_THRESHOLDS.CPU_CRITICAL ||
      avgMem > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL ||
      avgLag > PERFORMANCE_THRESHOLDS.EVENT_LOOP_LAG_CRITICAL ||
      stats.errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL ||
      stats.p95Latency > PERFORMANCE_THRESHOLDS.P95_LATENCY_CRITICAL;

    if (needsRestart) {
      logger.error('🔥 服务器性能严重恶化，准备重启应用', {
        cpuLoad: avgCpu,
        memoryUsage: avgMem,
        eventLoopLag: avgLag,
        errorRate: stats.errorRate,
        p95Latency: stats.p95Latency,
      });

      // 记录优化时间
      stats.lastOptimization = Date.now();

      // 触发应用重启
      if (process.env.NODE_ENV === 'production') {
        // 在生产环境中，我们可以通过退出进程来触发PM2或Docker的自动重启
        setTimeout(() => {
          logger.warn('应用即将重启...');
          process.exit(1);
        }, 1000);
      } else {
        logger.warn('非生产环境，跳过应用重启');
      }

      return;
    }

    if (needsDegradation && !stats.isApiDegraded) {
      logger.warn('⚠️ 服务器负载过高，正在降级API', {
        cpuLoad: avgCpu,
        memoryUsage: avgMem,
        eventLoopLag: avgLag,
        errorRate: stats.errorRate,
        p95Latency: stats.p95Latency,
      });

      // 降级API
      stats.isApiDegraded = true;

      // 确定需要降级的端点
      identifyEndpointsToDegrade();

      // 记录优化时间
      stats.lastOptimization = Date.now();

      return;
    }

    // 检查是否可以恢复API
    if (stats.isApiDegraded) {
      const canRecover =
        avgCpu < PERFORMANCE_THRESHOLDS.CPU_HIGH - 10 &&
        avgMem < PERFORMANCE_THRESHOLDS.MEMORY_HIGH - 10 &&
        avgLag < PERFORMANCE_THRESHOLDS.EVENT_LOOP_LAG_HIGH - 20 &&
        stats.errorRate < PERFORMANCE_THRESHOLDS.ERROR_RATE_HIGH - 1 &&
        stats.p95Latency < PERFORMANCE_THRESHOLDS.P95_LATENCY_HIGH - 100;

      if (canRecover) {
        logger.info('✅ 服务器负载恢复正常，取消API降级', {
          cpuLoad: avgCpu,
          memoryUsage: avgMem,
          eventLoopLag: avgLag,
          errorRate: stats.errorRate,
          p95Latency: stats.p95Latency,
        });

        // 恢复API
        stats.isApiDegraded = false;
        stats.degradedEndpoints.clear();

        // 记录优化时间
        stats.lastOptimization = Date.now();
      }
    }
  } catch (error) {
    logger.error('自动优化失败:', error);
  }
}

// 确定需要降级的端点
function identifyEndpointsToDegrade() {
  // 这里可以根据实际情况确定需要降级的端点
  // 例如，可以降级一些非核心但资源消耗大的端点
  stats.degradedEndpoints.add('/api/analyze/batch');
  stats.degradedEndpoints.add('/api/historical-data');
  stats.degradedEndpoints.add('/api/reports/generate');
}

// API降级中间件
function apiDegradationMiddleware(req, res, next) {
  if (stats.isApiDegraded && stats.degradedEndpoints.has(req.path)) {
    return res.status(503).json({
      error: '服务器负载过高，此API暂时降级',
      retryAfter: Math.ceil(PERFORMANCE_THRESHOLDS.OPTIMIZATION_COOLDOWN / 1000),
    });
  }
  next();
}

// 请求监控中间件
function requestMonitoringMiddleware(req, res, next) {
  const start = Date.now();

  // 捕获响应
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;

    // 记录请求延迟
    recordRequestLatency(duration);

    // 记录错误
    if (res.statusCode >= 500) {
      recordError();
    }

    // 调用原始的send方法
    return originalSend.call(this, body);
  };

  next();
}

// 启动监控
function startMonitoring() {
  // 初始化监控数据
  stats = {
    cpuLoad: [],
    memoryUsage: [],
    eventLoopLag: [],
    requestLatency: [],
    errorRate: 0,
    requestCount: 0,
    errorCount: 0,
    lastOptimization: 0,
    isApiDegraded: false,
    degradedEndpoints: new Set(),
    p95Latency: 0,
  };

  // 定期收集性能数据
  const statsInterval = setInterval(async () => {
    await collectStats();
  }, PERFORMANCE_THRESHOLDS.COLLECTION_INTERVAL);

  // 定期执行自动优化
  const optimizeInterval = setInterval(async () => {
    await autoOptimize();
  }, PERFORMANCE_THRESHOLDS.COLLECTION_INTERVAL * 2);

  logger.info('本地性能监控已启动');

  // 返回清理函数
  return () => {
    clearInterval(statsInterval);
    clearInterval(optimizeInterval);
    logger.info('本地性能监控已停止');
  };
}

// 获取性能统计数据
function getPerformanceStats() {
  return {
    cpuLoad: stats.cpuLoad.length > 0 ? stats.cpuLoad[stats.cpuLoad.length - 1] : 0,
    memoryUsage: stats.memoryUsage.length > 0 ? stats.memoryUsage[stats.memoryUsage.length - 1] : 0,
    eventLoopLag:
      stats.eventLoopLag.length > 0 ? stats.eventLoopLag[stats.eventLoopLag.length - 1] : 0,
    errorRate: stats.errorRate,
    p95Latency: stats.p95Latency,
    requestCount: stats.requestCount,
    errorCount: stats.errorCount,
    isApiDegraded: stats.isApiDegraded,
    degradedEndpoints: Array.from(stats.degradedEndpoints),
    avgCpuLoad:
      stats.cpuLoad.length > 0
        ? stats.cpuLoad.reduce((a, b) => a + b, 0) / stats.cpuLoad.length
        : 0,
    avgMemoryUsage:
      stats.memoryUsage.length > 0
        ? stats.memoryUsage.reduce((a, b) => a + b, 0) / stats.memoryUsage.length
        : 0,
    avgEventLoopLag:
      stats.eventLoopLag.length > 0
        ? stats.eventLoopLag.reduce((a, b) => a + b, 0) / stats.eventLoopLag.length
        : 0,
  };
}

// 获取Prometheus指标
async function getMetrics() {
  return await register.metrics();
}

// 导出函数
module.exports = {
  startMonitoring,
  getPerformanceStats,
  getMetrics,
  apiDegradationMiddleware,
  requestMonitoringMiddleware,
  recordRequestLatency,
  recordError,
};
