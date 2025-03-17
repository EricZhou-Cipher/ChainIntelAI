#!/usr/bin/env node

/**
 * 测试生成命令行工具
 *
 * 该脚本用于自动生成测试代码
 *
 * 用法:
 * node generateTests.js --source=src/api --output=tests/api --mock-deps --edge-cases
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { parseArgs } from 'util';
import { generateSmartTests, generateTestsForDirectory } from './generateAdvancedTests';
import { logger } from './logger';

// 解析命令行参数
const options = {
  source: { type: 'string' }, // 源文件或目录
  output: { type: 'string' }, // 输出文件或目录
  'mock-deps': { type: 'boolean', default: true }, // 是否模拟依赖
  'edge-cases': { type: 'boolean', default: true }, // 是否生成边界测试
  framework: { type: 'string', default: 'jest' }, // 测试框架
  'low-coverage': { type: 'boolean', default: false }, // 是否只处理低覆盖率文件
  'coverage-dir': { type: 'string', default: './coverage' }, // 覆盖率目录
  'min-coverage': { type: 'number', default: 80 }, // 最小覆盖率阈值
};

const { values } = parseArgs({ options });

/**
 * 获取低覆盖率文件
 * @param {string} coverageDir 覆盖率目录
 * @param {number} threshold 覆盖率阈值
 * @returns {Array} 低覆盖率文件列表
 */
function getLowCoverageFiles(coverageDir, threshold) {
  try {
    const summaryPath = path.join(coverageDir, 'coverage-summary.json');

    if (!fs.existsSync(summaryPath)) {
      logger.warn(`覆盖率摘要文件不存在: ${summaryPath}`);
      return [];
    }

    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const lowCoverageFiles = [];

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
        });
      }
    }

    // 按行覆盖率排序
    lowCoverageFiles.sort((a, b) => a.lineCoverage - b.lineCoverage);

    return lowCoverageFiles;
  } catch (error) {
    logger.error('获取低覆盖率文件失败:', error);
    return [];
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 检查必要参数
    if (!values.source) {
      console.error('错误: 必须提供源文件或目录');
      console.error('用法: node generateTests.js --source=src/api --output=tests/api');
      process.exit(1);
    }

    const sourcePath = path.resolve(process.cwd(), values.source);

    // 检查源文件或目录是否存在
    if (!fs.existsSync(sourcePath)) {
      console.error(`错误: 源文件或目录不存在: ${sourcePath}`);
      process.exit(1);
    }

    // 如果只处理低覆盖率文件
    if (values['low-coverage']) {
      const lowCoverageFiles = getLowCoverageFiles(values['coverage-dir'], values['min-coverage']);

      if (lowCoverageFiles.length === 0) {
        console.log('没有低覆盖率文件需要处理');
        return;
      }

      console.log(`找到${lowCoverageFiles.length}个低覆盖率文件`);

      for (const file of lowCoverageFiles) {
        const { filePath } = file;
        const absolutePath = path.resolve(process.cwd(), filePath);

        if (!fs.existsSync(absolutePath)) {
          console.warn(`文件不存在: ${absolutePath}`);
          continue;
        }

        // 生成测试文件路径
        let outputPath;
        if (values.output) {
          const relativePath = path.relative(process.cwd(), absolutePath);
          const testFileName = path.basename(relativePath).replace(/\.(js|ts)$/, '.test.$1');
          outputPath = path.join(values.output, testFileName);
        } else {
          const dir = path.dirname(absolutePath);
          const fileName = path.basename(absolutePath).replace(/\.(js|ts)$/, '.test.$1');
          outputPath = path.join(dir, fileName);
        }

        // 生成测试代码
        generateSmartTests(absolutePath, {
          outputPath,
          mockDependencies: values['mock-deps'],
          generateEdgeCases: values['edge-cases'],
          testFramework: values.framework,
        });
      }
    } else {
      // 处理源文件或目录
      const stats = fs.statSync(sourcePath);

      if (stats.isFile()) {
        // 处理单个文件
        let outputPath;
        if (values.output) {
          outputPath = path.resolve(process.cwd(), values.output);
        } else {
          const dir = path.dirname(sourcePath);
          const fileName = path.basename(sourcePath).replace(/\.(js|ts)$/, '.test.$1');
          outputPath = path.join(dir, fileName);
        }

        generateSmartTests(sourcePath, {
          outputPath,
          mockDependencies: values['mock-deps'],
          generateEdgeCases: values['edge-cases'],
          testFramework: values.framework,
        });
      } else if (stats.isDirectory()) {
        // 处理目录
        let outputDir;
        if (values.output) {
          outputDir = path.resolve(process.cwd(), values.output);
        } else {
          outputDir = path.join(sourcePath, 'tests');
        }

        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        generateTestsForDirectory(sourcePath, outputDir, {
          mockDependencies: values['mock-deps'],
          generateEdgeCases: values['edge-cases'],
          testFramework: values.framework,
        });
      }
    }

    console.log('测试生成完成');
  } catch (error) {
    console.error('生成测试失败:', error);
    process.exit(1);
  }
}

// 仅在直接运行时执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}

// 导出函数以便测试
export { getLowCoverageFiles, generateTestsForDirectory, main };
