/**
 * 测试报告生成工具
 *
 * 该脚本生成综合测试报告，包括覆盖率、负载测试结果和AI分析
 *
 * 用法:
 * node testReporter.js --coverage-dir=./coverage --load-test-dir=./load-test-results --ai-analysis=true
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseArgs } = require('util');
const axios = require('axios');

// 解析命令行参数
const options = {
  'coverage-dir': { type: 'string', default: './coverage' },
  'load-test-dir': { type: 'string', default: './load-test-results' },
  'output-file': { type: 'string', default: 'test-report.md' },
  'ai-analysis': { type: 'boolean', default: false },
  'min-coverage': { type: 'number', default: 80 },
  'suggestions-file': { type: 'string', default: 'test-improvement-suggestions.md' },
};

const { values } = parseArgs({ options });

// 主函数
async function generateTestReport() {
  console.log('开始生成测试报告...');

  // 获取Git信息
  const gitInfo = getGitInfo();

  // 获取覆盖率数据
  const coverageData = getCoverageData(values['coverage-dir']);

  // 获取负载测试结果
  const loadTestResults = getLoadTestResults(values['load-test-dir']);

  // 获取错误日志
  const errorLogs = getErrorLogs();

  // 生成Markdown报告
  const report = generateMarkdownReport(gitInfo, coverageData, loadTestResults, errorLogs);

  // 写入报告文件
  const outputPath = path.resolve(process.cwd(), values['output-file']);
  fs.writeFileSync(outputPath, report);

  console.log(`测试报告已生成: ${outputPath}`);

  // 如果启用了AI分析，分析低覆盖率代码并生成改进建议
  if (values['ai-analysis']) {
    console.log('开始AI分析低覆盖率代码...');

    try {
      const suggestions = await analyzeTestCoverage(coverageData);

      // 写入建议文件
      const suggestionsPath = path.resolve(process.cwd(), values['suggestions-file']);
      fs.writeFileSync(suggestionsPath, suggestions);

      console.log(`测试改进建议已生成: ${suggestionsPath}`);
    } catch (error) {
      console.error('AI分析失败:', error.message);
    }
  }

  // 发送通知
  await sendNotifications(report, coverageData, loadTestResults);

  console.log('测试报告生成完成');
}

// 获取Git信息
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const commitAuthor = execSync('git log -1 --pretty=%an').toString().trim();
    const commitDate = execSync('git log -1 --pretty=%cd --date=iso').toString().trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const repoUrl = execSync('git config --get remote.origin.url').toString().trim();

    return {
      commitHash,
      commitMessage,
      commitAuthor,
      commitDate,
      branch,
      repoUrl,
    };
  } catch (error) {
    console.warn('获取Git信息失败:', error.message);
    return {
      commitHash: 'unknown',
      commitMessage: 'unknown',
      commitAuthor: 'unknown',
      commitDate: new Date().toISOString(),
      branch: 'unknown',
      repoUrl: 'unknown',
    };
  }
}

// 获取覆盖率数据
function getCoverageData(coverageDir) {
  try {
    const summaryPath = path.join(coverageDir, 'coverage-summary.json');

    if (!fs.existsSync(summaryPath)) {
      console.warn(`覆盖率摘要文件不存在: ${summaryPath}`);
      return null;
    }

    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

    // 获取低覆盖率文件
    const lowCoverageFiles = [];
    const threshold = values['min-coverage'];

    for (const [filePath, data] of Object.entries(summary)) {
      if (filePath === 'total') continue;

      const lineCoverage = data.lines.pct;
      const branchCoverage = data.branches ? data.branches.pct : 100;
      const functionCoverage = data.functions.pct;

      if (lineCoverage < threshold || branchCoverage < threshold || functionCoverage < threshold) {
        lowCoverageFiles.push({
          filePath,
          lineCoverage,
          branchCoverage,
          functionCoverage,
          uncoveredLines: data.lines.skipped || [],
        });
      }
    }

    // 按行覆盖率排序
    lowCoverageFiles.sort((a, b) => a.lineCoverage - b.lineCoverage);

    return {
      total: summary.total,
      lowCoverageFiles,
      threshold,
    };
  } catch (error) {
    console.error('获取覆盖率数据失败:', error.message);
    return null;
  }
}

// 获取负载测试结果
function getLoadTestResults(loadTestDir) {
  try {
    const reportPath = path.join(loadTestDir, 'report.json');

    if (!fs.existsSync(reportPath)) {
      console.warn(`负载测试报告文件不存在: ${reportPath}`);
      return null;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    return {
      timestamp: report.timestamp,
      duration: report.aggregate.duration,
      rps: {
        mean: report.aggregate.rps.mean,
        max: report.aggregate.rps.max,
      },
      latency: {
        min: report.aggregate.latency.min,
        median: report.aggregate.latency.median,
        p95: report.aggregate.latency.p95,
        p99: report.aggregate.latency.p99,
        max: report.aggregate.latency.max,
      },
      scenarioCounts: report.aggregate.scenarioCounts || {},
      codes: report.aggregate.codes || {},
      errors: report.aggregate.errors || {},
    };
  } catch (error) {
    console.error('获取负载测试结果失败:', error.message);
    return null;
  }
}

// 获取错误日志
function getErrorLogs() {
  try {
    const logPath = path.resolve(process.cwd(), '../logs/error.log');

    if (!fs.existsSync(logPath)) {
      return [];
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    const logLines = logContent.split('\n').filter((line) => line.trim());

    // 只获取最近的10条错误
    return logLines.slice(-10).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line };
      }
    });
  } catch (error) {
    console.warn('获取错误日志失败:', error.message);
    return [];
  }
}

// 生成Markdown报告
function generateMarkdownReport(gitInfo, coverageData, loadTestResults, errorLogs) {
  const now = new Date().toISOString();

  let report = `# 测试报告\n\n`;
  report += `生成时间: ${now}\n\n`;

  // Git信息
  report += `## 提交信息\n\n`;
  report += `- **提交哈希**: \`${gitInfo.commitHash}\`\n`;
  report += `- **提交信息**: ${gitInfo.commitMessage}\n`;
  report += `- **提交作者**: ${gitInfo.commitAuthor}\n`;
  report += `- **提交日期**: ${gitInfo.commitDate}\n`;
  report += `- **分支**: ${gitInfo.branch}\n\n`;

  // 覆盖率摘要
  report += `## 覆盖率摘要\n\n`;

  if (coverageData) {
    const { total, lowCoverageFiles, threshold } = coverageData;

    report += `| 类型 | 覆盖率 | 阈值 | 状态 |\n`;
    report += `|------|--------|------|------|\n`;

    const getStatus = (value, threshold) => (value >= threshold ? '✅' : '❌');

    report += `| 语句 | ${total.statements.pct.toFixed(2)}% | ${threshold}% | ${getStatus(total.statements.pct, threshold)} |\n`;
    report += `| 分支 | ${total.branches.pct.toFixed(2)}% | ${threshold}% | ${getStatus(total.branches.pct, threshold)} |\n`;
    report += `| 函数 | ${total.functions.pct.toFixed(2)}% | ${threshold}% | ${getStatus(total.functions.pct, threshold)} |\n`;
    report += `| 行 | ${total.lines.pct.toFixed(2)}% | ${threshold}% | ${getStatus(total.lines.pct, threshold)} |\n\n`;

    // 低覆盖率文件
    if (lowCoverageFiles.length > 0) {
      report += `### 低覆盖率文件\n\n`;
      report += `| 文件 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |\n`;
      report += `|------|----------|------------|------------|\n`;

      lowCoverageFiles.slice(0, 10).forEach((file) => {
        report += `| ${file.filePath} | ${file.lineCoverage.toFixed(2)}% | ${file.branchCoverage.toFixed(2)}% | ${file.functionCoverage.toFixed(2)}% |\n`;
      });

      if (lowCoverageFiles.length > 10) {
        report += `\n*还有 ${lowCoverageFiles.length - 10} 个低覆盖率文件未显示*\n`;
      }

      report += `\n`;
    }
  } else {
    report += `*未找到覆盖率数据*\n\n`;
  }

  // 负载测试结果
  report += `## 负载测试结果\n\n`;

  if (loadTestResults) {
    const { duration, rps, latency, scenarioCounts, codes, errors } = loadTestResults;

    report += `### 性能指标\n\n`;
    report += `- **测试持续时间**: ${(duration / 60).toFixed(2)} 分钟\n`;
    report += `- **平均RPS**: ${rps.mean.toFixed(2)}\n`;
    report += `- **最大RPS**: ${rps.max.toFixed(2)}\n`;
    report += `- **中位数延迟**: ${latency.median.toFixed(2)} ms\n`;
    report += `- **P95延迟**: ${latency.p95.toFixed(2)} ms\n`;
    report += `- **P99延迟**: ${latency.p99.toFixed(2)} ms\n`;
    report += `- **最大延迟**: ${latency.max.toFixed(2)} ms\n\n`;

    // 场景计数
    if (Object.keys(scenarioCounts).length > 0) {
      report += `### 场景计数\n\n`;
      report += `| 场景 | 计数 |\n`;
      report += `|------|------|\n`;

      Object.entries(scenarioCounts).forEach(([scenario, count]) => {
        report += `| ${scenario} | ${count} |\n`;
      });

      report += `\n`;
    }

    // 状态码
    if (Object.keys(codes).length > 0) {
      report += `### 状态码\n\n`;
      report += `| 状态码 | 计数 |\n`;
      report += `|--------|------|\n`;

      Object.entries(codes).forEach(([code, count]) => {
        report += `| ${code} | ${count} |\n`;
      });

      report += `\n`;
    }

    // 错误
    if (Object.keys(errors).length > 0) {
      report += `### 错误\n\n`;
      report += `| 错误 | 计数 |\n`;
      report += `|------|------|\n`;

      Object.entries(errors).forEach(([error, count]) => {
        report += `| ${error} | ${count} |\n`;
      });

      report += `\n`;
    }
  } else {
    report += `*未找到负载测试结果*\n\n`;
  }

  // 错误日志
  if (errorLogs.length > 0) {
    report += `## 最近错误日志\n\n`;
    report += `\`\`\`\n`;

    errorLogs.forEach((log) => {
      if (typeof log === 'object') {
        report += `${log.timestamp || ''} ${log.level || 'ERROR'}: ${log.message || JSON.stringify(log)}\n`;
      } else {
        report += `${log}\n`;
      }
    });

    report += `\`\`\`\n\n`;
  }

  // AI分析
  if (values['ai-analysis']) {
    report += `## AI分析\n\n`;
    report += `详细的测试改进建议请查看 [test-improvement-suggestions.md](${values['suggestions-file']})\n\n`;
  }

  return report;
}

// 使用AI分析测试覆盖率并生成改进建议
async function analyzeTestCoverage(coverageData) {
  if (
    !coverageData ||
    !coverageData.lowCoverageFiles ||
    coverageData.lowCoverageFiles.length === 0
  ) {
    return '# 测试改进建议\n\n所有文件的测试覆盖率都达到了阈值，无需改进。';
  }

  const { lowCoverageFiles, threshold } = coverageData;

  // 获取前5个最低覆盖率文件的内容
  const filesToAnalyze = lowCoverageFiles.slice(0, 5);
  const fileContents = [];

  for (const file of filesToAnalyze) {
    try {
      const filePath = path.resolve(process.cwd(), '..', file.filePath);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        fileContents.push({
          filePath: file.filePath,
          content,
          lineCoverage: file.lineCoverage,
          branchCoverage: file.branchCoverage,
          functionCoverage: file.functionCoverage,
          uncoveredLines: file.uncoveredLines,
        });
      }
    } catch (error) {
      console.warn(`读取文件失败: ${file.filePath}`, error.message);
    }
  }

  // 如果没有OpenAI API密钥，使用基本分析
  if (!process.env.OPENAI_API_KEY) {
    return generateBasicSuggestions(fileContents, threshold);
  }

  // 使用OpenAI API分析
  try {
    const suggestions = await analyzeWithOpenAI(fileContents, threshold);
    return suggestions;
  } catch (error) {
    console.error('OpenAI API调用失败:', error.message);
    return generateBasicSuggestions(fileContents, threshold);
  }
}

// 使用OpenAI API分析低覆盖率代码
async function analyzeWithOpenAI(fileContents, threshold) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('未设置OPENAI_API_KEY环境变量');
  }

  // 准备请求数据
  const prompt = `
我需要你分析以下低覆盖率代码文件，并提供具体的测试改进建议。
覆盖率阈值为${threshold}%，以下文件未达到该阈值。

${fileContents
  .map(
    (file) => `
文件路径: ${file.filePath}
行覆盖率: ${file.lineCoverage.toFixed(2)}%
分支覆盖率: ${file.branchCoverage.toFixed(2)}%
函数覆盖率: ${file.functionCoverage.toFixed(2)}%

\`\`\`
${file.content}
\`\`\`
`
  )
  .join('\n\n')}

请为每个文件提供以下内容：
1. 测试覆盖率不足的原因分析
2. 具体的测试用例建议，包括应该测试哪些场景
3. 测试代码示例，展示如何编写测试
4. 提高覆盖率的其他建议

请以Markdown格式输出，为每个文件创建单独的章节。
`;

  // 调用OpenAI API
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '你是一个专业的测试工程师，擅长分析代码并提供测试改进建议。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // 添加标题和介绍
  let suggestions = `# 测试改进建议\n\n`;
  suggestions += `本文档由AI分析生成，基于覆盖率报告中的低覆盖率文件。\n\n`;
  suggestions += `## 摘要\n\n`;
  suggestions += `分析了${fileContents.length}个低覆盖率文件，覆盖率阈值为${threshold}%。\n\n`;
  suggestions += `## 改进建议\n\n`;

  // 添加AI生成的建议
  suggestions += response.data.choices[0].message.content;

  // 添加测试命令
  suggestions += `\n\n## 执行测试\n\n`;
  suggestions += `使用以下命令运行测试并查看覆盖率报告：\n\n`;
  suggestions += `\`\`\`bash\n`;
  suggestions += `# 运行所有测试\n`;
  suggestions += `yarn test --coverage\n\n`;
  suggestions += `# 运行特定文件的测试\n`;
  suggestions += `yarn test --coverage --testPathPattern=path/to/test/file\n`;
  suggestions += `\`\`\`\n\n`;

  return suggestions;
}

// 生成基本的测试建议（当无法使用OpenAI API时）
function generateBasicSuggestions(fileContents, threshold) {
  let suggestions = `# 测试改进建议\n\n`;
  suggestions += `本文档基于覆盖率报告中的低覆盖率文件生成。\n\n`;
  suggestions += `## 摘要\n\n`;
  suggestions += `分析了${fileContents.length}个低覆盖率文件，覆盖率阈值为${threshold}%。\n\n`;

  fileContents.forEach((file) => {
    suggestions += `## ${file.filePath}\n\n`;
    suggestions += `- 行覆盖率: ${file.lineCoverage.toFixed(2)}%\n`;
    suggestions += `- 分支覆盖率: ${file.branchCoverage.toFixed(2)}%\n`;
    suggestions += `- 函数覆盖率: ${file.functionCoverage.toFixed(2)}%\n\n`;

    suggestions += `### 建议\n\n`;
    suggestions += `1. 创建单元测试文件 \`${file.filePath.replace(/\.[^/.]+$/, '')}.test.js\`\n`;
    suggestions += `2. 确保测试覆盖所有公共方法和关键分支\n`;
    suggestions += `3. 使用模拟（mock）处理外部依赖\n`;
    suggestions += `4. 考虑边界条件和错误情况\n\n`;

    // 检测可能的测试模板
    if (file.filePath.includes('controller') || file.filePath.includes('api')) {
      suggestions += `### API测试示例\n\n`;
      suggestions += `\`\`\`javascript\n`;
      suggestions += `const request = require('supertest');\n`;
      suggestions += `const app = require('../app');\n\n`;
      suggestions += `describe('${file.filePath}', () => {\n`;
      suggestions += `  test('应该返回成功响应', async () => {\n`;
      suggestions += `    const response = await request(app).get('/your-endpoint');\n`;
      suggestions += `    expect(response.statusCode).toBe(200);\n`;
      suggestions += `    expect(response.body).toHaveProperty('data');\n`;
      suggestions += `  });\n\n`;
      suggestions += `  test('应该处理错误情况', async () => {\n`;
      suggestions += `    const response = await request(app).get('/invalid-endpoint');\n`;
      suggestions += `    expect(response.statusCode).toBe(404);\n`;
      suggestions += `  });\n`;
      suggestions += `});\n`;
      suggestions += `\`\`\`\n\n`;
    } else if (file.filePath.includes('service') || file.filePath.includes('util')) {
      suggestions += `### 服务/工具测试示例\n\n`;
      suggestions += `\`\`\`javascript\n`;
      suggestions += `const { yourFunction } = require('${file.filePath}');\n`;
      suggestions += `const mockDependency = require('../path/to/dependency');\n\n`;
      suggestions += `// 模拟依赖\n`;
      suggestions += `jest.mock('../path/to/dependency');\n\n`;
      suggestions += `describe('${file.filePath}', () => {\n`;
      suggestions += `  test('应该正确处理有效输入', () => {\n`;
      suggestions += `    mockDependency.someMethod.mockReturnValue('mocked value');\n`;
      suggestions += `    const result = yourFunction('valid input');\n`;
      suggestions += `    expect(result).toBe('expected output');\n`;
      suggestions += `    expect(mockDependency.someMethod).toHaveBeenCalledWith('valid input');\n`;
      suggestions += `  });\n\n`;
      suggestions += `  test('应该处理无效输入', () => {\n`;
      suggestions += `    expect(() => yourFunction(null)).toThrow();\n`;
      suggestions += `  });\n`;
      suggestions += `});\n`;
      suggestions += `\`\`\`\n\n`;
    }
  });

  // 添加测试命令
  suggestions += `## 执行测试\n\n`;
  suggestions += `使用以下命令运行测试并查看覆盖率报告：\n\n`;
  suggestions += `\`\`\`bash\n`;
  suggestions += `# 运行所有测试\n`;
  suggestions += `yarn test --coverage\n\n`;
  suggestions += `# 运行特定文件的测试\n`;
  suggestions += `yarn test --coverage --testPathPattern=path/to/test/file\n`;
  suggestions += `\`\`\`\n\n`;

  return suggestions;
}

// 发送通知
async function sendNotifications(report, coverageData, loadTestResults) {
  // 这里可以实现发送通知的逻辑，例如发送邮件、Slack消息等
  console.log('发送通知...');

  // 示例：如果覆盖率低于阈值，发送警告
  if (coverageData && coverageData.total.lines.pct < coverageData.threshold) {
    console.warn(
      `警告: 行覆盖率 (${coverageData.total.lines.pct.toFixed(2)}%) 低于阈值 (${coverageData.threshold}%)`
    );
  }

  // 示例：如果P95延迟高于500ms，发送警告
  if (loadTestResults && loadTestResults.latency.p95 > 500) {
    console.warn(`警告: P95延迟 (${loadTestResults.latency.p95.toFixed(2)}ms) 高于阈值 (500ms)`);
  }
}

// 执行主函数
generateTestReport().catch((error) => {
  console.error('生成测试报告时出错:', error);
  process.exit(1);
});
