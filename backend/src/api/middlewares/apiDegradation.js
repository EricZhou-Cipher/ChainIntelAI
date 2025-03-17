/**
 * API降级中间件
 *
 * 该中间件用于在服务器负载过高时降级API，减轻服务器负担
 */

const { apiDegradationMiddleware } = require('../../monitoring/localPerformanceMonitor');

/**
 * API降级中间件
 *
 * 当服务器负载过高时，会降级一些非核心但资源消耗大的API
 * 降级的API会返回503状态码，并提示客户端稍后重试
 *
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
function degradationMiddleware(req, res, next) {
  // 使用本地性能监控的API降级中间件
  return apiDegradationMiddleware(req, res, next);
}

module.exports = degradationMiddleware;
