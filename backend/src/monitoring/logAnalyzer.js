/**
 * 日志分析工具
 *
 * 该脚本分析日志文件，检测错误模式和高频错误，并触发告警
 *
 * 用法:
 * const { startLogAnalysis, getErrorStats } = require('./logAnalyzer');
 * startLogAnalysis();
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const { SlackWebhook } = require('../utils/notifications/slack');
const { TelegramBot } = require('../utils/notifications/telegram');
const { EmailSender } = require('../utils/notifications/email');
const { config } = require('../config');

// 配置
const LOG_ANALYSIS_CONFIG = {
  ERROR_LOG_PATH: path.resolve(process.cwd(), '../logs/error.log'),
  ACCESS_LOG_PATH: path.resolve(process.cwd(), '../logs/access.log'),
  ANALYSIS_INTERVAL: 5 * 60 * 1000, // 5分钟
  ERROR_THRESHOLD: 10, // 错误次数阈值
  ERROR_RATE_THRESHOLD: 5, // 错误率阈值（百分比）
  TOP_ERRORS_COUNT: 3, // TOP N错误数量
  RECENT_WINDOW: 5 * 60 * 1000, // 最近时间窗口（5分钟）
  TREND_WINDOW_COUNT: 6, // 趋势窗口数量（6个窗口，共30分钟）
};

// 错误统计数据
let errorStats = {
  totalErrors: 0,
  totalRequests: 0,
  errorRate: 0,
  topErrors: [],
  errorTrend: [],
  lastAnalysisTime: Date.now(),
  errorsByStatusCode: {
    '4xx': 0,
    '5xx': 0,
  },
  errorsByType: {},
  recentErrors: [],
};

/**
 * 分析日志文件中的错误
 */
