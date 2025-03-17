const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { logger } = require('../utils/logger');
const {
  startMonitoring,
  apiDegradationMiddleware,
  requestMonitoringMiddleware,
  getMetrics,
} = require('../monitoring/localPerformanceMonitor');
const { startLogAnalysis, getErrorStats } = require('../monitoring/logAnalyzer');

// 创建Express应用
const app = express();

// 启动性能监控
const stopMonitoring = startMonitoring();

// 启动日志分析
const stopLogAnalysis = startLogAnalysis();

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // CORS
app.use(compression()); // 压缩
app.use(express.json()); // JSON解析
app.use(requestMonitoringMiddleware); // 请求监控
app.use(apiDegradationMiddleware); // API降级

// 路由
app.use('/api', require('./routes'));

// 健康检查端点
app.get('/health', (req, res) => {
  const { getPerformanceStats } = require('../monitoring/localPerformanceMonitor');
  const stats = getPerformanceStats();
  const errorStats = getErrorStats();

  const status = stats.isApiDegraded ? 'degraded' : 'ok';

  res.json({
    status,
    version: process.env.PACKAGE_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    degradedEndpoints: stats.degradedEndpoints,
    metrics: {
      cpuLoad: stats.cpuLoad,
      memoryUsage: stats.memoryUsage,
      p95Latency: stats.p95Latency,
      errorRate: stats.errorRate,
    },
    errors: {
      totalErrors: errorStats.totalErrors,
      errorRate: errorStats.errorRate,
      topErrors: errorStats.topErrors,
    },
  });
});

// Prometheus指标端点
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('获取指标失败:', error);
    res.status(500).send('获取指标失败');
  }
});

// 错误统计端点
app.get('/error-stats', (req, res) => {
  try {
    const errorStats = getErrorStats();
    res.json(errorStats);
  } catch (error) {
    logger.error('获取错误统计失败:', error);
    res.status(500).json({ error: '获取错误统计失败' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('API错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
function startServer(port = process.env.PORT || 3000) {
  const server = app.listen(port, () => {
    logger.info(`API服务器已启动，监听端口 ${port}`);
  });

  // 优雅关闭
  process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，正在关闭服务器...');

    // 停止性能监控
    stopMonitoring();

    // 停止日志分析
    stopLogAnalysis();

    server.close(() => {
      logger.info('服务器已关闭');
      process.exit(0);
    });
  });

  return server;
}

module.exports = { app, startServer };
