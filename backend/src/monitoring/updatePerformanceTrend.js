/**
 * 性能趋势更新脚本
 *
 * 更新性能趋势数据，用于生成历史性能报告
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// 解析命令行参数
program
  .option('--report-dir <dir>', '负载测试报告目录', './load-test-results')
  .option('--trend-file <file>', '趋势数据文件', './performance-trends/trend.json')
  .option('--max-entries <number>', '最大趋势条目数', 100)
  .parse(process.argv);

const options = program.opts();
const reportDir = options.reportDir;
const trendFile = options.trendFile;
const maxEntries = parseInt(options.maxEntries, 10);

/**
 * 更新性能趋势数据
 */
async function updatePerformanceTrend() {
  try {
    console.log(`更新性能趋势数据: ${trendFile}`);

    // 读取性能分析结果
    const analysisPath = path.join(process.cwd(), 'performance-analysis.json');
    if (!fs.existsSync(analysisPath)) {
      throw new Error(`性能分析文件不存在: ${analysisPath}`);
    }

    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

    // 读取现有趋势数据（如果存在）
    let trendData = [];
    const trendDir = path.dirname(trendFile);

    // 确保趋势目录存在
    if (!fs.existsSync(trendDir)) {
      fs.mkdirSync(trendDir, { recursive: true });
      console.log(`创建趋势目录: ${trendDir}`);
    }

    if (fs.existsSync(trendFile)) {
      trendData = JSON.parse(fs.readFileSync(trendFile, 'utf8'));
    }

    // 创建新的趋势条目
    const trendEntry = {
      timestamp: analysisData.timestamp,
      commitId: process.env.GITHUB_SHA || 'local',
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      metrics: {
        totalRequests: analysisData.totalRequests,
        successRate: analysisData.successRate,
        failureRate: analysisData.failureRate,
        rps: analysisData.rps,
        p50LatencyMs: analysisData.p50LatencyMs,
        p95LatencyMs: analysisData.p95LatencyMs,
        p99LatencyMs: analysisData.p99LatencyMs,
        maxLatencyMs: analysisData.maxLatencyMs,
      },
    };

    // 添加新条目到趋势数据
    trendData.push(trendEntry);

    // 限制趋势数据条目数量
    if (trendData.length > maxEntries) {
      trendData = trendData.slice(trendData.length - maxEntries);
    }

    // 保存趋势数据
    fs.writeFileSync(trendFile, JSON.stringify(trendData, null, 2));
    console.log(`性能趋势数据已更新: ${trendFile}`);

    // 生成趋势报告
    generateTrendReport(trendData, trendDir);

    return trendData;
  } catch (error) {
    console.error('更新性能趋势数据失败:', error);
    return [];
  }
}

/**
 * 生成趋势报告
 * @param {Array} trendData 趋势数据
 * @param {string} outputDir 输出目录
 */
function generateTrendReport(trendData, outputDir) {
  try {
    console.log('生成性能趋势报告...');

    // 生成Markdown报告
    const reportPath = path.join(outputDir, 'trend-report.md');
    const report = generateMarkdownReport(trendData);
    fs.writeFileSync(reportPath, report);
    console.log(`性能趋势报告已生成: ${reportPath}`);

    // 生成CSV报告
    const csvPath = path.join(outputDir, 'trend-data.csv');
    const csv = generateCsvReport(trendData);
    fs.writeFileSync(csvPath, csv);
    console.log(`性能趋势CSV数据已生成: ${csvPath}`);

    // 生成HTML报告
    const htmlPath = path.join(outputDir, 'trend-report.html');
    const html = generateHtmlReport(trendData);
    fs.writeFileSync(htmlPath, html);
    console.log(`性能趋势HTML报告已生成: ${htmlPath}`);
  } catch (error) {
    console.error('生成趋势报告失败:', error);
  }
}

/**
 * 生成Markdown格式的趋势报告
 * @param {Array} trendData 趋势数据
 * @returns {string} Markdown报告
 */
function generateMarkdownReport(trendData) {
  // 如果没有数据，返回空报告
  if (!trendData || trendData.length === 0) {
    return '# 性能趋势报告\n\n*暂无数据*\n';
  }

  // 获取最新和最旧的数据点
  const latest = trendData[trendData.length - 1];
  const oldest = trendData[0];

  // 计算变化百分比
  const calculateChange = (latest, oldest, metric) => {
    const oldValue = oldest.metrics[metric];
    const newValue = latest.metrics[metric];
    if (oldValue === 0) return 'N/A';
    const change = ((newValue - oldValue) / oldValue) * 100;
    return change.toFixed(2) + '%';
  };

  // 生成趋势表格
  let report = '# 性能趋势报告\n\n';
  report += `*生成时间: ${new Date().toISOString()}*\n\n`;
  report += `## 摘要\n\n`;
  report += `- **测试数量**: ${trendData.length}\n`;
  report += `- **时间范围**: ${new Date(oldest.timestamp).toLocaleDateString()} - ${new Date(latest.timestamp).toLocaleDateString()}\n`;
  report += `- **最新提交**: ${latest.commitId.substring(0, 7)} (${latest.branch})\n\n`;

  report += `## 关键指标变化\n\n`;
  report += `| 指标 | 最新值 | 变化 |\n`;
  report += `|------|--------|------|\n`;
  report += `| RPS | ${latest.metrics.rps.toFixed(2)} | ${calculateChange(latest, oldest, 'rps')} |\n`;
  report += `| P95延迟 | ${latest.metrics.p95LatencyMs.toFixed(2)}ms | ${calculateChange(latest, oldest, 'p95LatencyMs')} |\n`;
  report += `| 成功率 | ${latest.metrics.successRate.toFixed(2)}% | ${calculateChange(latest, oldest, 'successRate')} |\n`;

  report += `\n## 最近10次测试结果\n\n`;
  report += `| 时间 | 提交 | RPS | P95延迟(ms) | 成功率(%) |\n`;
  report += `|------|------|-----|------------|----------|\n`;

  // 最多显示最近10次测试
  const recentTests = trendData.slice(-10);
  recentTests.forEach((entry) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const commitId = entry.commitId.substring(0, 7);
    report += `| ${date} | ${commitId} | ${entry.metrics.rps.toFixed(2)} | ${entry.metrics.p95LatencyMs.toFixed(2)} | ${entry.metrics.successRate.toFixed(2)} |\n`;
  });

  return report;
}

