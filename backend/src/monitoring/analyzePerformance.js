/**
 * 性能分析工具
 *
 * 该脚本分析负载测试结果，检测性能问题，并与基准性能进行比较
 *
 * 用法:
 * node analyzePerformance.js --report-dir=path/to/reports --compare-with-baseline=true
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseArgs } = require('util');
const axios = require('axios');

// 解析命令行参数
const options = {
  'report-dir': { type: 'string', default: './load-test-results' },
  'output-file': { type: 'string', default: 'performance-analysis.json' },
  'compare-with-baseline': { type: 'boolean', default: false },
  'baseline-dir': { type: 'string', default: 's3://chainintel-test-reports/baseline-performance' },
  threshold: { type: 'number', default: 10 }, // 性能退化阈值（百分比）
};

const { values } = parseArgs({ options });

// 性能阈值
const PERFORMANCE_THRESHOLDS = {
  P95_LATENCY_MS: 500, // P95延迟阈值（毫秒）
  ERROR_RATE_PERCENT: 5, // 错误率阈值（百分比）
  MIN_RPS: 50, // 最小RPS阈值
};

// 主函数
async function analyzePerformanceReport() {
  console.log('开始分析性能报告...');

  // 读取性能报告
  const reportPath = path.join(values['report-dir'], 'report.json');

  if (!fs.existsSync(reportPath)) {
    console.error(`错误: 性能报告文件不存在: ${reportPath}`);
    process.exit(1);
  }

  const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  // 提取性能指标
  const metrics = extractPerformanceMetrics(reportData);

  // 如果需要与基准比较
  let baselineMetrics = null;
  let comparison = null;

  if (values['compare-with-baseline']) {
    try {
      baselineMetrics = await getBaselineMetrics();
      comparison = compareWithBaseline(metrics, baselineMetrics);
      console.log('与基准性能比较完成');
    } catch (error) {
      console.warn('获取基准性能数据失败:', error.message);
      console.log('将使用当前性能作为基准');
    }
  }

  // 检查性能警报
  const alerts = checkPerformanceAlerts(metrics);

  // 生成分析结果
  const analysis = {
    timestamp: new Date().toISOString(),
    gitCommit: getGitCommit(),
    metrics,
    baselineMetrics,
    comparison,
    alerts,
    thresholds: PERFORMANCE_THRESHOLDS,
  };

  // 保存分析结果
  const outputPath = path.resolve(process.cwd(), values['output-file']);
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  console.log(`性能分析结果已保存: ${outputPath}`);

  // 如果有严重警报，输出警告
  if (alerts.some((alert) => alert.severity === 'high')) {
    console.warn('⚠️ 检测到严重性能问题:');
    alerts
      .filter((alert) => alert.severity === 'high')
      .forEach((alert) => {
        console.warn(`- ${alert.message}`);
      });
  }

  // 如果与基准比较检测到性能退化，输出警告
  if (comparison && comparison.hasRegression) {
    console.warn('⚠️ 检测到性能退化:');
    comparison.regressions.forEach((regression) => {
      console.warn(`- ${regression.message}`);
    });
  }

  return analysis;
}

// 提取性能指标
function extractPerformanceMetrics(reportData) {
  const aggregate = reportData.aggregate;

  // 计算错误率
  const totalRequests = aggregate.counters?.['vusers.created'] || 0;
  const successfulRequests = aggregate.counters?.['vusers.completed'] || 0;
  const failedRequests = aggregate.counters?.['vusers.failed'] || 0;

  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  // 提取HTTP错误
  const httpErrors = {};
  Object.entries(aggregate.codes || {}).forEach(([code, count]) => {
    if (parseInt(code, 10) >= 400) {
      httpErrors[code] = count;
    }
  });

  // 提取场景统计
  const scenarios = {};
  Object.entries(aggregate.scenarioCounts || {}).forEach(([name, count]) => {
    scenarios[name] = {
      count,
      rate: totalRequests > 0 ? (count / totalRequests) * 100 : 0,
    };
  });

  // 提取数据库和缓存指标（如果存在）
  const dbLatency = reportData.customStats?.dbLatency || {};
  const cacheHitRatio = reportData.customStats?.cacheHitRatio || 0;

  return {
    timestamp: reportData.timestamp,
    duration: aggregate.duration,
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate,
    errorRate,
    rps: {
      mean: aggregate.rps.mean,
      max: aggregate.rps.max,
    },
    latency: {
      min: aggregate.latency.min,
      median: aggregate.latency.median,
      p95: aggregate.latency.p95,
      p99: aggregate.latency.p99,
      max: aggregate.latency.max,
    },
    scenarios,
    httpErrors,
    dbLatency,
    cacheHitRatio,
  };
}

// 检查性能警报
function checkPerformanceAlerts(metrics) {
  const alerts = [];

  // 检查P95延迟
  if (metrics.latency.p95 > PERFORMANCE_THRESHOLDS.P95_LATENCY_MS) {
    alerts.push({
      type: 'latency',
      message: `P95延迟 (${metrics.latency.p95.toFixed(2)}ms) 超过阈值 (${PERFORMANCE_THRESHOLDS.P95_LATENCY_MS}ms)`,
      severity: 'high',
      value: metrics.latency.p95,
      threshold: PERFORMANCE_THRESHOLDS.P95_LATENCY_MS,
    });
  }

  // 检查错误率
  if (metrics.errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT) {
    alerts.push({
      type: 'error_rate',
      message: `错误率 (${metrics.errorRate.toFixed(2)}%) 超过阈值 (${PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT}%)`,
      severity: 'high',
      value: metrics.errorRate,
      threshold: PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT,
    });
  }

  // 检查RPS
  if (metrics.rps.mean < PERFORMANCE_THRESHOLDS.MIN_RPS) {
    alerts.push({
      type: 'rps',
      message: `平均RPS (${metrics.rps.mean.toFixed(2)}) 低于阈值 (${PERFORMANCE_THRESHOLDS.MIN_RPS})`,
      severity: 'medium',
      value: metrics.rps.mean,
      threshold: PERFORMANCE_THRESHOLDS.MIN_RPS,
    });
  }

  // 检查P99延迟
  if (metrics.latency.p99 > PERFORMANCE_THRESHOLDS.P95_LATENCY_MS * 2) {
    alerts.push({
      type: 'latency',
      message: `P99延迟 (${metrics.latency.p99.toFixed(2)}ms) 显著高于P95阈值的两倍 (${PERFORMANCE_THRESHOLDS.P95_LATENCY_MS * 2}ms)`,
      severity: 'medium',
      value: metrics.latency.p99,
      threshold: PERFORMANCE_THRESHOLDS.P95_LATENCY_MS * 2,
    });
  }

  // 检查HTTP错误
  const httpErrorCount = Object.values(metrics.httpErrors).reduce((sum, count) => sum + count, 0);
  if (httpErrorCount > 0) {
    alerts.push({
      type: 'http_errors',
      message: `检测到${httpErrorCount}个HTTP错误`,
      severity: httpErrorCount > metrics.totalRequests * 0.05 ? 'high' : 'medium',
      value: httpErrorCount,
      details: metrics.httpErrors,
    });
  }

  return alerts;
}

// 获取基准性能指标
async function getBaselineMetrics() {
  // 如果基准目录是S3路径
  if (values['baseline-dir'].startsWith('s3://')) {
    return await getBaselineFromS3();
  }

  // 否则从本地文件读取
  const baselinePath = path.join(values['baseline-dir'], 'baseline-metrics.json');

  if (!fs.existsSync(baselinePath)) {
    throw new Error(`基准性能文件不存在: ${baselinePath}`);
  }

  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

// 从S3获取基准性能指标
async function getBaselineFromS3() {
  try {
    // 解析S3路径
    const s3Path = values['baseline-dir'];
    const bucketName = s3Path.split('/')[2];
    const keyPrefix = s3Path.split('/').slice(3).join('/');

    // 使用AWS CLI获取最新的基准文件
    const command = `aws s3 ls s3://${bucketName}/${keyPrefix}/ --recursive | sort | tail -n 1`;
    const result = execSync(command).toString().trim();

    if (!result) {
      throw new Error('未找到基准性能文件');
    }

    // 提取文件路径
    const latestFile = result.split(' ').pop();
    const downloadCommand = `aws s3 cp s3://${bucketName}/${latestFile} ./baseline-metrics.json`;
    execSync(downloadCommand);

    // 读取下载的文件
    const baselinePath = './baseline-metrics.json';
    const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

    // 清理临时文件
    fs.unlinkSync(baselinePath);

    return baselineData;
  } catch (error) {
    console.error('从S3获取基准性能失败:', error.message);

    // 尝试使用最近的性能报告作为基准
    try {
      const recentReports = fs
        .readdirSync(values['report-dir'])
        .filter((file) => file.endsWith('.json') && file !== 'report.json')
        .sort()
        .reverse();

      if (recentReports.length > 0) {
        const recentReport = JSON.parse(
          fs.readFileSync(path.join(values['report-dir'], recentReports[0]), 'utf8')
        );
        return extractPerformanceMetrics(recentReport);
      }
    } catch (err) {
      console.warn('尝试使用最近的性能报告作为基准失败:', err.message);
    }

    throw new Error('无法获取基准性能数据');
  }
}

// 与基准性能比较
function compareWithBaseline(current, baseline) {
  const regressions = [];
  const improvements = [];

  // 计算百分比变化
  const calculatePercentChange = (current, baseline) => {
    if (baseline === 0) return current === 0 ? 0 : 100;
    return ((current - baseline) / baseline) * 100;
  };

  // 比较延迟
  const latencyChange = {
    median: calculatePercentChange(current.latency.median, baseline.latency.median),
    p95: calculatePercentChange(current.latency.p95, baseline.latency.p95),
    p99: calculatePercentChange(current.latency.p99, baseline.latency.p99),
  };

  // 比较RPS
  const rpsChange = {
    mean: calculatePercentChange(current.rps.mean, baseline.rps.mean),
  };

  // 比较错误率
  const errorRateChange = calculatePercentChange(current.errorRate, baseline.errorRate);

  // 检查性能退化
  const threshold = values.threshold;

  // 检查延迟退化
  if (latencyChange.p95 > threshold) {
    regressions.push({
      metric: 'p95_latency',
      message: `P95延迟增加了${latencyChange.p95.toFixed(2)}% (${baseline.latency.p95.toFixed(2)}ms -> ${current.latency.p95.toFixed(2)}ms)`,
      change: latencyChange.p95,
      severity: latencyChange.p95 > threshold * 2 ? 'high' : 'medium',
    });
  }

  if (latencyChange.p99 > threshold) {
    regressions.push({
      metric: 'p99_latency',
      message: `P99延迟增加了${latencyChange.p99.toFixed(2)}% (${baseline.latency.p99.toFixed(2)}ms -> ${current.latency.p99.toFixed(2)}ms)`,
      change: latencyChange.p99,
      severity: latencyChange.p99 > threshold * 2 ? 'high' : 'medium',
    });
  }

  // 检查RPS退化
  if (rpsChange.mean < -threshold) {
    regressions.push({
      metric: 'mean_rps',
      message: `平均RPS下降了${Math.abs(rpsChange.mean).toFixed(2)}% (${baseline.rps.mean.toFixed(2)} -> ${current.rps.mean.toFixed(2)})`,
      change: rpsChange.mean,
      severity: rpsChange.mean < -threshold * 2 ? 'high' : 'medium',
    });
  }

  // 检查错误率增加
  if (errorRateChange > threshold && current.errorRate > 1) {
    regressions.push({
      metric: 'error_rate',
      message: `错误率增加了${errorRateChange.toFixed(2)}% (${baseline.errorRate.toFixed(2)}% -> ${current.errorRate.toFixed(2)}%)`,
      change: errorRateChange,
      severity: 'high',
    });
  }

  // 检查性能改进
  if (latencyChange.p95 < -threshold) {
    improvements.push({
      metric: 'p95_latency',
      message: `P95延迟减少了${Math.abs(latencyChange.p95).toFixed(2)}% (${baseline.latency.p95.toFixed(2)}ms -> ${current.latency.p95.toFixed(2)}ms)`,
      change: latencyChange.p95,
    });
  }

  if (rpsChange.mean > threshold) {
    improvements.push({
      metric: 'mean_rps',
      message: `平均RPS增加了${rpsChange.mean.toFixed(2)}% (${baseline.rps.mean.toFixed(2)} -> ${current.rps.mean.toFixed(2)})`,
      change: rpsChange.mean,
    });
  }

  return {
    hasRegression: regressions.length > 0,
    hasImprovement: improvements.length > 0,
    regressions,
    improvements,
    changes: {
      latency: latencyChange,
      rps: rpsChange,
      errorRate: errorRateChange,
    },
    p95LatencyChange: latencyChange.p95,
    meanRpsChange: rpsChange.mean,
  };
}

// 获取Git提交信息
function getGitCommit() {
  try {
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const commitAuthor = execSync('git log -1 --pretty=%an').toString().trim();
    const commitDate = execSync('git log -1 --pretty=%cd --date=iso').toString().trim();

    return {
      hash: commitHash,
      message: commitMessage,
      author: commitAuthor,
      date: commitDate,
    };
  } catch (error) {
    console.warn('获取Git信息失败:', error.message);
    return {
      hash: 'unknown',
      message: 'unknown',
      author: 'unknown',
      date: new Date().toISOString(),
    };
  }
}

// 主函数
async function analyzePerformance() {
  try {
    const analysis = await analyzePerformanceReport();

    // 如果需要更新基准
    if (
      analysis.comparison &&
      analysis.comparison.hasImprovement &&
      !analysis.comparison.hasRegression
    ) {
      const shouldUpdateBaseline = analysis.comparison.improvements.some(
        (improvement) => Math.abs(improvement.change) > values.threshold * 2
      );

      if (shouldUpdateBaseline) {
        console.log('检测到显著性能改进，建议更新基准');

        // 保存当前指标作为新的基准
        const baselinePath = path.resolve(process.cwd(), 'baseline-metrics.json');
        fs.writeFileSync(baselinePath, JSON.stringify(analysis.metrics, null, 2));

        // 如果基准目录是S3路径，上传到S3
        if (values['baseline-dir'].startsWith('s3://')) {
          try {
            const s3Path = values['baseline-dir'];
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uploadCommand = `aws s3 cp ${baselinePath} ${s3Path}/baseline-metrics-${timestamp}.json`;
            execSync(uploadCommand);
            console.log(`新基准已上传到: ${s3Path}/baseline-metrics-${timestamp}.json`);
          } catch (error) {
            console.error('上传基准到S3失败:', error.message);
          }
        }
      }
    }

    return analysis;
  } catch (error) {
    console.error('性能分析失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
analyzePerformance().catch((error) => {
  console.error('性能分析失败:', error);
  process.exit(1);
});
