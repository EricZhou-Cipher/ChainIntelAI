/**
 * 高级测试生成工具
 *
 * 该脚本能够生成更智能的测试代码，自动处理外部依赖和边界情况
 *
 * 用法:
 * const { generateSmartTests } = require('./generateAdvancedTests');
 * generateSmartTests('path/to/file.js');
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

/**
 * 分析源文件并生成智能测试
 * @param {string} filePath 源文件路径
 * @param {Object} options 选项
 * @returns {string} 生成的测试代码
 */
function generateSmartTests(filePath, options = {}) {
  try {
    const {
      outputPath = null,
      mockDependencies = true,
      generateEdgeCases = true,
      testFramework = 'jest',
    } = options;

    // 读取源文件
    const sourceCode = fs.readFileSync(filePath, 'utf8');

    // 分析源代码
    const analysis = analyzeSourceCode(sourceCode, filePath);

    // 生成测试代码
    const testCode = generateTestCode(filePath, analysis, {
      mockDependencies,
      generateEdgeCases,
      testFramework,
    });

    // 如果指定了输出路径，写入文件
    if (outputPath) {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, testCode);
      logger.info(`测试代码已生成: ${outputPath}`);
    }

    return testCode;
  } catch (error) {
    logger.error(`生成测试失败: ${error.message}`);
    return null;
  }
}

/**
 * 分析源代码
 * @param {string} sourceCode 源代码
 * @param {string} filePath 源文件路径
 * @returns {Object} 分析结果
 */
function analyzeSourceCode(sourceCode, filePath) {
  // 简化版分析，不使用AST
  const analysis = {
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    dependencies: new Set(),
  };

  // 分析导入
  const importRegex =
    /(?:import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]|const\s+(?:{[^}]*}|\w+)\s+=\s+require\(['"]([^'"]+)['"]\))/g;
  let match;
  while ((match = importRegex.exec(sourceCode)) !== null) {
    const importPath = match[1] || match[2];
    analysis.imports.push(importPath);

    // 添加到依赖集合
    if (importPath && !importPath.startsWith('.')) {
      analysis.dependencies.add(importPath);
    }
  }

  // 分析函数
  const functionRegex =
    /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*(?:async\s*)?\s*function)/g;
  while ((match = functionRegex.exec(sourceCode)) !== null) {
    const functionName = match[1] || match[2] || match[3];
    if (functionName) {
      analysis.functions.push({
        name: functionName,
        async: sourceCode.substring(match.index - 20, match.index).includes('async'),
        exported:
          sourceCode.includes(`exports.${functionName}`) ||
          sourceCode.includes(`export const ${functionName}`) ||
          sourceCode.includes(`export function ${functionName}`),
      });
    }
  }

  // 分析类
  const classRegex = /class\s+(\w+)/g;
  while ((match = classRegex.exec(sourceCode)) !== null) {
    const className = match[1];
    analysis.classes.push({
      name: className,
      exported:
        sourceCode.includes(`exports.${className}`) ||
        sourceCode.includes(`export class ${className}`),
    });
  }

  // 分析条件语句，用于生成边界测试
  const conditionalRegex = /if\s*\(([^)]+)\)|([^?]+)\s*\?\s*([^:]+)\s*:\s*([^;]+)/g;
  const conditionals = [];
  while ((match = conditionalRegex.exec(sourceCode)) !== null) {
    const condition = match[1] || match[2];
    conditionals.push(condition.trim());
  }
  analysis.conditionals = conditionals;

  return analysis;
}

/**
 * 生成测试代码
 * @param {string} filePath 源文件路径
 * @param {Object} analysis 分析结果
 * @param {Object} options 选项
 * @returns {string} 测试代码
 */
