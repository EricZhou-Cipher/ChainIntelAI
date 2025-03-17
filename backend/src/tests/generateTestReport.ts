import fs from 'fs';
import path from 'path';

interface CoverageData {
  total: {
    statements: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
    lines: { pct: number };
  };
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

function generateMarkdownReport(summary: TestSummary): string {
  const timestamp = new Date().toISOString();

  return `# ChainIntelAI 测试报告

生成时间: ${timestamp}

## 测试统计

- 总用例数: ${summary.totalTests}
- 通过: ${summary.passed} ✅
- 失败: ${summary.failed} ❌
- 跳过: ${summary.skipped} ⏭️

## 覆盖率统计

| 指标 | 覆盖率 | 状态 |
|------|--------|------|
| Statements | ${summary.coverage.statements}% | ${summary.coverage.statements >= 85 ? '✅' : '❌'} |
| Branches | ${summary.coverage.branches}% | ${summary.coverage.branches >= 80 ? '✅' : '❌'} |
| Functions | ${summary.coverage.functions}% | ${summary.coverage.functions >= 85 ? '✅' : '❌'} |
| Lines | ${summary.coverage.lines}% | ${summary.coverage.lines >= 85 ? '✅' : '❌'} |

## 详细覆盖率报告

完整的覆盖率报告请查看 [lcov-report/index.html](./lcov-report/index.html)

## 测试结果分析

${summary.failed > 0 ? '⚠️ 存在失败的测试用例，请检查详细报告' : '✅ 所有测试用例通过'}
${summary.coverage.statements < 85 || summary.coverage.branches < 80 || summary.coverage.functions < 85 || summary.coverage.lines < 85 ? '⚠️ 部分覆盖率指标未达标' : '✅ 所有覆盖率指标达标'}
`;
}

async function main() {
  try {
    // 读取覆盖率报告
    const coveragePath = path.join(__dirname, 'coverage', 'coverage-summary.json');
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8')) as CoverageData;

    // 读取测试结果
    const testResultsPath = path.join(__dirname, 'coverage', 'junit.xml');
    const testResults = fs.readFileSync(testResultsPath, 'utf-8');

    // 解析测试结果
    const totalTests = parseInt(testResults.match(/testsuite.*tests="(\d+)"/)?.[1] || '0');
    const failed = parseInt(testResults.match(/testsuite.*failures="(\d+)"/)?.[1] || '0');
    const skipped = parseInt(testResults.match(/testsuite.*skipped="(\d+)"/)?.[1] || '0');
    const passed = totalTests - failed - skipped;

    // 生成测试摘要
    const summary: TestSummary = {
      totalTests,
      passed,
      failed,
      skipped,
      coverage: {
        statements: coverageData.total.statements.pct,
        branches: coverageData.total.branches.pct,
        functions: coverageData.total.functions.pct,
        lines: coverageData.total.lines.pct,
      },
    };

    // 生成 Markdown 报告
    const markdown = generateMarkdownReport(summary);

    // 保存报告
    const reportPath = path.join(__dirname, 'coverage', 'summary.md');
    fs.writeFileSync(reportPath, markdown);

    console.log('测试报告生成成功:', reportPath);
  } catch (error) {
    console.error('生成测试报告失败:', error);
    process.exit(1);
  }
}

main();
