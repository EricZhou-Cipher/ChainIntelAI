/**
 * 自动回滚工具
 *
 * 该脚本用于在性能严重恶化时自动回滚到上一个稳定版本
 *
 * 用法:
 * node autoRollback.js --trigger=performance --threshold=1000
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseArgs } = require('util');
const axios = require('axios');
const { logger } = require('../utils/logger');

// 解析命令行参数
const options = {
  trigger: { type: 'string', default: 'performance' }, // 触发回滚的原因：performance, error, manual
  threshold: { type: 'number', default: 1000 }, // P95延迟阈值（毫秒）
  'error-rate': { type: 'number', default: 20 }, // 错误率阈值（百分比）
  'monitor-url': { type: 'string', default: 'http://localhost:3000/metrics' }, // 性能监控URL
  'github-token': { type: 'string' }, // GitHub Token
  'github-repo': { type: 'string' }, // GitHub仓库
  'github-owner': { type: 'string' }, // GitHub仓库所有者
  kubernetes: { type: 'boolean', default: false }, // 是否使用Kubernetes
  'k8s-namespace': { type: 'string', default: 'default' }, // Kubernetes命名空间
  'k8s-deployment': { type: 'string' }, // Kubernetes部署名称
  'slack-webhook': { type: 'string' }, // Slack Webhook URL
};

const { values } = parseArgs({ options });

// 主函数
async function autoRollback() {
  logger.info('开始检查是否需要回滚...');

  try {
    // 获取当前性能指标
    const performanceMetrics = await getPerformanceMetrics();

    // 检查是否需要回滚
    const needsRollback = checkIfNeedsRollback(performanceMetrics);

    if (needsRollback) {
      logger.warn('检测到性能严重恶化，准备回滚', performanceMetrics);

      // 执行回滚
      await executeRollback(performanceMetrics);

      // 发送通知
      await sendRollbackNotification(performanceMetrics);

      logger.info('回滚完成');
    } else {
      logger.info('性能正常，无需回滚', performanceMetrics);
    }
  } catch (error) {
    logger.error('自动回滚失败:', error);
    process.exit(1);
  }
}

// 获取性能指标
async function getPerformanceMetrics() {
  try {
    // 如果提供了监控URL，从URL获取指标
    if (values['monitor-url']) {
      const response = await axios.get(values['monitor-url']);
      const metrics = response.data;

      // 解析Prometheus指标
      const p95Latency = parsePrometheusMetric(metrics, 'api_p95_latency_ms');
      const errorRate = parsePrometheusMetric(metrics, 'api_error_rate_percent');
      const cpuLoad = parsePrometheusMetric(metrics, 'node_cpu_load');
      const memoryUsage = parsePrometheusMetric(metrics, 'node_memory_usage_percent');

      return {
        p95Latency,
        errorRate,
        cpuLoad,
        memoryUsage,
      };
    }

    // 否则，从本地性能监控获取指标
    const { getPerformanceStats } = require('./localPerformanceMonitor');
    const stats = getPerformanceStats();

    return {
      p95Latency: stats.p95Latency,
      errorRate: stats.errorRate,
      cpuLoad: stats.avgCpuLoad,
      memoryUsage: stats.avgMemoryUsage,
    };
  } catch (error) {
    logger.error('获取性能指标失败:', error);
    throw error;
  }
}

// 解析Prometheus指标
function parsePrometheusMetric(metrics, metricName) {
  const regex = new RegExp(`${metricName}\\{.*?\\}\\s+([\\d\\.]+)`, 'g');
  const matches = [...metrics.matchAll(regex)];

  if (matches.length > 0) {
    return parseFloat(matches[0][1]);
  }

  return 0;
}

// 检查是否需要回滚
function checkIfNeedsRollback(metrics) {
  // 如果触发原因是性能
  if (values.trigger === 'performance') {
    return metrics.p95Latency > values.threshold || metrics.errorRate > values['error-rate'];
  }

  // 如果触发原因是错误率
  if (values.trigger === 'error') {
    return metrics.errorRate > values['error-rate'];
  }

  // 如果触发原因是手动
  if (values.trigger === 'manual') {
    return true;
  }

  return false;
}

// 执行回滚
async function executeRollback(metrics) {
  // 记录回滚原因
  const rollbackReason = {
    trigger: values.trigger,
    metrics,
    timestamp: new Date().toISOString(),
  };

  // 保存回滚记录
  const rollbackHistoryDir = path.resolve(process.cwd(), '../rollback-history');
  if (!fs.existsSync(rollbackHistoryDir)) {
    fs.mkdirSync(rollbackHistoryDir, { recursive: true });
  }

  const rollbackHistoryFile = path.join(rollbackHistoryDir, `rollback-${Date.now()}.json`);
  fs.writeFileSync(rollbackHistoryFile, JSON.stringify(rollbackReason, null, 2));

  // 如果使用Kubernetes
  if (values.kubernetes && values['k8s-deployment']) {
    await rollbackKubernetes();
    return;
  }

  // 如果使用GitHub Actions
  if (values['github-token'] && values['github-repo'] && values['github-owner']) {
    await triggerGitHubActionsRollback();
    return;
  }

  // 否则，执行本地回滚
  await localRollback();
}

// Kubernetes回滚
async function rollbackKubernetes() {
  logger.info('执行Kubernetes回滚...');

  try {
    // 获取部署历史
    const historyCommand = `kubectl rollout history deployment/${values['k8s-deployment']} -n ${values['k8s-namespace']}`;
    const history = execSync(historyCommand).toString();

    // 解析部署历史
    const revisions = history
      .split('\n')
      .slice(2)
      .map((line) => {
        const match = line.match(/^(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(Boolean);

    if (revisions.length <= 1) {
      logger.warn('没有可回滚的历史版本');
      return;
    }

    // 回滚到上一个版本
    const rollbackCommand = `kubectl rollout undo deployment/${values['k8s-deployment']} -n ${values['k8s-namespace']}`;
    execSync(rollbackCommand);

    logger.info('Kubernetes回滚成功');
  } catch (error) {
    logger.error('Kubernetes回滚失败:', error);
    throw error;
  }
}

// 触发GitHub Actions回滚
async function triggerGitHubActionsRollback() {
  logger.info('触发GitHub Actions回滚...');

  try {
    // 创建GitHub仓库分发事件
    const response = await axios.post(
      `https://api.github.com/repos/${values['github-owner']}/${values['github-repo']}/dispatches`,
      {
        event_type: 'rollback',
        client_payload: {
          trigger: values.trigger,
          p95Latency: metrics.p95Latency,
          errorRate: metrics.errorRate,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `token ${values['github-token']}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    logger.info('GitHub Actions回滚触发成功');
  } catch (error) {
    logger.error('GitHub Actions回滚触发失败:', error);
    throw error;
  }
}

// 本地回滚
async function localRollback() {
  logger.info('执行本地回滚...');

  try {
    // 检查是否在Git仓库中
    try {
      execSync('git rev-parse --is-inside-work-tree');
    } catch (error) {
      logger.error('当前目录不是Git仓库');
      return;
    }

    // 获取当前分支
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    // 创建回滚分支
    const rollbackBranch = `rollback-${Date.now()}`;
    execSync(`git checkout -b ${rollbackBranch}`);

    // 回滚到上一个提交
    execSync('git reset --hard HEAD~1');

    // 推送回滚分支
    execSync(`git push origin ${rollbackBranch}`);

    logger.info(`本地回滚成功，已创建回滚分支: ${rollbackBranch}`);

    // 切回原分支
    execSync(`git checkout ${currentBranch}`);
  } catch (error) {
    logger.error('本地回滚失败:', error);
    throw error;
  }
}

// 发送回滚通知
async function sendRollbackNotification(metrics) {
  logger.info('发送回滚通知...');

  try {
    // 如果配置了Slack Webhook
    if (values['slack-webhook']) {
      await axios.post(values['slack-webhook'], {
        text: '🔄 自动回滚已触发',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🔄 自动回滚已触发*\n*触发原因*: ${values.trigger}\n*P95延迟*: ${metrics.p95Latency.toFixed(2)}ms\n*错误率*: ${metrics.errorRate.toFixed(2)}%\n*时间*: ${new Date().toISOString()}`,
            },
          },
        ],
      });

      logger.info('Slack通知发送成功');
    }
  } catch (error) {
    logger.error('发送回滚通知失败:', error);
  }
}

// 执行主函数
if (require.main === module) {
  autoRollback().catch((error) => {
    logger.error('自动回滚失败:', error);
    process.exit(1);
  });
}

module.exports = {
  autoRollback,
  checkIfNeedsRollback,
  getPerformanceMetrics,
};