function generateTestCode(filePath, analysis, options) {
  const { mockDependencies, generateEdgeCases, testFramework } = options;

  const moduleName = path.basename(filePath, path.extname(filePath));
  const moduleImportPath =
    `./${path.relative(path.dirname(filePath), filePath).replace(/\\/g, '/')}`.replace(
      /\.\w+$/,
      ''
    );

  let code = `/**
 * ${moduleName} 测试文件
 * 由高级测试生成工具自动生成
 */

`;

  // 导入测试框架
  if (testFramework === 'jest') {
    code += `const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');\n`;
  }

  // 导入被测模块
  const exportedFunctions = analysis.functions.filter((f) => f.exported).map((f) => f.name);
  const exportedClasses = analysis.classes.filter((c) => c.exported).map((c) => c.name);

  if (exportedFunctions.length > 0 || exportedClasses.length > 0) {
    code += `const { ${[...exportedFunctions, ...exportedClasses].join(', ')} } = require('${moduleImportPath}');\n`;
  } else {
    code += `const ${moduleName} = require('${moduleImportPath}');\n`;
  }

  // 模拟依赖
  if (mockDependencies && analysis.dependencies.size > 0) {
    code += '\n// 模拟外部依赖\n';
    analysis.dependencies.forEach((dep) => {
      code += `jest.mock('${dep}');\n`;
    });
  }

  code += '\n';

  // 为每个导出的函数生成测试
  if (exportedFunctions.length > 0) {
    exportedFunctions.forEach((funcName) => {
      const func = analysis.functions.find((f) => f.name === funcName);

      code += `describe('${funcName}', () => {\n`;

      // 设置和清理
      code += `  beforeEach(() => {\n`;
      code += `    jest.clearAllMocks();\n`;
      code += `  });\n\n`;

      // 基本测试用例
      code += `  test('应该正确处理有效输入', ${func.async ? 'async ' : ''}() => {\n`;
      code += `    // 准备测试数据\n`;
      code += `    const input = 'test';\n\n`;

      // 模拟依赖
      if (mockDependencies && analysis.dependencies.size > 0) {
        code += `    // 模拟依赖\n`;
        analysis.dependencies.forEach((dep) => {
          const mockName = dep
            .split('/')
            .pop()
            .replace(/[^a-zA-Z0-9]/g, '');
          code += `    const mock${mockName} = require('${dep}');\n`;
          code += `    mock${mockName}.mockImplementation(() => 'mocked');\n`;
        });
        code += '\n';
      }

      // 执行函数
      code += `    ${func.async ? 'const result = await ' : 'const result = '}${funcName}(input);\n\n`;

      // 验证结果
      code += `    // 验证结果\n`;
      code += `    expect(result).toBeDefined();\n`;
      code += `  });\n\n`;

      // 边界测试用例
      if (generateEdgeCases) {
        code += `  test('应该处理边界情况', ${func.async ? 'async ' : ''}() => {\n`;
        code += `    // 准备边界测试数据\n`;
        code += `    const input = null;\n\n`;

        // 执行函数并验证异常
        if (func.async) {
          code += `    await expect(async () => {\n`;
          code += `      await ${funcName}(input);\n`;
          code += `    }).rejects.toThrow();\n`;
        } else {
          code += `    expect(() => {\n`;
          code += `      ${funcName}(input);\n`;
          code += `    }).toThrow();\n`;
        }

        code += `  });\n\n`;
      }

      code += `});\n\n`;
    });
  }

  // 为每个导出的类生成测试
  if (exportedClasses.length > 0) {
    exportedClasses.forEach((className) => {
      code += `describe('${className}', () => {\n`;

      // 设置和清理
      code += `  let instance;\n\n`;
      code += `  beforeEach(() => {\n`;
      code += `    jest.clearAllMocks();\n`;
      code += `    instance = new ${className}();\n`;
      code += `  });\n\n`;

      // 测试构造函数
      code += `  test('应该正确实例化', () => {\n`;
      code += `    expect(instance).toBeInstanceOf(${className});\n`;
      code += `  });\n\n`;

      code += `});\n\n`;
    });
  }

  // 如果没有导出的函数或类，为模块生成基本测试
  if (exportedFunctions.length === 0 && exportedClasses.length === 0) {
    code += `describe('${moduleName}', () => {\n`;
    code += `  test('应该正确导入模块', () => {\n`;
    code += `    expect(${moduleName}).toBeDefined();\n`;
    code += `  });\n`;
    code += `});\n`;
  }

  return code;
}

/**
 * 为指定目录下的所有文件生成测试
 * @param {string} sourceDir 源目录
 * @param {string} testDir 测试目录
 * @param {Object} options 选项
 */
function generateTestsForDirectory(sourceDir, testDir, options = {}) {
  const files = fs.readdirSync(sourceDir);

  files.forEach((file) => {
    const sourcePath = path.join(sourceDir, file);
    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      // 递归处理子目录
      const subTestDir = path.join(testDir, file);
      if (!fs.existsSync(subTestDir)) {
        fs.mkdirSync(subTestDir, { recursive: true });
      }
      generateTestsForDirectory(sourcePath, subTestDir, options);
    } else if (
      stats.isFile() &&
      /\.(js|ts)$/.test(file) &&
      !file.includes('.test.') &&
      !file.includes('.spec.')
    ) {
      // 生成测试文件
      const testFileName = file.replace(/\.(js|ts)$/, '.test.$1');
      const testFilePath = path.join(testDir, testFileName);

      generateSmartTests(sourcePath, {
        ...options,
        outputPath: testFilePath,
      });
    }
  });
}

module.exports = {
  generateSmartTests,
  generateTestsForDirectory,
  analyzeSourceCode,
};
