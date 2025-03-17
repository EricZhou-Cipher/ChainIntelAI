/**
 * 回归测试结果比较工具
 *
 * 该脚本比较当前性能测试结果与基准测试结果，检测性能退化
 *
 * 用法:
 * node compareRegressionResults.js --current-report=path/to/current.json --baseline-report=path/to/baseline.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseArgs } = require('util');

// 解析命令行参数
const options = {
  'current-report': { type: 'string' },
  'baseline-report': { type: 'string' },
  'output-file': { type: 'string', default: 'regression-comparison.md' },
  threshold: { type: 'number', default: 10 }, // 性能退化阈值（百分比）
};

const { values } = parseArgs({ options });

// 检查必要参数
if (!values['current-report'] || !values['baseline-report']) {
  console.error('错误: 必须提供当前报告和基准报告的路径');
  console.error(
    '用法: node compareRegressionResults.js --current-report=path/to/current.json --baseline-report=path/to/baseline.json'
  );
  process.exit(1);
}

// 读取报告文件
function readReportFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`读取文件 ${filePath} 失败:`, error.message);
    process.exit(1);
  }
}

// 获取Git提交信息
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const commitAuthor = execSync('git log -1 --pretty=%an').toString().trim();
    const commitDate = execSync('git log -1 --pretty=%cd --date=iso').toString().trim();

    return {
      commitHash,
      commitMessage,
      commitAuthor,
      commitDate,
    };
  } catch (error) {
    console.warn('获取Git信息失败:', error.message);
    return {
      commitHash: 'unknown',
      commitMessage: 'unknown',
      commitAuthor: 'unknown',
      commitDate: new Date().toISOString(),
    };
  }
}

// 计算百分比变化
function calculatePercentChange(current, baseline) {
  if (baseline === 0) return current === 0 ? 0 : 100;
  return ((current - baseline) / baseline) * 100;
}

// 格式化百分比变化
function formatPercentChange(change) {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

// 获取性能变化状态
function getChangeStatus(change, metric) {
  // 对于延迟和错误率，增加是不好的
  const isNegativeMetric = ['latency', 'errors'].some((term) =>
    metric.toLowerCase().includes(term)
  );

  if (Math.abs(change) < 2) return '🟢 无变化';

  if (isNegativeMetric) {
    if (change > values.threshold) return '🔴 显著退化';
    if (change > 5) return '🟠 轻微退化';
    if (change < -5) return '🟢 显著改善';
    return '🟢 轻微改善';
  } else {
    // 对于吞吐量，增加是好的
    if (change < -values.threshold) return '🔴 显著退化';
    if (change < -5) return '🟠 轻微退化';
    if (change > 5) return '🟢 显著改善';
    return '🟢 轻微改善';
  }
}

// 主函数
async function compareRegressionResults() {
  console.log('开始比较性能测试结果...');

  // 读取报告
  const currentReport = readReportFile(values['current-report']);
  const baselineReport = readReportFile(values['baseline-report']);

  // 获取Git信息
  const gitInfo = getGitInfo();

  // 提取关键指标
  const current = {
    timestamp: currentReport.timestamp,
    duration: currentReport.aggregate.duration,
    rps: {
      mean: currentReport.aggregate.rps.mean,
      max: currentReport.aggregate.rps.max,
    },
    latency: {
      min: currentReport.aggregate.latency.min,
      median: currentReport.aggregate.latency.median,
      p95: currentReport.aggregate.latency.p95,
      p99: currentReport.aggregate.latency.p99,
      max: currentReport.aggregate.latency.max,
    },
    scenarioCounts: {},
    scenarioDurations: {},
    errors: currentReport.aggregate.errors || {},
    errorRate:
      currentReport.aggregate.codes && currentReport.aggregate.codes['5xx']
        ? (currentReport.aggregate.codes['5xx'] / currentReport.aggregate.requestsCompleted) * 100
        : 0,
  };

  const baseline = {
    timestamp: baselineReport.timestamp,
    duration: baselineReport.aggregate.duration,
    rps: {
      mean: baselineReport.aggregate.rps.mean,
      max: baselineReport.aggregate.rps.max,
    },
    latency: {
      min: baselineReport.aggregate.latency.min,
      median: baselineReport.aggregate.latency.median,
      p95: baselineReport.aggregate.latency.p95,
      p99: baselineReport.aggregate.latency.p99,
      max: baselineReport.aggregate.latency.max,
    },
    scenarioCounts: {},
    scenarioDurations: {},
    errors: baselineReport.aggregate.errors || {},
    errorRate:
      baselineReport.aggregate.codes && baselineReport.aggregate.codes['5xx']
        ? (baselineReport.aggregate.codes['5xx'] / baselineReport.aggregate.requestsCompleted) * 100
        : 0,
  };

  // 提取场景信息
  currentReport.aggregate.scenarioCounts = currentReport.aggregate.scenarioCounts || {};
  baselineReport.aggregate.scenarioCounts = baselineReport.aggregate.scenarioCounts || {};

  Object.keys(currentReport.aggregate.scenarioCounts).forEach((scenario) => {
    current.scenarioCounts[scenario] = currentReport.aggregate.scenarioCounts[scenario];
  });

  Object.keys(baselineReport.aggregate.scenarioCounts).forEach((scenario) => {
    baseline.scenarioCounts[scenario] = baselineReport.aggregate.scenarioCounts[scenario];
  });

  // 计算变化
  const changes = {
    duration: calculatePercentChange(current.duration, baseline.duration),
    rps: {
      mean: calculatePercentChange(current.rps.mean, baseline.rps.mean),
      max: calculatePercentChange(current.rps.max, baseline.rps.max),
    },
    latency: {
      min: calculatePercentChange(current.latency.min, baseline.latency.min),
      median: calculatePercentChange(current.latency.median, baseline.latency.median),
      p95: calculatePercentChange(current.latency.p95, baseline.latency.p95),
      p99: calculatePercentChange(current.latency.p99, baseline.latency.p99),
      max: calculatePercentChange(current.latency.max, baseline.latency.max),
    },
    errorRate: calculatePercentChange(current.errorRate, baseline.errorRate),
  };

  // 检测性能退化
  const performanceIssues = [];

  if (changes.latency.p95 > values.threshold) {
    performanceIssues.push(`P95延迟增加了${formatPercentChange(changes.latency.p95)}`);
  }

  if (changes.latency.p99 > values.threshold) {
    performanceIssues.push(`P99延迟增加了${formatPercentChange(changes.latency.p99)}`);
  }

  if (changes.rps.mean < -values.threshold) {
    performanceIssues.push(`平均RPS下降了${formatPercentChange(-changes.rps.mean)}`);
  }

  if (changes.errorRate > 1) {
    performanceIssues.push(`错误率增加了${formatPercentChange(changes.errorRate)}`);
  }

  // 生成比较报告
  const comparisonReport = generateComparisonReport(
    current,
    baseline,
    changes,
    performanceIssues,
    gitInfo
  );

  // 写入报告文件
  const outputPath = path.resolve(process.cwd(), values['output-file']);
  fs.writeFileSync(outputPath, comparisonReport);

  console.log(`比较报告已生成: ${outputPath}`);

  // 如果没有性能退化，创建一个标记文件，表示可以更新基准
  if (performanceIssues.length === 0 && changes.latency.p95 < 0) {
    const updateBaselinePath = path.resolve(process.cwd(), 'regression-results/update-baseline');
    fs.writeFileSync(updateBaselinePath, 'Current performance is better than baseline');
    console.log('当前性能优于基准，已创建更新基准标记');
  }

  // 如果有严重的性能退化，退出代码非0
  if (performanceIssues.length > 0) {
    console.warn('检测到性能退化:');
    performanceIssues.forEach((issue) => console.warn(`- ${issue}`));

    // 如果是CI环境，可以考虑在严重退化时使测试失败
    if (process.env.CI && (changes.latency.p95 > 20 || changes.rps.mean < -20)) {
      console.error('严重性能退化，测试失败');
      process.exit(1);
    }
  } else {
    console.log('未检测到性能退化');
  }
}

// 生成比较报告
function generateComparisonReport(current, baseline, changes, performanceIssues, gitInfo) {
  const now = new Date().toISOString();

  let report = `# 性能回归测试报告\n\n`;
  report += `生成时间: ${now}\n\n`;

  // Git信息
  report += `## 提交信息\n\n`;
  report += `- **提交哈希**: \`${gitInfo.commitHash}\`\n`;
  report += `- **提交信息**: ${gitInfo.commitMessage}\n`;
  report += `- **提交作者**: ${gitInfo.commitAuthor}\n`;
  report += `- **提交日期**: ${gitInfo.commitDate}\n\n`;

  // 性能摘要
  report += `## 性能摘要\n\n`;

  if (performanceIssues.length > 0) {
    report += `### ⚠️ 检测到性能退化\n\n`;
    performanceIssues.forEach((issue) => {
      report += `- ${issue}\n`;
    });
    report += `\n`;
  } else {
    report += `### ✅ 未检测到性能退化\n\n`;

    if (changes.latency.p95 < 0) {
      report += `- P95延迟改善了${formatPercentChange(-changes.latency.p95)}\n`;
    }

    if (changes.rps.mean > 0) {
      report += `- 平均RPS提高了${formatPercentChange(changes.rps.mean)}\n`;
    }

    report += `\n`;
  }

  // 关键指标比较
  report += `## 关键指标比较\n\n`;
  report += `| 指标 | 基准 | 当前 | 变化 | 状态 |\n`;
  report += `|------|------|------|------|------|\n`;
  report += `| 平均RPS | ${baseline.rps.mean.toFixed(2)} | ${current.rps.mean.toFixed(2)} | ${formatPercentChange(changes.rps.mean)} | ${getChangeStatus(changes.rps.mean, 'rps')} |\n`;
  report += `| 最大RPS | ${baseline.rps.max.toFixed(2)} | ${current.rps.max.toFixed(2)} | ${formatPercentChange(changes.rps.max)} | ${getChangeStatus(changes.rps.max, 'rps')} |\n`;
  report += `| 中位数延迟 | ${baseline.latency.median.toFixed(2)}ms | ${current.latency.median.toFixed(2)}ms | ${formatPercentChange(changes.latency.median)} | ${getChangeStatus(changes.latency.median, 'latency')} |\n`;
  report += `| P95延迟 | ${baseline.latency.p95.toFixed(2)}ms | ${current.latency.p95.toFixed(2)}ms | ${formatPercentChange(changes.latency.p95)} | ${getChangeStatus(changes.latency.p95, 'latency')} |\n`;
  report += `| P99延迟 | ${baseline.latency.p99.toFixed(2)}ms | ${current.latency.p99.toFixed(2)}ms | ${formatPercentChange(changes.latency.p99)} | ${getChangeStatus(changes.latency.p99, 'latency')} |\n`;
  report += `| 最大延迟 | ${baseline.latency.max.toFixed(2)}ms | ${current.latency.max.toFixed(2)}ms | ${formatPercentChange(changes.latency.max)} | ${getChangeStatus(changes.latency.max, 'latency')} |\n`;
  report += `| 错误率 | ${baseline.errorRate.toFixed(2)}% | ${current.errorRate.toFixed(2)}% | ${formatPercentChange(changes.errorRate)} | ${getChangeStatus(changes.errorRate, 'errors')} |\n\n`;

  // 场景比较
  report += `## 场景比较\n\n`;
  report += `| 场景 | 基准计数 | 当前计数 | 变化 |\n`;
  report += `|------|----------|----------|------|\n`;

  // 合并所有场景
  const allScenarios = new Set([
    ...Object.keys(baseline.scenarioCounts),
    ...Object.keys(current.scenarioCounts),
  ]);

  allScenarios.forEach((scenario) => {
    const baselineCount = baseline.scenarioCounts[scenario] || 0;
    const currentCount = current.scenarioCounts[scenario] || 0;
    const change = calculatePercentChange(currentCount, baselineCount);

    report += `| ${scenario} | ${baselineCount} | ${currentCount} | ${formatPercentChange(change)} |\n`;
  });

  report += `\n`;

  // 建议
  report += `## 建议\n\n`;

  if (performanceIssues.length > 0) {
    report += `### 性能优化建议\n\n`;

    if (changes.latency.p95 > values.threshold) {
      report += `- **P95延迟增加**: 检查最近的代码变更，特别是数据库查询和外部API调用\n`;
      report += `- 考虑增加缓存或优化查询\n`;
    }

    if (changes.rps.mean < -values.threshold) {
      report += `- **RPS下降**: 检查API处理逻辑，可能存在新的性能瓶颈\n`;
      report += `- 考虑使用性能分析工具识别热点\n`;
    }

    if (changes.errorRate > 1) {
      report += `- **错误率增加**: 检查错误日志，可能存在新的错误情况\n`;
      report += `- 增强错误处理和监控\n`;
    }
  } else {
    report += `当前性能良好，无需特别优化。\n\n`;

    if (changes.latency.p95 < -10) {
      report += `- 👍 P95延迟显著改善，建议更新基准测试配置\n`;
    }
  }

  return report;
}

// 执行主函数
compareRegressionResults().catch((error) => {
  console.error('比较性能测试结果时出错:', error);
  process.exit(1);
});
