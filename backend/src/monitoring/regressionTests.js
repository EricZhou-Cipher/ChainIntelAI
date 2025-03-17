/**
 * 智能回归测试工具
 *
 * 该脚本实现了智能回归测试，包括选择性测试、历史PR分析和测试缓存
 *
 * 用法:
 * node regressionTests.js --affected-modules=api,database --cache=true
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseArgs } = require('util');
const crypto = require('crypto');

// 解析命令行参数
const options = {
  'affected-modules': { type: 'string' }, // 逗号分隔的受影响模块列表
  cache: { type: 'boolean', default: true }, // 是否启用测试缓存
  'cache-dir': { type: 'string', default: '.test-cache' }, // 测试缓存目录
  'analyze-pr': { type: 'boolean', default: false }, // 是否分析PR历史
  'pr-limit': { type: 'number', default: 10 }, // 分析的PR数量限制
  'update-baseline': { type: 'boolean', default: false }, // 是否更新性能基准
  verbose: { type: 'boolean', default: false }, // 是否输出详细日志
};

const { values } = parseArgs({ options });

// 模块依赖关系图
const MODULE_DEPENDENCIES = {
  api: ['database', 'analyzer', 'monitoring'],
  database: [],
  analyzer: ['database'],
  pipeline: ['database', 'analyzer'],
  monitoring: ['database'],
  utils: [],
};

// 主函数
async function runRegressionTests() {
  console.log('开始智能回归测试...');

  // 获取受影响的模块
  const affectedModules = getAffectedModules();
  console.log(`受影响的模块: ${affectedModules.join(', ')}`);

  // 获取需要测试的模块（包括依赖关系）
  const modulesToTest = getModulesToTest(affectedModules);
  console.log(`需要测试的模块: ${modulesToTest.join(', ')}`);

  // 如果需要分析PR历史，获取历史PR影响范围
  if (values['analyze-pr']) {
    const prAffectedModules = await analyzePRHistory();
    console.log(`历史PR影响的模块: ${prAffectedModules.join(', ')}`);

    // 合并历史PR影响的模块
    for (const module of prAffectedModules) {
      if (!modulesToTest.includes(module)) {
        modulesToTest.push(module);
      }
    }

    console.log(`合并后需要测试的模块: ${modulesToTest.join(', ')}`);
  }

  // 运行测试
  const testResults = await runTests(modulesToTest);

  // 如果需要更新性能基准，检查性能是否有改善
  if (values['update-baseline']) {
    await checkPerformanceImprovement();
  }

  // 输出测试结果摘要
  console.log('\n测试结果摘要:');
  console.log(`总测试数: ${testResults.totalTests}`);
  console.log(`通过测试数: ${testResults.passedTests}`);
  console.log(`失败测试数: ${testResults.failedTests}`);
  console.log(`跳过测试数: ${testResults.skippedTests}`);
  console.log(`测试覆盖率: ${testResults.coverage.toFixed(2)}%`);
  console.log(`测试执行时间: ${testResults.executionTime.toFixed(2)}秒`);

  // 如果有测试失败，返回非零退出码
  if (testResults.failedTests > 0) {
    process.exit(1);
  }
}

// 获取受影响的模块
function getAffectedModules() {
  // 如果命令行参数指定了受影响的模块，使用命令行参数
  if (values['affected-modules']) {
    return values['affected-modules'].split(',').map((module) => module.trim());
  }

  // 否则，通过Git获取受影响的模块
  try {
    // 获取最近的提交
    const latestCommit = execSync('git rev-parse HEAD').toString().trim();
    const previousCommit = execSync('git rev-parse HEAD~1').toString().trim();

    // 获取变更的文件
    const changedFiles = execSync(`git diff --name-only ${previousCommit} ${latestCommit}`)
      .toString()
      .trim()
      .split('\n');

    // 根据文件路径确定受影响的模块
    const affectedModules = new Set();

    for (const file of changedFiles) {
      if (file.startsWith('backend/src/api/')) {
        affectedModules.add('api');
      } else if (file.startsWith('backend/src/database/')) {
        affectedModules.add('database');
      } else if (file.startsWith('backend/src/analyzer/')) {
        affectedModules.add('analyzer');
      } else if (file.startsWith('backend/src/pipeline/')) {
        affectedModules.add('pipeline');
      } else if (file.startsWith('backend/src/monitoring/')) {
        affectedModules.add('monitoring');
      } else if (file.startsWith('backend/src/utils/')) {
        affectedModules.add('utils');
      }
    }

    return Array.from(affectedModules);
  } catch (error) {
    console.warn('获取受影响模块失败:', error.message);
    // 如果无法确定受影响的模块，返回所有模块
    return Object.keys(MODULE_DEPENDENCIES);
  }
}

// 获取需要测试的模块（包括依赖关系）
function getModulesToTest(affectedModules) {
  const modulesToTest = new Set(affectedModules);

  // 添加依赖于受影响模块的模块
  for (const [module, dependencies] of Object.entries(MODULE_DEPENDENCIES)) {
    if (!modulesToTest.has(module)) {
      for (const dependency of dependencies) {
        if (affectedModules.includes(dependency)) {
          modulesToTest.add(module);
          break;
        }
      }
    }
  }

  return Array.from(modulesToTest);
}

// 分析PR历史
async function analyzePRHistory() {
  console.log('分析PR历史...');

  try {
    // 获取最近的PR
    const prLimit = values['pr-limit'];
    const prListCommand = `git log --merges -n ${prLimit} --pretty=format:"%H|%s"`;
    const prList = execSync(prListCommand).toString().trim().split('\n');

    const prAffectedModules = new Set();

    for (const pr of prList) {
      const [commitHash, commitMessage] = pr.split('|');

      // 获取PR中变更的文件
      const changedFilesCommand = `git show --name-only --pretty=format:"" ${commitHash}`;
      const changedFiles = execSync(changedFilesCommand)
        .toString()
        .trim()
        .split('\n')
        .filter(Boolean);

      // 根据文件路径确定受影响的模块
      for (const file of changedFiles) {
        if (file.startsWith('backend/src/api/')) {
          prAffectedModules.add('api');
        } else if (file.startsWith('backend/src/database/')) {
          prAffectedModules.add('database');
        } else if (file.startsWith('backend/src/analyzer/')) {
          prAffectedModules.add('analyzer');
        } else if (file.startsWith('backend/src/pipeline/')) {
          prAffectedModules.add('pipeline');
        } else if (file.startsWith('backend/src/monitoring/')) {
          prAffectedModules.add('monitoring');
        } else if (file.startsWith('backend/src/utils/')) {
          prAffectedModules.add('utils');
        }
      }

      // 如果PR消息中包含特定关键词，添加相关模块
      const lowerCaseMessage = commitMessage.toLowerCase();
      if (lowerCaseMessage.includes('api') || lowerCaseMessage.includes('endpoint')) {
        prAffectedModules.add('api');
      }
      if (
        lowerCaseMessage.includes('database') ||
        lowerCaseMessage.includes('db') ||
        lowerCaseMessage.includes('mongo') ||
        lowerCaseMessage.includes('redis')
      ) {
        prAffectedModules.add('database');
      }
      if (lowerCaseMessage.includes('analyzer') || lowerCaseMessage.includes('analysis')) {
        prAffectedModules.add('analyzer');
      }
      if (lowerCaseMessage.includes('pipeline')) {
        prAffectedModules.add('pipeline');
      }
      if (lowerCaseMessage.includes('monitor') || lowerCaseMessage.includes('metrics')) {
        prAffectedModules.add('monitoring');
      }
    }

    return Array.from(prAffectedModules);
  } catch (error) {
    console.warn('分析PR历史失败:', error.message);
    return [];
  }
}

// 运行测试
async function runTests(modulesToTest) {
  console.log('运行测试...');

  // 准备测试结果
  const testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    coverage: 0,
    executionTime: 0,
  };

  // 确保测试缓存目录存在
  const cacheDir = path.resolve(process.cwd(), values['cache-dir']);
  if (values.cache && !fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // 构建测试模式
  const testPatterns = [];
  for (const module of modulesToTest) {
    testPatterns.push(`src/tests/unit/${module}`);
    testPatterns.push(`src/tests/integration/${module}`);
  }

  if (testPatterns.length === 0) {
    console.log('没有需要测试的模块，跳过测试');
    return testResults;
  }

  const testPattern = `(${testPatterns.join('|')})`;

  try {
    // 获取测试文件列表
    const testFilesCommand = `find backend/src/tests -path "*${testPattern}*" -name "*.test.js" -o -name "*.test.ts"`;
    const testFiles = execSync(testFilesCommand).toString().trim().split('\n').filter(Boolean);

    console.log(`找到${testFiles.length}个测试文件`);

    // 计算测试文件的哈希值，用于缓存
    const testFilesHashes = {};
    for (const testFile of testFiles) {
      const fileContent = fs.readFileSync(testFile, 'utf8');
      const hash = crypto.createHash('md5').update(fileContent).digest('hex');
      testFilesHashes[testFile] = hash;
    }

    // 获取源文件列表
    const sourceFilesCommand = `find backend/src -path "*${testPattern.replace(/tests\//g, '')}*" -name "*.js" -o -name "*.ts" | grep -v ".test."`;
    const sourceFiles = execSync(sourceFilesCommand).toString().trim().split('\n').filter(Boolean);

    // 计算源文件的哈希值
    for (const sourceFile of sourceFiles) {
      const fileContent = fs.readFileSync(sourceFile, 'utf8');
      const hash = crypto.createHash('md5').update(fileContent).digest('hex');
      testFilesHashes[sourceFile] = hash;
    }

    // 检查缓存
    const cachedTests = new Set();
    if (values.cache) {
      const cacheFile = path.join(cacheDir, 'test-cache.json');
      if (fs.existsSync(cacheFile)) {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

        for (const testFile of testFiles) {
          const testFileHash = testFilesHashes[testFile];
          const cachedHash = cache[testFile];

          // 如果测试文件的哈希值与缓存中的相同，且所有依赖的源文件哈希值也相同，则可以跳过测试
          if (testFileHash === cachedHash?.hash) {
            const dependencies = cachedHash.dependencies || [];
            let allDependenciesUnchanged = true;

            for (const dependency of dependencies) {
              if (testFilesHashes[dependency] !== cachedHash.dependencyHashes?.[dependency]) {
                allDependenciesUnchanged = false;
                break;
              }
            }

            if (allDependenciesUnchanged) {
              cachedTests.add(testFile);
              testResults.skippedTests++;
            }
          }
        }
      }
    }

    // 过滤掉已缓存的测试
    const testsToRun = testFiles.filter((testFile) => !cachedTests.has(testFile));

    if (testsToRun.length === 0) {
      console.log('所有测试都已缓存，跳过测试');

      // 更新测试结果
      testResults.totalTests = testFiles.length;
      testResults.passedTests = testFiles.length;

      return testResults;
    }

    console.log(`运行${testsToRun.length}个测试文件（跳过${cachedTests.size}个已缓存的测试）`);

    // 构建测试命令
    const testCommand = `cd backend && yarn jest ${testsToRun.join(' ')} --coverage --json --outputFile=test-results.json`;

    // 记录开始时间
    const startTime = Date.now();

    // 运行测试
    execSync(testCommand, { stdio: 'inherit' });

    // 记录结束时间
    const endTime = Date.now();
    testResults.executionTime = (endTime - startTime) / 1000;

    // 解析测试结果
    const testResultsFile = path.resolve(process.cwd(), 'backend/test-results.json');
    if (fs.existsSync(testResultsFile)) {
      const jestResults = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));

      testResults.totalTests = jestResults.numTotalTests;
      testResults.passedTests = jestResults.numPassedTests;
      testResults.failedTests = jestResults.numFailedTests;

      // 解析覆盖率
      if (jestResults.coverageMap) {
        let totalStatements = 0;
        let coveredStatements = 0;

        for (const filePath in jestResults.coverageMap) {
          const fileCoverage = jestResults.coverageMap[filePath];
          totalStatements += fileCoverage.statementMap
            ? Object.keys(fileCoverage.statementMap).length
            : 0;
          coveredStatements += fileCoverage.s
            ? Object.values(fileCoverage.s).filter((v) => v > 0).length
            : 0;
        }

        testResults.coverage =
          totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
      }

      // 更新缓存
      if (values.cache && testResults.failedTests === 0) {
        const cacheFile = path.join(cacheDir, 'test-cache.json');
        const cache = fs.existsSync(cacheFile)
          ? JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
          : {};

        // 更新通过的测试的缓存
        for (const testFile of testsToRun) {
          // 获取测试文件的依赖关系
          const dependencies = getTestDependencies(testFile);
          const dependencyHashes = {};

          for (const dependency of dependencies) {
            dependencyHashes[dependency] = testFilesHashes[dependency];
          }

          cache[testFile] = {
            hash: testFilesHashes[testFile],
            dependencies,
            dependencyHashes,
            timestamp: Date.now(),
          };
        }

        fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
      }
    }

    return testResults;
  } catch (error) {
    console.error('运行测试失败:', error.message);
    testResults.failedTests = 1;
    return testResults;
  }
}

// 获取测试文件的依赖关系
function getTestDependencies(testFile) {
  try {
    // 读取测试文件内容
    const fileContent = fs.readFileSync(testFile, 'utf8');

    // 提取导入语句
    const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
    const dependencies = [];
    let match;

    while ((match = importRegex.exec(fileContent)) !== null) {
      const importPath = match[1];

      // 如果是相对路径导入
      if (importPath.startsWith('.')) {
        // 解析绝对路径
        const testDir = path.dirname(testFile);
        const absolutePath = path.resolve(testDir, importPath);

        // 尝试不同的扩展名
        const extensions = ['.js', '.ts', '.jsx', '.tsx'];
        for (const ext of extensions) {
          const dependencyPath = `${absolutePath}${ext}`;
          if (fs.existsSync(dependencyPath)) {
            dependencies.push(dependencyPath);
            break;
          }
        }
      }
    }

    return dependencies;
  } catch (error) {
    console.warn(`获取测试依赖关系失败: ${testFile}`, error.message);
    return [];
  }
}

// 检查性能是否有改善
async function checkPerformanceImprovement() {
  console.log('检查性能改善...');

  try {
    // 运行性能比较脚本
    const compareCommand =
      'cd backend && node src/monitoring/compareRegressionResults.js --current-report=../load-test-results/report.json --baseline-report=regression-results/baseline-report.json';
    execSync(compareCommand, { stdio: 'inherit' });

    // 检查是否有性能改善
    const updateBaselinePath = path.resolve(
      process.cwd(),
      'backend/regression-results/update-baseline'
    );
    if (fs.existsSync(updateBaselinePath)) {
      console.log('检测到性能改善，更新基准');

      // 更新基准
      const updateCommand =
        'cd backend && aws s3 cp src/tests/performance/api.load.test.yml s3://$AWS_S3_BUCKET/baseline-tests/baseline.yml';
      execSync(updateCommand, { stdio: 'inherit' });

      // 删除标记文件
      fs.unlinkSync(updateBaselinePath);
    } else {
      console.log('未检测到显著性能改善，保持基准不变');
    }
  } catch (error) {
    console.warn('检查性能改善失败:', error.message);
  }
}

// 执行主函数
runRegressionTests().catch((error) => {
  console.error('智能回归测试失败:', error);
  process.exit(1);
});