function analyzeErrorLogs() {
  try {
    if (!fs.existsSync(LOG_ANALYSIS_CONFIG.ERROR_LOG_PATH)) {
      logger.warn(`错误日志文件不存在: ${LOG_ANALYSIS_CONFIG.ERROR_LOG_PATH}`);
      return;
    }

    const logs = fs.readFileSync(LOG_ANALYSIS_CONFIG.ERROR_LOG_PATH, 'utf8').split('\n');
    const now = Date.now();
    const recentTime = now - LOG_ANALYSIS_CONFIG.RECENT_WINDOW;

    // 过滤最近的日志
    const recentLogs = logs.filter((log) => {
      if (!log.trim()) return false;

      try {
        // 尝试解析JSON格式日志
        const logData = JSON.parse(log);
        const logTime = new Date(logData.timestamp || logData.time || '').getTime();
        return !isNaN(logTime) && logTime > recentTime;
      } catch (e) {
        // 尝试解析传统格式日志
        const timestamp = log.match(/\[(.*?)\]/);
        if (timestamp) {
          const logTime = new Date(timestamp[1]).getTime();
          return !isNaN(logTime) && logTime > recentTime;
        }
        return false;
      }
    });

    // 分析错误类型
    const errorCounts = {};
    const errorsByStatusCode = { '4xx': 0, '5xx': 0 };
    const recentErrors = [];

    recentLogs.forEach((log) => {
      try {
        // 尝试解析JSON格式日志
        const logData = JSON.parse(log);
        const errorType = logData.message || 'Unknown Error';
        const statusCode = logData.statusCode || logData.status;

        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;

        if (statusCode) {
          if (statusCode >= 400 && statusCode < 500) {
            errorsByStatusCode['4xx']++;
          } else if (statusCode >= 500) {
            errorsByStatusCode['5xx']++;
          }
        }

        recentErrors.push({
          type: errorType,
          timestamp: logData.timestamp || logData.time,
          statusCode,
          details: logData,
        });
      } catch (e) {
        // 尝试解析传统格式日志
        const errorMatch = log.match(/\[(ERROR|WARN)\] (.+?):/);
        const statusMatch = log.match(/status(?:Code)?[=:]\s*(\d+)/i);

        if (errorMatch) {
          const errorType = errorMatch[2];
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;

          const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
          if (statusCode) {
            if (statusCode >= 400 && statusCode < 500) {
              errorsByStatusCode['4xx']++;
            } else if (statusCode >= 500) {
              errorsByStatusCode['5xx']++;
            }
          }

          recentErrors.push({
            type: errorType,
            timestamp: log.match(/\[(.*?)\]/)
              ? log.match(/\[(.*?)\]/)[1]
              : new Date().toISOString(),
            statusCode,
            details: log,
          });
        }
      }
    });

    // 计算总错误数
    const totalErrors = recentErrors.length;

    // 分析访问日志以获取总请求数
    let totalRequests = 0;
    try {
      if (fs.existsSync(LOG_ANALYSIS_CONFIG.ACCESS_LOG_PATH)) {
        const accessLogs = fs.readFileSync(LOG_ANALYSIS_CONFIG.ACCESS_LOG_PATH, 'utf8').split('\n');
        const recentAccessLogs = accessLogs.filter((log) => {
          if (!log.trim()) return false;
          const timestamp = log.match(/\[(.*?)\]/);
          if (timestamp) {
            const logTime = new Date(timestamp[1]).getTime();
            return !isNaN(logTime) && logTime > recentTime;
          }
          return false;
        });
        totalRequests = recentAccessLogs.length;
      }
    } catch (error) {
      logger.warn('分析访问日志失败:', error);
      // 如果无法获取总请求数，使用错误数的估计值
      totalRequests = Math.max(totalErrors * 10, 1); // 假设错误率约为10%
    }

    // 计算错误率
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // 获取TOP N错误
    const topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, LOG_ANALYSIS_CONFIG.TOP_ERRORS_COUNT)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
      }));

    // 更新错误统计数据
    errorStats = {
      totalErrors,
      totalRequests,
      errorRate,
      topErrors,
      errorsByStatusCode,
      errorsByType: errorCounts,
      recentErrors,
      lastAnalysisTime: now,
      errorTrend: [
        ...errorStats.errorTrend,
        {
          timestamp: now,
          errorRate,
          totalErrors,
          topErrors: topErrors.map((e) => ({ ...e })),
        },
      ].slice(-LOG_ANALYSIS_CONFIG.TREND_WINDOW_COUNT),
    };

    // 记录分析结果
    logger.info('日志分析结果', {
      totalErrors,
      totalRequests,
      errorRate: errorRate.toFixed(2) + '%',
      topErrors,
      errorsByStatusCode,
    });

    // 检查是否需要触发告警
    checkErrorThresholds();

    return errorStats;
  } catch (error) {
    logger.error('分析错误日志失败:', error);
    return null;
  }
}

/**
 * 检查错误阈值并触发告警
 */
function checkErrorThresholds() {
  const { totalErrors, errorRate, topErrors, errorTrend } = errorStats;

  // 检查错误数量是否超过阈值
  if (totalErrors > LOG_ANALYSIS_CONFIG.ERROR_THRESHOLD) {
    triggerErrorAlert('错误数量超过阈值', {
      totalErrors,
      threshold: LOG_ANALYSIS_CONFIG.ERROR_THRESHOLD,
      topErrors,
    });
  }

  // 检查错误率是否超过阈值
  if (errorRate > LOG_ANALYSIS_CONFIG.ERROR_RATE_THRESHOLD) {
    triggerErrorAlert('错误率超过阈值', {
      errorRate: errorRate.toFixed(2) + '%',
      threshold: LOG_ANALYSIS_CONFIG.ERROR_RATE_THRESHOLD + '%',
      topErrors,
    });
  }

  // 检查错误趋势（连续3个窗口错误率上升）
  if (errorTrend.length >= 3) {
    const last3 = errorTrend.slice(-3);
    if (last3[0].errorRate < last3[1].errorRate && last3[1].errorRate < last3[2].errorRate) {
      triggerErrorAlert('错误率持续上升', {
        currentErrorRate: errorRate.toFixed(2) + '%',
        trend: last3.map((t) => ({
          timestamp: new Date(t.timestamp).toISOString(),
          errorRate: t.errorRate.toFixed(2) + '%',
        })),
      });
    }
  }

  // 检查是否有高频错误（单个错误占比超过50%）
  const highFrequencyErrors = topErrors.filter((error) => error.percentage > 50);
  if (highFrequencyErrors.length > 0) {
    triggerErrorAlert('检测到高频错误', {
      highFrequencyErrors: highFrequencyErrors.map((e) => ({
        type: e.type,
        count: e.count,
        percentage: e.percentage.toFixed(2) + '%',
      })),
    });
  }
}