/**
 * 生成CSV格式的趋势数据
 * @param {Array} trendData 趋势数据
 * @returns {string} CSV数据
 */
function generateCsvReport(trendData) {
  // 如果没有数据，返回空CSV
  if (!trendData || trendData.length === 0) {
    return 'timestamp,commitId,branch,totalRequests,successRate,failureRate,rps,p50LatencyMs,p95LatencyMs,p99LatencyMs,maxLatencyMs\n';
  }

  // 生成CSV头
  let csv =
    'timestamp,commitId,branch,totalRequests,successRate,failureRate,rps,p50LatencyMs,p95LatencyMs,p99LatencyMs,maxLatencyMs\n';

  // 添加每个数据点
  trendData.forEach((entry) => {
    csv += `${entry.timestamp},`;
    csv += `${entry.commitId},`;
    csv += `${entry.branch},`;
    csv += `${entry.metrics.totalRequests},`;
    csv += `${entry.metrics.successRate},`;
    csv += `${entry.metrics.failureRate},`;
    csv += `${entry.metrics.rps},`;
    csv += `${entry.metrics.p50LatencyMs},`;
    csv += `${entry.metrics.p95LatencyMs},`;
    csv += `${entry.metrics.p99LatencyMs},`;
    csv += `${entry.metrics.maxLatencyMs}\n`;
  });

  return csv;
}

/**
 * 生成HTML格式的趋势报告
 * @param {Array} trendData 趋势数据
 * @returns {string} HTML报告
 */
function generateHtmlReport(trendData) {
  // 如果没有数据，返回空报告
  if (!trendData || trendData.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>性能趋势报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>性能趋势报告</h1>
        <p><em>暂无数据</em></p>
      </body>
      </html>
    `;
  }

  // 准备图表数据
  const timestamps = trendData.map((entry) => new Date(entry.timestamp).toLocaleDateString());
  const rpsData = trendData.map((entry) => entry.metrics.rps);
  const p95Data = trendData.map((entry) => entry.metrics.p95LatencyMs);
  const successRateData = trendData.map((entry) => entry.metrics.successRate);

  // 生成HTML报告
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>性能趋势报告</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        .chart-container { width: 800px; height: 400px; margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>性能趋势报告</h1>
      <p><em>生成时间: ${new Date().toISOString()}</em></p>
      
      <h2>RPS趋势</h2>
      <div class="chart-container">
        <canvas id="rpsChart"></canvas>
      </div>
      
      <h2>P95延迟趋势</h2>
      <div class="chart-container">
        <canvas id="latencyChart"></canvas>
      </div>
      
      <h2>成功率趋势</h2>
      <div class="chart-container">
        <canvas id="successRateChart"></canvas>
      </div>
      
      <h2>最近测试结果</h2>
      <table>
        <tr>
          <th>时间</th>
          <th>提交</th>
          <th>分支</th>
          <th>RPS</th>
          <th>P95延迟(ms)</th>
          <th>成功率(%)</th>
        </tr>
        ${trendData
          .slice(-10)
          .map(
            (entry) => `
          <tr>
            <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
            <td>${entry.commitId.substring(0, 7)}</td>
            <td>${entry.branch}</td>
            <td>${entry.metrics.rps.toFixed(2)}</td>
            <td>${entry.metrics.p95LatencyMs.toFixed(2)}</td>
            <td>${entry.metrics.successRate.toFixed(2)}</td>
          </tr>
        `
          )
          .join('')}
      </table>
      
      <script>
        // RPS图表
        new Chart(document.getElementById('rpsChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(timestamps)},
            datasets: [{
              label: 'RPS',
              data: ${JSON.stringify(rpsData)},
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: '每秒请求数'
                }
              }
            }
          }
        });
        
        // 延迟图表
        new Chart(document.getElementById('latencyChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(timestamps)},
            datasets: [{
              label: 'P95延迟',
              data: ${JSON.stringify(p95Data)},
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: '延迟(ms)'
                }
              }
            }
          }
        });
        
        // 成功率图表
        new Chart(document.getElementById('successRateChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(timestamps)},
            datasets: [{
              label: '成功率',
              data: ${JSON.stringify(successRateData)},
              borderColor: 'rgb(54, 162, 235)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                min: 0,
                max: 100,
                title: {
                  display: true,
                  text: '成功率(%)'
                }
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `;
}

// 执行更新
updatePerformanceTrend().catch((error) => {
  console.error('更新性能趋势失败:', error);
  process.exit(1);
});

module.exports = { updatePerformanceTrend };
