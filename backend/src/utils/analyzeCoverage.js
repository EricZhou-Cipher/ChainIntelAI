#!/usr/bin/env node

/**
 * 测试覆盖率分析工具
 *
 * 此脚本分析Jest生成的覆盖率报告，生成详细的覆盖率分析报告，
 * 包括趋势分析、未覆盖代码分类和改进建议。
 *
 * 用法:
 *   node analyzeCoverage.js [选项]
 *
 * 选项:
 *   --coverage-dir=<目录>     覆盖率报告目录 (默认: ./coverage)
 *   --output=<文件>          输出报告文件 (默认: ./coverage-analysis.md)
 *   --history=<文件>         历史覆盖率数据文件 (默认: ./coverage-history.json)
 *   --min-coverage=<数字>    最小覆盖率阈值 (默认: 80)
 *   --format=<格式>          输出格式 (markdown 或 html, 默认: markdown)
 *   --detailed               生成详细报告
 *   --trend                  包含趋势分析
 *   --help                   显示帮助信息
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  coverageDir: './coverage',
  output: './coverage-analysis.md',
  historyFile: './coverage-history.json',
  minCoverage: 80,
  format: 'markdown',
  detailed: false,
  trend: false,
};

// 显示帮助信息
if (args.includes('--help')) {
  console.log(`
测试覆盖率分析工具

用法:
  node analyzeCoverage.js [选项]

选项:
  --coverage-dir=<目录>     覆盖率报告目录 (默认: ./coverage)
  --output=<文件>          输出报告文件 (默认: ./coverage-analysis.md)
  --history=<文件>         历史覆盖率数据文件 (默认: ./coverage-history.json)
  --min-coverage=<数字>    最小覆盖率阈值 (默认: 80)
  --format=<格式>          输出格式 (markdown 或 html, 默认: markdown)
  --detailed               生成详细报告
  --trend                  包含趋势分析
  --help                   显示帮助信息
  `);
  process.exit(0);
}

// 解析参数
args.forEach((arg) => {
  if (arg.startsWith('--coverage-dir=')) {
    options.coverageDir = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    options.output = arg.split('=')[1];
  } else if (arg.startsWith('--history=')) {
    options.historyFile = arg.split('=')[1];
  } else if (arg.startsWith('--min-coverage=')) {
    options.minCoverage = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--format=')) {
    options.format = arg.split('=')[1];
  } else if (arg === '--detailed') {
    options.detailed = true;
  } else if (arg === '--trend') {
    options.trend = true;
  }
});

/**
 * 获取覆盖率数据
 * @param {string} coverageDir - 覆盖率报告目录
 * @returns {Object} 覆盖率数据
 */
