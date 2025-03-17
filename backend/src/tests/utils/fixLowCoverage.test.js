/**
 * fixLowCoverage.js 测试文件
 *
 * 测试低覆盖率代码修复工具的各项功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 导入被测试的函数
// 注意：由于fixLowCoverage.js是作为CLI工具设计的，我们需要修改它以导出函数
// 这里我们假设已经修改了fixLowCoverage.js以导出关键函数
const {
  getLowCoverageFiles,
  analyzeUncoveredCode,
  generateFixSuggestions,
  autoFixLowCoverage,
  generateCoverageReport,
} = require('../../utils/fixLowCoverage');

// 创建临时目录和文件
const tempDir = path.join(os.tmpdir(), 'fix-coverage-test-' + Date.now());
const coverageSummaryPath = path.join(tempDir, 'coverage-summary.json');
const sampleFilePath = path.join(tempDir, 'sample.js');
const outputReportPath = path.join(tempDir, 'coverage-report.md');

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

// 在所有测试之前设置
beforeAll(() => {
  // 创建临时目录
  fs.mkdirSync(tempDir, { recursive: true });

  // 写入模拟覆盖率数据
  fs.writeFileSync(coverageSummaryPath, JSON.stringify(mockCoverageData), 'utf8');

  // 写入模拟源代码
  fs.writeFileSync(sampleFilePath, mockSourceCode, 'utf8');
});

// 在所有测试之后清理
afterAll(() => {
  // 删除临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// 测试用例
describe('fixLowCoverage.js', () => {
  // 测试获取低覆盖率文件
  test('getLowCoverageFiles 应该正确识别低覆盖率文件', () => {
    const lowCoverageFiles = getLowCoverageFiles(tempDir, 80);

    expect(lowCoverageFiles).toHaveLength(1);
    expect(lowCoverageFiles[0].filePath).toBe('src/api/controllers/userController.js');
    expect(lowCoverageFiles[0].metrics.lines).toBe(60);
  });

  // 测试分析未覆盖代码
  test('analyzeUncoveredCode 应该正确分析未覆盖代码', () => {
    const uncoveredLines = [8, 11, 14, 17, 23];
    const analysis = analyzeUncoveredCode(sampleFilePath, uncoveredLines);

    expect(analysis.uncoveredCode).toEqual(expect.any(Array));
    expect(analysis.types).toEqual(
      expect.objectContaining({
        errorHandling: expect.any(Number),
        conditionalLogic: expect.any(Number),
      })
    );
  });

  // 测试生成修复建议
  test('generateFixSuggestions 应该生成有效的修复建议', () => {
    const analysis = {
      uncoveredCode: [
        { line: 8, content: '  if (!username || !password) {' },
        { line: 23, content: '  } catch (error) {' },
      ],
      types: {
        errorHandling: 1,
        conditionalLogic: 1,
        edgeCases: 0,
        unusedCode: 0,
        complexLogic: 0,
      },
    };

    const suggestions = generateFixSuggestions(sampleFilePath, analysis);

    expect(suggestions).toEqual(expect.any(Array));
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain('测试');
  });

  // 测试自动修复低覆盖率代码
  test('autoFixLowCoverage 应该尝试自动修复低覆盖率代码', async () => {
    const filePath = 'src/api/controllers/userController.js';
    const coverageData = {
      metrics: {
        lines: 60,
        statements: 66.67,
        functions: 60,
        branches: 53.33,
      },
      uncoveredLines: [5, 10, 15, 20, 25],
    };

    // 模拟执行命令
    const mockExecSync = jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
      return Buffer.from('测试生成成功');
    });

    const result = await autoFixLowCoverage(filePath, coverageData);

    expect(result).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        message: expect.any(String),
      })
    );

    mockExecSync.mockRestore();
  });

  // 测试生成覆盖率报告
  test('generateCoverageReport 应该生成有效的报告', () => {
    const lowCoverageFiles = [
      {
        filePath: 'src/api/controllers/userController.js',
        metrics: {
          lines: 60,
          statements: 66.67,
          functions: 60,
          branches: 53.33,
        },
        uncoveredLines: [5, 10, 15, 20, 25],
      },
    ];

    const fixResults = [
      {
        filePath: 'src/api/controllers/userController.js',
        success: true,
        message: '成功生成测试文件',
        suggestions: ['添加条件逻辑测试', '添加错误处理测试'],
      },
    ];

    generateCoverageReport(lowCoverageFiles, fixResults, outputReportPath);

    expect(fs.existsSync(outputReportPath)).toBe(true);
    const reportContent = fs.readFileSync(outputReportPath, 'utf8');
    expect(reportContent).toContain('# 低覆盖率代码分析报告');
    expect(reportContent).toContain('src/api/controllers/userController.js');
  });
});
