/**
 * analyzeCoverage.js 测试文件
 *
 * 测试覆盖率分析工具的各项功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 导入被测试的函数
// 注意：由于analyzeCoverage.js是作为CLI工具设计的，我们需要模拟其内部函数
// 这里我们将直接复制关键函数进行测试
const {
  getCoverageData,
  getLowCoverageFiles,
  analyzeUncoveredCode,
  generateSuggestions,
  updateHistoryData,
  generateTrendAnalysis,
  generateReport,
} = require('../../utils/analyzeCoverage');

// 创建临时目录和文件
const tempDir = path.join(os.tmpdir(), 'coverage-test-' + Date.now());
const coverageSummaryPath = path.join(tempDir, 'coverage-summary.json');
const historyFilePath = path.join(tempDir, 'coverage-history.json');
const sampleFilePath = path.join(tempDir, 'sample.js');

// 模拟覆盖率数据
const mockCoverageData = {
  total: {
    lines: { total: 100, covered: 75, skipped: 0, pct: 75 },
    statements: { total: 120, covered: 90, skipped: 0, pct: 75 },
    functions: { total: 20, covered: 15, skipped: 0, pct: 75 },
    branches: { total: 30, covered: 20, skipped: 0, pct: 66.67 },
  },
  'src/api/controllers/userController.js': {
    lines: { total: 50, covered: 30, skipped: [5, 10, 15, 20, 25], pct: 60 },
    statements: { total: 60, covered: 40, skipped: 0, pct: 66.67 },
    functions: { total: 10, covered: 6, skipped: [1, 2], pct: 60 },
    branches: { total: 15, covered: 8, skipped: [1, 2, 3, 4], pct: 53.33 },
  },
  'src/api/services/authService.js': {
    lines: { total: 40, covered: 36, skipped: [12, 13], pct: 90 },
    statements: { total: 45, covered: 40, skipped: 0, pct: 88.89 },
    functions: { total: 8, covered: 7, skipped: [3], pct: 87.5 },
    branches: { total: 12, covered: 10, skipped: [2, 5], pct: 83.33 },
  },
};

// 模拟源代码文件
const mockSourceCode = `
const express = require('express');
const router = express.Router();

/**
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: '密码错误' });
    }
    
    const token = generateToken(user);
    
    return res.json({ token, user: user.toJSON() });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
`;

// 模拟历史数据
const mockHistoryData = [
  {
    date: '2023-01-01',
    lines: 70,
    statements: 72,
    functions: 68,
    branches: 65,
  },
  {
    date: '2023-01-02',
    lines: 72,
    statements: 74,
    functions: 70,
    branches: 67,
  },
];

// 在所有测试之前设置
beforeAll(() => {
  // 创建临时目录
  fs.mkdirSync(tempDir, { recursive: true });

  // 写入模拟覆盖率数据
  fs.writeFileSync(coverageSummaryPath, JSON.stringify(mockCoverageData), 'utf8');

  // 写入模拟源代码
  fs.writeFileSync(sampleFilePath, mockSourceCode, 'utf8');

  // 写入模拟历史数据
  fs.writeFileSync(historyFilePath, JSON.stringify(mockHistoryData), 'utf8');
});

// 在所有测试之后清理
afterAll(() => {
  // 删除临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// 测试用例
describe('analyzeCoverage.js', () => {
  // 测试获取覆盖率数据
  test('getCoverageData 应该正确读取覆盖率数据', () => {
    const data = getCoverageData(tempDir);
    expect(data).toEqual(mockCoverageData);
  });

  // 测试获取低覆盖率文件
  test('getLowCoverageFiles 应该正确识别低覆盖率文件', () => {
    const lowCoverageFiles = getLowCoverageFiles(mockCoverageData, 80);

    expect(lowCoverageFiles).toHaveLength(1);
    expect(lowCoverageFiles[0].filePath).toBe('src/api/controllers/userController.js');
    expect(lowCoverageFiles[0].metrics.lines).toBe(60);
  });

  // 测试分析未覆盖代码
  test('analyzeUncoveredCode 应该正确分析未覆盖代码类型', () => {
    const analysis = analyzeUncoveredCode(sampleFilePath, [8, 11, 14, 17, 23]);

    expect(analysis.conditionalLogic).toBeGreaterThan(0);
    expect(analysis.errorHandling).toBeGreaterThan(0);
  });

  // 测试生成改进建议
  test('generateSuggestions 应该生成有效的改进建议', () => {
    const analysis = {
      errorHandling: 2,
      conditionalLogic: 3,
      edgeCases: 1,
      unusedCode: 0,
      complexLogic: 1,
      other: 1,
    };

    const suggestions = generateSuggestions('src/api/controllers/userController.js', analysis);

    expect(suggestions).toHaveLength(4); // 不包括unusedCode
    expect(suggestions[0]).toContain('错误处理测试');
    expect(suggestions[1]).toContain('条件逻辑测试');
  });

  // 测试更新历史数据
  test('updateHistoryData 应该正确更新历史数据', () => {
    const updatedHistory = updateHistoryData(mockCoverageData, historyFilePath);

    expect(updatedHistory).toHaveLength(3); // 原来2条 + 新增1条
    expect(updatedHistory[2].lines).toBe(75);
    expect(updatedHistory[2].functions).toBe(75);
  });

  // 测试生成趋势分析
  test('generateTrendAnalysis 应该生成正确的趋势分析', () => {
    const trendAnalysis = generateTrendAnalysis(
      [
        ...mockHistoryData,
        {
          date: '2023-01-03',
          lines: 75,
          statements: 75,
          functions: 75,
          branches: 66.67,
        },
      ],
      'markdown'
    );

    expect(trendAnalysis).toContain('覆盖率趋势');
    expect(trendAnalysis).toContain('75.00%');
    expect(trendAnalysis).toContain('↑'); // 上升趋势
  });

  // 测试生成报告
  test('generateReport 应该生成有效的报告', () => {
    const lowCoverageFiles = getLowCoverageFiles(mockCoverageData, 80);
    const options = {
      format: 'markdown',
      minCoverage: 80,
      detailed: true,
      trend: false,
    };

    const report = generateReport(mockCoverageData, lowCoverageFiles, [], options);

    expect(report).toContain('# 测试覆盖率分析报告');
    expect(report).toContain('## 总体覆盖率');
    expect(report).toContain('## 低覆盖率文件');
    expect(report).toContain('src/api/controllers/userController.js');
  });

  // 测试命令行执行
  test('CLI 应该能够成功执行', () => {
    // 创建一个临时的测试脚本
    const testScriptPath = path.join(tempDir, 'test-script.js');
    fs.writeFileSync(
      testScriptPath,
      `
      const { main } = require('../../utils/analyzeCoverage');
      main().catch(console.error);
    `,
      'utf8'
    );

    // 执行测试脚本
    try {
      execSync(`node ${testScriptPath}`, {
        env: {
          ...process.env,
          COVERAGE_DIR: tempDir,
          OUTPUT_FILE: path.join(tempDir, 'test-output.md'),
        },
      });
      expect(true).toBe(true); // 如果执行成功，测试通过
    } catch (error) {
      console.error(error);
      expect(error).toBeNull(); // 如果执行失败，测试失败
    }
  });
});