function getCoverageData(coverageDir) {
  const summaryPath = path.join(coverageDir, 'coverage-summary.json');

  if (!fs.existsSync(summaryPath)) {
    console.error(`错误: 找不到覆盖率摘要文件: ${summaryPath}`);
    console.error('请先运行测试生成覆盖率报告: yarn test --coverage');
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  } catch (error) {
    console.error(`解析覆盖率摘要文件时出错: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 获取低覆盖率文件
 * @param {Object} coverageData - 覆盖率数据
 * @param {number} threshold - 覆盖率阈值
 * @returns {Array} 低覆盖率文件列表
 */
function getLowCoverageFiles(coverageData, threshold) {
  const lowCoverageFiles = [];

  for (const [filePath, metrics] of Object.entries(coverageData)) {
    if (filePath === 'total') continue;

    const { lines, statements, functions, branches } = metrics;

    if (
      lines.pct < threshold ||
      statements.pct < threshold ||
      functions.pct < threshold ||
      branches.pct < threshold
    ) {
      lowCoverageFiles.push({
        filePath,
        metrics: {
          lines: lines.pct,
          statements: statements.pct,
          functions: functions.pct,
          branches: branches.pct,
        },
        uncoveredLines: lines.skipped,
        uncoveredFunctions: functions.skipped,
        uncoveredBranches: branches.skipped,
      });
    }
  }

  // 按行覆盖率排序
  return lowCoverageFiles.sort((a, b) => a.metrics.lines - b.metrics.lines);
}

/**
 * 分析未覆盖代码
 * @param {string} filePath - 文件路径
 * @param {Array} uncoveredLines - 未覆盖的行号
 * @returns {Object} 分析结果
 */
function analyzeUncoveredCode(filePath, uncoveredLines) {
  if (!fs.existsSync(filePath)) {
    return {
      errorHandling: 0,
      conditionalLogic: 0,
      edgeCases: 0,
      unusedCode: 0,
      complexLogic: 0,
      other: uncoveredLines.length,
    };
  }

  const sourceCode = fs.readFileSync(filePath, 'utf8').split('\n');
  const analysis = {
    errorHandling: 0,
    conditionalLogic: 0,
    edgeCases: 0,
    unusedCode: 0,
    complexLogic: 0,
    other: 0,
  };

  uncoveredLines.forEach((lineNumber) => {
    const line = sourceCode[lineNumber - 1] || '';

    if (
      line.includes('catch') ||
      line.includes('throw') ||
      line.includes('error') ||
      line.includes('Error')
    ) {
      analysis.errorHandling++;
    } else if (
      line.includes('if') ||
      line.includes('else') ||
      line.includes('switch') ||
      line.includes('case')
    ) {
      analysis.conditionalLogic++;
    } else if (
      line.includes('null') ||
      line.includes('undefined') ||
      line.includes('NaN') ||
      line.includes('Infinity') ||
      line.includes('isNaN')
    ) {
      analysis.edgeCases++;
    } else if (line.trim().startsWith('//') || line.includes('TODO') || line.includes('FIXME')) {
      analysis.unusedCode++;
    } else if (
      line.includes('for') ||
      line.includes('while') ||
      line.includes('reduce') ||
      line.includes('map') ||
      line.includes('filter')
    ) {
      analysis.complexLogic++;
    } else {
      analysis.other++;
    }
  });

  return analysis;
}

/**
 * 生成改进建议
 * @param {string} filePath - 文件路径
 * @param {Object} analysis - 分析结果
 * @returns {Array} 改进建议
 */
function generateSuggestions(filePath, analysis) {
  const suggestions = [];

  if (analysis.errorHandling > 0) {
    suggestions.push(
      `添加错误处理测试: 文件 ${filePath} 中有 ${analysis.errorHandling} 处未覆盖的错误处理代码`
    );
  }

  if (analysis.conditionalLogic > 0) {
    suggestions.push(
      `添加条件逻辑测试: 文件 ${filePath} 中有 ${analysis.conditionalLogic} 处未覆盖的条件逻辑`
    );
  }

  if (analysis.edgeCases > 0) {
    suggestions.push(
      `添加边界测试: 文件 ${filePath} 中有 ${analysis.edgeCases} 处未覆盖的边界情况`
    );
  }

  if (analysis.unusedCode > 0) {
    suggestions.push(
      `移除未使用代码: 文件 ${filePath} 中有 ${analysis.unusedCode} 处可能未使用的代码`
    );
  }

  if (analysis.complexLogic > 0) {
    suggestions.push(
      `简化复杂逻辑: 文件 ${filePath} 中有 ${analysis.complexLogic} 处未覆盖的复杂逻辑`
    );
  }

  return suggestions;
}

/**
 * 更新历史覆盖率数据
 * @param {Object} coverageData - 当前覆盖率数据
 * @param {string} historyFile - 历史数据文件路径
 * @returns {Array} 更新后的历史数据
 */
function updateHistoryData(coverageData, historyFile) {
  let history = [];

  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch (error) {
      console.warn(`警告: 无法解析历史数据文件: ${error.message}`);
    }
  }

  const date = new Date().toISOString().split('T')[0];
  const totalCoverage = coverageData.total;

  history.push({
    date,
    lines: totalCoverage.lines.pct,
    statements: totalCoverage.statements.pct,
    functions: totalCoverage.functions.pct,
    branches: totalCoverage.branches.pct,
  });

  // 保留最近30天的数据
  if (history.length > 30) {
    history = history.slice(history.length - 30);
  }

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
  return history;
}

/**
 * 生成趋势分析
 * @param {Array} historyData - 历史覆盖率数据
 * @param {string} format - 输出格式
 * @returns {string} 趋势分析内容
 */
function generateTrendAnalysis(historyData, format) {
  if (historyData.length < 2) {
    return format === 'markdown'
      ? '> 趋势分析需要至少两个数据点。请在运行更多测试后再查看趋势。\n\n'
      : '<p>趋势分析需要至少两个数据点。请在运行更多测试后再查看趋势。</p>';
  }

  const latest = historyData[historyData.length - 1];
  const previous = historyData[historyData.length - 2];

  const linesDiff = (latest.lines - previous.lines).toFixed(2);
  const statementsDiff = (latest.statements - previous.statements).toFixed(2);
  const functionsDiff = (latest.functions - previous.functions).toFixed(2);
  const branchesDiff = (latest.branches - previous.branches).toFixed(2);

  const getChangeSymbol = (diff) => {
    const numDiff = parseFloat(diff);
    if (numDiff > 0) return '↑';
    if (numDiff < 0) return '↓';
    return '→';
  };

  if (format === 'markdown') {
    return `
### 覆盖率趋势

| 指标 | 当前值 | 变化 |
|------|--------|------|
| 行覆盖率 | ${latest.lines.toFixed(2)}% | ${getChangeSymbol(linesDiff)} ${linesDiff}% |
| 语句覆盖率 | ${latest.statements.toFixed(2)}% | ${getChangeSymbol(statementsDiff)} ${statementsDiff}% |
| 函数覆盖率 | ${latest.functions.toFixed(2)}% | ${getChangeSymbol(functionsDiff)} ${functionsDiff}% |
| 分支覆盖率 | ${latest.branches.toFixed(2)}% | ${getChangeSymbol(branchesDiff)} ${branchesDiff}% |

`;
  } else {
    return `
<h3>覆盖率趋势</h3>
<table>
  <tr>
    <th>指标</th>
    <th>当前值</th>
    <th>变化</th>
  </tr>
  <tr>
    <td>行覆盖率</td>
    <td>${latest.lines.toFixed(2)}%</td>
    <td>${getChangeSymbol(linesDiff)} ${linesDiff}%</td>
  </tr>
  <tr>
    <td>语句覆盖率</td>
    <td>${latest.statements.toFixed(2)}%</td>
    <td>${getChangeSymbol(statementsDiff)} ${statementsDiff}%</td>
  </tr>
  <tr>
    <td>函数覆盖率</td>
    <td>${latest.functions.toFixed(2)}%</td>
    <td>${getChangeSymbol(functionsDiff)} ${functionsDiff}%</td>
  </tr>
  <tr>
    <td>分支覆盖率</td>
    <td>${latest.branches.toFixed(2)}%</td>
    <td>${getChangeSymbol(branchesDiff)} ${branchesDiff}%</td>
  </tr>
</table>
`;
  }
}

/**
 * 生成覆盖率报告
 * @param {Object} coverageData - 覆盖率数据
 * @param {Array} lowCoverageFiles - 低覆盖率文件
 * @param {Array} historyData - 历史覆盖率数据
 * @param {Object} options - 选项
 * @returns {string} 报告内容
 */
function generateReport(coverageData, lowCoverageFiles, historyData, options) {
  const { format, minCoverage, detailed, trend } = options;
  const totalCoverage = coverageData.total;

  let report = '';

  if (format === 'markdown') {
    report = `# 测试覆盖率分析报告

## 总体覆盖率

| 指标 | 覆盖率 | 状态 |
|------|--------|------|
| 行覆盖率 | ${totalCoverage.lines.pct.toFixed(2)}% | ${totalCoverage.lines.pct >= minCoverage ? '✅' : '❌'} |
| 语句覆盖率 | ${totalCoverage.statements.pct.toFixed(2)}% | ${totalCoverage.statements.pct >= minCoverage ? '✅' : '❌'} |
| 函数覆盖率 | ${totalCoverage.functions.pct.toFixed(2)}% | ${totalCoverage.functions.pct >= minCoverage ? '✅' : '❌'} |
| 分支覆盖率 | ${totalCoverage.branches.pct.toFixed(2)}% | ${totalCoverage.branches.pct >= minCoverage ? '✅' : '❌'} |

`;

    if (trend && historyData.length > 0) {
      report += generateTrendAnalysis(historyData, 'markdown');
    }

    if (lowCoverageFiles.length > 0) {
      report += `## 低覆盖率文件

共发现 ${lowCoverageFiles.length} 个低于阈值 (${minCoverage}%) 的文件:

| 文件 | 行覆盖率 | 语句覆盖率 | 函数覆盖率 | 分支覆盖率 |
|------|----------|------------|------------|------------|
`;

      lowCoverageFiles.forEach((file) => {
        report += `| ${file.filePath} | ${file.metrics.lines.toFixed(2)}% | ${file.metrics.statements.toFixed(2)}% | ${file.metrics.functions.toFixed(2)}% | ${file.metrics.branches.toFixed(2)}% |\n`;
      });

      report += '\n';

      if (detailed) {
        report += '## 详细分析与建议\n\n';

        lowCoverageFiles.forEach((file) => {
          const analysis = analyzeUncoveredCode(file.filePath, file.uncoveredLines || []);
          const suggestions = generateSuggestions(file.filePath, analysis);

          report += `### ${file.filePath}\n\n`;
          report += `#### 未覆盖代码分析\n\n`;
          report += `- 错误处理: ${analysis.errorHandling}\n`;
          report += `- 条件逻辑: ${analysis.conditionalLogic}\n`;
          report += `- 边界情况: ${analysis.edgeCases}\n`;
          report += `- 未使用代码: ${analysis.unusedCode}\n`;
          report += `- 复杂逻辑: ${analysis.complexLogic}\n`;
          report += `- 其他: ${analysis.other}\n\n`;

          if (suggestions.length > 0) {
            report += `#### 改进建议\n\n`;
            suggestions.forEach((suggestion) => {
              report += `- ${suggestion}\n`;
            });
            report += '\n';
          }

          report += `#### 自动修复命令\n\n`;
          report += `\`\`\`bash\nnode src/utils/fixLowCoverage.js --fix --target=${file.filePath}\n\`\`\`\n\n`;
        });
      }
    } else {
      report +=
        '## 所有文件都达到了覆盖率阈值\n\n恭喜！所有文件的覆盖率都达到或超过了 ' +
        minCoverage +
        '%。\n\n';
    }

    report += `## 总结

- 总体覆盖率: ${totalCoverage.lines.pct >= minCoverage ? '达标' : '未达标'}
- 低覆盖率文件数量: ${lowCoverageFiles.length}
- 覆盖率阈值: ${minCoverage}%
- 报告生成时间: ${new Date().toISOString()}

`;
  } else {
    // HTML格式
    report = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>测试覆盖率分析报告</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .pass { color: green; }
    .fail { color: red; }
    .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>测试覆盖率分析报告</h1>
  
  <h2>总体覆盖率</h2>
  <table>
    <tr>
      <th>指标</th>
      <th>覆盖率</th>
      <th>状态</th>
    </tr>
    <tr>
      <td>行覆盖率</td>
      <td>${totalCoverage.lines.pct.toFixed(2)}%</td>
      <td class="${totalCoverage.lines.pct >= minCoverage ? 'pass' : 'fail'}">${totalCoverage.lines.pct >= minCoverage ? '✓' : '✗'}</td>
    </tr>
    <tr>
      <td>语句覆盖率</td>
      <td>${totalCoverage.statements.pct.toFixed(2)}%</td>
      <td class="${totalCoverage.statements.pct >= minCoverage ? 'pass' : 'fail'}">${totalCoverage.statements.pct >= minCoverage ? '✓' : '✗'}</td>
    </tr>
    <tr>
      <td>函数覆盖率</td>
      <td>${totalCoverage.functions.pct.toFixed(2)}%</td>
      <td class="${totalCoverage.functions.pct >= minCoverage ? 'pass' : 'fail'}">${totalCoverage.functions.pct >= minCoverage ? '✓' : '✗'}</td>
    </tr>
    <tr>
      <td>分支覆盖率</td>
      <td>${totalCoverage.branches.pct.toFixed(2)}%</td>
      <td class="${totalCoverage.branches.pct >= minCoverage ? 'pass' : 'fail'}">${totalCoverage.branches.pct >= minCoverage ? '✓' : '✗'}</td>
    </tr>
  </table>
`;

    if (trend && historyData.length > 0) {
      report += generateTrendAnalysis(historyData, 'html');
    }

    if (lowCoverageFiles.length > 0) {
      report += `
  <h2>低覆盖率文件</h2>
  <p>共发现 ${lowCoverageFiles.length} 个低于阈值 (${minCoverage}%) 的文件:</p>
  
  <table>
    <tr>
      <th>文件</th>
      <th>行覆盖率</th>
      <th>语句覆盖率</th>
      <th>函数覆盖率</th>
      <th>分支覆盖率</th>
    </tr>
`;

      lowCoverageFiles.forEach((file) => {
        report += `    <tr>
      <td>${file.filePath}</td>
      <td>${file.metrics.lines.toFixed(2)}%</td>
      <td>${file.metrics.statements.toFixed(2)}%</td>
      <td>${file.metrics.functions.toFixed(2)}%</td>
      <td>${file.metrics.branches.toFixed(2)}%</td>
    </tr>\n`;
      });

      report += '  </table>\n';

      if (detailed) {
        report += '  <h2>详细分析与建议</h2>\n';

        lowCoverageFiles.forEach((file) => {
          const analysis = analyzeUncoveredCode(file.filePath, file.uncoveredLines || []);
          const suggestions = generateSuggestions(file.filePath, analysis);

          report += `  <h3>${file.filePath}</h3>\n`;
          report += `  <h4>未覆盖代码分析</h4>\n`;
          report += `  <ul>\n`;
          report += `    <li>错误处理: ${analysis.errorHandling}</li>\n`;
          report += `    <li>条件逻辑: ${analysis.conditionalLogic}</li>\n`;
          report += `    <li>边界情况: ${analysis.edgeCases}</li>\n`;
          report += `    <li>未使用代码: ${analysis.unusedCode}</li>\n`;
          report += `    <li>复杂逻辑: ${analysis.complexLogic}</li>\n`;
          report += `    <li>其他: ${analysis.other}</li>\n`;
          report += `  </ul>\n`;

          if (suggestions.length > 0) {
            report += `  <h4>改进建议</h4>\n`;
            report += `  <ul>\n`;
            suggestions.forEach((suggestion) => {
              report += `    <li>${suggestion}</li>\n`;
            });
            report += `  </ul>\n`;
          }

          report += `  <h4>自动修复命令</h4>\n`;
          report += `  <pre>node src/utils/fixLowCoverage.js --fix --target=${file.filePath}</pre>\n`;
        });
      }
    } else {
      report += `
  <h2>所有文件都达到了覆盖率阈值</h2>
  <p>恭喜！所有文件的覆盖率都达到或超过了 ${minCoverage}%。</p>
`;
    }

    report += `
  <div class="summary">
    <h2>总结</h2>
    <ul>
      <li>总体覆盖率: ${totalCoverage.lines.pct >= minCoverage ? '达标' : '未达标'}</li>
      <li>低覆盖率文件数量: ${lowCoverageFiles.length}</li>
      <li>覆盖率阈值: ${minCoverage}%</li>
      <li>报告生成时间: ${new Date().toISOString()}</li>
    </ul>
  </div>
</body>
</html>`;
  }

  return report;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('正在分析覆盖率数据...');

    // 获取覆盖率数据
    const coverageData = getCoverageData(options.coverageDir);

    // 获取低覆盖率文件
    const lowCoverageFiles = getLowCoverageFiles(coverageData, options.minCoverage);

    // 更新历史数据
    const historyData = options.trend ? updateHistoryData(coverageData, options.historyFile) : [];

    // 生成报告
    const report = generateReport(coverageData, lowCoverageFiles, historyData, options);

    // 写入报告
    fs.writeFileSync(options.output, report, 'utf8');

    console.log(`覆盖率分析完成！报告已保存到: ${options.output}`);
    console.log(`总覆盖率: ${coverageData.total.lines.pct.toFixed(2)}%`);
    console.log(`低覆盖率文件数量: ${lowCoverageFiles.length}`);

    if (lowCoverageFiles.length > 0) {
      console.log('\n低覆盖率文件:');
      lowCoverageFiles.slice(0, 5).forEach((file) => {
        console.log(`- ${file.filePath}: ${file.metrics.lines.toFixed(2)}%`);
      });

      if (lowCoverageFiles.length > 5) {
        console.log(`... 以及其他 ${lowCoverageFiles.length - 5} 个文件`);
      }

      console.log('\n要查看完整分析，请打开报告文件。');
    }
  } catch (error) {
    console.error(`错误: ${error.message}`);
    process.exit(1);
  }
}

// 仅在直接运行时执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// 导出函数以便测试
export {
  getCoverageData,
  getLowCoverageFiles,
  analyzeUncoveredCode,
  generateSuggestions,
  updateHistoryData,
  generateTrendAnalysis,
  generateReport,
  main,
};
