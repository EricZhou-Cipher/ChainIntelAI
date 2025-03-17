/**
 * generateTests.js 测试文件
 *
 * 测试自动生成测试的工具的各项功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 导入被测试的函数
// 注意：由于generateTests.js是作为CLI工具设计的，我们需要修改它以导出函数
// 这里我们假设已经修改了generateTests.js以导出关键函数
const {
  getLowCoverageFiles,
  generateTestFile,
  generateTestsForFile,
  generateTestsForDirectory,
} = require('../../utils/generateTests');

// 创建临时目录和文件
const tempDir = path.join(os.tmpdir(), 'generate-tests-' + Date.now());
const coverageSummaryPath = path.join(tempDir, 'coverage-summary.json');
const sampleFilePath = path.join(tempDir, 'sample.js');
const outputTestPath = path.join(tempDir, 'sample.test.js');

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
};

// 模拟源代码文件
const mockSourceCode = `
/**
 * 用户控制器
 */
const User = require('../models/User');
const { generateToken } = require('../utils/auth');

/**
 * 用户登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Object} 响应结果
 */
async function login(req, res) {
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
}

/**
 * 用户注册
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Object} 响应结果
 */
async function register(req, res) {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ error: '用户名、密码和邮箱不能为空' });
    }
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ error: '用户名或邮箱已被使用' });
    }
    
    // 创建新用户
    const user = new User({ username, password, email });
    await user.save();
    
    const token = generateToken(user);
    
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
}

module.exports = {
  login,
  register
};
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
describe('generateTests.js', () => {
  // 测试获取低覆盖率文件
  test('getLowCoverageFiles 应该正确识别低覆盖率文件', () => {
    const lowCoverageFiles = getLowCoverageFiles(tempDir, 80);

    expect(lowCoverageFiles).toHaveLength(1);
    expect(lowCoverageFiles[0]).toBe('src/api/controllers/userController.js');
  });

  // 测试生成测试文件
  test('generateTestFile 应该生成有效的测试文件', () => {
    const testCode = `
describe('User Controller', () => {
  test('login should return token for valid credentials', async () => {
    // 测试代码
  });
});
`;

    generateTestFile(outputTestPath, testCode);

    expect(fs.existsSync(outputTestPath)).toBe(true);
    const fileContent = fs.readFileSync(outputTestPath, 'utf8');
    expect(fileContent).toContain("describe('User Controller'");
  });

  // 测试为文件生成测试
  test('generateTestsForFile 应该为源文件生成测试', async () => {
    const options = {
      mockDeps: true,
      edgeCases: true,
      framework: 'jest',
    };

    const result = await generateTestsForFile(sampleFilePath, tempDir, options);

    expect(result).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        testPath: expect.any(String),
      })
    );

    expect(fs.existsSync(result.testPath)).toBe(true);
    const testContent = fs.readFileSync(result.testPath, 'utf8');
    expect(testContent).toContain('describe');
    expect(testContent).toContain('test');
    expect(testContent).toContain('login');
    expect(testContent).toContain('register');
  });

  // 测试为目录生成测试
  test('generateTestsForDirectory 应该为目录中的文件生成测试', async () => {
    // 创建测试目录结构
    const sourceDir = path.join(tempDir, 'src');
    const controllersDir = path.join(sourceDir, 'controllers');
    fs.mkdirSync(controllersDir, { recursive: true });

    // 复制示例文件到测试目录
    fs.copyFileSync(sampleFilePath, path.join(controllersDir, 'userController.js'));

    const outputDir = path.join(tempDir, 'tests');
    const options = {
      mockDeps: true,
      edgeCases: true,
      framework: 'jest',
    };

    const results = await generateTestsForDirectory(sourceDir, outputDir, options);

    expect(results).toEqual(expect.any(Array));
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toEqual(
      expect.objectContaining({
        success: expect.any(Boolean),
        sourcePath: expect.stringContaining('userController.js'),
        testPath: expect.stringContaining('userController.test.js'),
      })
    );

    expect(fs.existsSync(path.join(outputDir, 'controllers', 'userController.test.js'))).toBe(true);
  });
});