/**
 * 触发错误告警
 * @param {string} alertType 告警类型
 * @param {Object} details 告警详情
 */
async function triggerErrorAlert(alertType, details) {
  logger.warn(`错误告警: ${alertType}`, details);

  try {
    // 构建告警消息
    const alertMessage = buildAlertMessage(alertType, details);

    // 发送Slack告警
    if (config.notifications?.slack?.enabled) {
      const slackClient = new SlackWebhook(config.notifications.slack.webhookUrl);
      await slackClient.send({
        text: `🚨 错误告警: ${alertType}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: alertMessage,
            },
          },
        ],
      });
      logger.info('Slack错误告警已发送');
    }

    // 发送Telegram告警
    if (config.notifications?.telegram?.enabled) {
      const telegramBot = new TelegramBot(
        config.notifications.telegram.token,
        config.notifications.telegram.chatId
      );
      await telegramBot.sendMessage(alertMessage);
      logger.info('Telegram错误告警已发送');
    }

    // 发送Email告警
    if (config.notifications?.email?.enabled) {
      const emailSender = new EmailSender(config.notifications.email);
      await emailSender.sendEmail({
        subject: `[${config.environment}] 错误告警: ${alertType}`,
        text: alertMessage,
        html: alertMessage.replace(/\n/g, '<br>'),
      });
      logger.info('Email错误告警已发送');
    }
  } catch (error) {
    logger.error('发送错误告警失败:', error);
  }
}

/**
 * 构建告警消息
 * @param {string} alertType 告警类型
 * @param {Object} details 告警详情
 * @returns {string} 告警消息
 */
function buildAlertMessage(alertType, details) {
  let message = `🚨 *错误告警: ${alertType}*\n\n`;

  message += `*环境*: ${config.environment || 'development'}\n`;
  message += `*时间*: ${new Date().toISOString()}\n\n`;

  if (details.totalErrors !== undefined) {
    message += `*总错误数*: ${details.totalErrors}\n`;
    message += `*阈值*: ${details.threshold}\n\n`;
  }

  if (details.errorRate !== undefined) {
    message += `*错误率*: ${details.errorRate}\n`;
    message += `*阈值*: ${details.threshold}\n\n`;
  }

  if (details.trend) {
    message += `*错误率趋势*:\n`;
    details.trend.forEach((t) => {
      message += `- ${t.timestamp}: ${t.errorRate}\n`;
    });
    message += '\n';
  }

  if (details.topErrors) {
    message += `*TOP ${details.topErrors.length} 错误*:\n`;
    details.topErrors.forEach((error) => {
      message += `- ${error.type}: ${error.count} 次 (${error.percentage.toFixed(2)}%)\n`;
    });
    message += '\n';
  }

  if (details.highFrequencyErrors) {
    message += `*高频错误*:\n`;
    details.highFrequencyErrors.forEach((error) => {
      message += `- ${error.type}: ${error.count} 次 (${error.percentage})\n`;
    });
    message += '\n';
  }

  message += `*详情*: 请查看日志文件获取更多信息。`;

  return message;
}

/**
 * 获取错误统计数据
 * @returns {Object} 错误统计数据
 */
function getErrorStats() {
  return { ...errorStats };
}

/**
 * 启动日志分析
 * @returns {Function} 停止分析的函数
 */
function startLogAnalysis() {
  // 立即执行一次分析
  analyzeErrorLogs();

  // 定期执行分析
  const intervalId = setInterval(analyzeErrorLogs, LOG_ANALYSIS_CONFIG.ANALYSIS_INTERVAL);

  logger.info('日志分析已启动');

  // 返回停止函数
  return () => {
    clearInterval(intervalId);
    logger.info('日志分析已停止');
  };
}

// 导出函数
module.exports = {
  startLogAnalysis,
  getErrorStats,
  analyzeErrorLogs,
  triggerErrorAlert,
};
