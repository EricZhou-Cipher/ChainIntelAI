#!/usr/bin/env node

/**
 * 低覆盖率代码修复工具
 *
 * 该脚本用于自动分析和修复低覆盖率代码
 *
 * 用法:
 * node fixLowCoverage.js --coverage-dir=./coverage --min-coverage=80 --fix
 */

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import { execSync } from 'child_process';
import { logger } from './logger';

// 解析命令行参数
const options = {
  'coverage-dir': { type: 'string', default: './coverage' }, // 覆盖率目录
  'min-coverage': { type: 'number', default: 80 }, // 最小覆盖率阈值
  fix: { type: 'boolean', default: false }, // 是否自动修复
  report: { type: 'boolean', default: true }, // 是否生成报告
  output: { type: 'string', default: './coverage-report.md' }, // 报告输出路径
  'max-files': { type: 'number', default: 10 }, // 最多处理文件数
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
          uncoveredLines: data.lines.skipped || [],
          uncoveredFunctions: data.functions.skipped || [],
          uncoveredBranches: data.branches ? data.branches.skipped || [] : [],
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
 * 分析未覆盖代码
 * @param {string} filePath 文件路径
 * @param {Array} uncoveredLines 未覆盖行
 * @returns {Object} 分析结果
 */
function analyzeUncoveredCode(filePath, uncoveredLines) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const uncoveredCode = uncoveredLines.map((lineNum) => ({
      lineNum,
      code: lines[lineNum - 1],
    }));

    // 分析未覆盖代码类型
    const analysis = {
      errorHandling: 0,
      conditionalLogic: 0,
      edgeCases: 0,
      unusedCode: 0,
      complexLogic: 0,
    };

    for (const { code } of uncoveredCode) {
      if (code.includes('catch') || code.includes('throw') || code.includes('try')) {
        analysis.errorHandling++;
      } else if (
        code.includes('if') ||
        code.includes('else') ||
        code.includes('switch') ||
        code.includes('?')
      ) {
        analysis.conditionalLogic++;
      } else if (
        code.includes('null') ||
        code.includes('undefined') ||
        code.includes('NaN') ||
        code.includes('isNaN')
      ) {
        analysis.edgeCases++;
      } else if (code.trim().startsWith('//') || code.includes('TODO') || code.includes('FIXME')) {
        analysis.unusedCode++;
      } else if (
        code.includes('for') ||
        code.includes('while') ||
        code.includes('reduce') ||
        code.includes('map')
      ) {
        analysis.complexLogic++;
      }
    }

    return {
      uncoveredCode,
      analysis,
    };
  } catch (error) {
    logger.error(`分析未覆盖代码失败: ${filePath}`, error);
    return {
      uncoveredCode: [],
      analysis: {},
    };
  }
}

/**
 * 生成测试修复建议
 * @param {string} filePath 文件路径
 * @param {Object} analysis 分析结果
 * @returns {string} 修复建议
 */
function generateFixSuggestions(filePath, analysis) {
  const suggestions = [];

  if (analysis.errorHandling > 0) {
    suggestions.push(`- 添加错误处理测试: 模拟异常情况，确保错误处理逻辑被覆盖`);
  }

  if (analysis.conditionalLogic > 0) {
    suggestions.push(`- 添加条件逻辑测试: 确保所有条件分支都被测试到`);
  }

  if (analysis.edgeCases > 0) {
    suggestions.push(`- 添加边界测试: 测试null、undefined等边界情况`);
  }

  if (analysis.unusedCode > 0) {
    suggestions.push(`- 移除未使用代码: 删除注释掉的代码或标记为TODO的代码`);
  }

  if (analysis.complexLogic > 0) {
    suggestions.push(`- 简化复杂逻辑: 将复杂逻辑拆分为更小的函数，便于测试`);
  }

  return suggestions.join('\n');
}

/**
 * 自动修复低覆盖率代码
 * @param {string} filePath 文件路径
 * @param {Object} coverageData 覆盖率数据
 * @returns {boolean} 是否成功修复
 */
function autoFixLowCoverage(filePath, coverageData) {
  try {
    // 生成测试文件
    const testFilePath = filePath.replace(/\.(js|ts)$/, '.test.$1');

    // 使用generateTests.js生成测试
    const cmd = `node ${path.join(__dirname, 'generateTests.js')} --source=${filePath} --output=${testFilePath} --edge-cases --mock-deps`;

    console.log(`执行命令: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });

    return true;
  } catch (error) {
    logger.error(`自动修复失败: ${filePath}`, error);
    return false;
  }
}

/**
 * 生成覆盖率报告
 * @param {Array} lowCoverageFiles 低覆盖率文件列表
 * @param {Array} fixResults 修复结果
 * @param {string} outputPath 输出路径
 */
function generateCoverageReport(lowCoverageFiles, fixResults, outputPath) {
  try {
    let report = `# 代码覆盖率分析报告\n\n`;
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;
    report += `## 覆盖率摘要\n\n`;
    report += `- 总文件数: ${lowCoverageFiles.length}\n`;
    report += `- 已修复文件数: ${fixResults.filter((r) => r.fixed).length}\n`;
    report += `- 未修复文件数: ${fixResults.filter((r) => !r.fixed).length}\n\n`;

    report += `## 低覆盖率文件详情\n\n`;

    for (let i = 0; i < fixResults.length; i++) {
      const { file, fixed, suggestions } = fixResults[i];
      const { filePath, lineCoverage, branchCoverage, functionCoverage } = file;

      report += `### ${i + 1}. ${filePath}\n\n`;
      report += `- 行覆盖率: ${lineCoverage.toFixed(2)}%\n`;
      report += `- 分支覆盖率: ${branchCoverage.toFixed(2)}%\n`;
      report += `- 函数覆盖率: ${functionCoverage.toFixed(2)}%\n`;
      report += `- 状态: ${fixed ? '已修复' : '未修复'}\n\n`;

      if (suggestions && suggestions.length > 0) {
        report += `#### 修复建议\n\n${suggestions}\n\n`;
      }
    }

    fs.writeFileSync(outputPath, report);
    console.log(`覆盖率报告已生成: ${outputPath}`);
  } catch (error) {
    logger.error(`生成覆盖率报告失败`, error);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始分析低覆盖率代码...');

    // 获取低覆盖率文件
    const lowCoverageFiles = getLowCoverageFiles(values['coverage-dir'], values['min-coverage']);

    if (lowCoverageFiles.length === 0) {
      console.log('没有低覆盖率文件需要处理');
      return;
    }

    console.log(`找到${lowCoverageFiles.length}个低覆盖率文件`);

    // 限制处理文件数
    const filesToProcess = lowCoverageFiles.slice(0, values['max-files']);

    const fixResults = [];

    for (const file of filesToProcess) {
      const { filePath } = file;
      const absolutePath = path.resolve(process.cwd(), filePath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`文件不存在: ${absolutePath}`);
        continue;
      }

      console.log(`分析文件: ${filePath}`);
      console.log(`- 行覆盖率: ${file.lineCoverage.toFixed(2)}%`);
      console.log(`- 分支覆盖率: ${file.branchCoverage.toFixed(2)}%`);
      console.log(`- 函数覆盖率: ${file.functionCoverage.toFixed(2)}%`);

      // 分析未覆盖代码
      const { analysis } = analyzeUncoveredCode(absolutePath, file.uncoveredLines);

      // 生成修复建议
      const suggestions = generateFixSuggestions(filePath, analysis);

      console.log('修复建议:');
      console.log(suggestions);

      let fixed = false;

      // 自动修复
      if (values.fix) {
        console.log(`尝试自动修复: ${filePath}`);
        fixed = autoFixLowCoverage(absolutePath, file);
        console.log(`修复${fixed ? '成功' : '失败'}: ${filePath}`);
      }

      fixResults.push({
        file,
        fixed,
        suggestions,
      });
    }

    // 生成报告
    if (values.report) {
      generateCoverageReport(lowCoverageFiles, fixResults, values.output);
    }

    console.log('分析完成');
  } catch (error) {
    console.error('分析失败:', error);
    process.exit(1);
  }
}

// 仅在直接运行时执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// 导出函数以便测试
export {
  getLowCoverageFiles,
  analyzeUncoveredCode,
  generateFixSuggestions,
  autoFixLowCoverage,
  generateCoverageReport,
  main,
};
