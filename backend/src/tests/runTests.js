#!/usr/bin/env node

/**
 * 测试运行脚本
 *
 * 此脚本用于运行所有测试，包括单元测试、集成测试和端到端测试
 *
 * 用法:
 *   node runTests.js [选项]
 *
 * 选项:
 *   --unit                  只运行单元测试
 *   --integration           只运行集成测试
 *   --e2e                   只运行端到端测试
 *   --coverage              生成覆盖率报告
 *   --analyze               分析覆盖率并生成报告
 *   --fix                   自动修复低覆盖率代码
 *   --help                  显示帮助信息
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  unit: false,
  integration: false,
  e2e: false,
  coverage: false,
  analyze: false,
  fix: false,
  help: false,
};

// 如果没有指定测试类型，则运行所有测试
if (!args.some((arg) => ['--unit', '--integration', '--e2e'].includes(arg))) {
  options.unit = true;
  options.integration = true;
  options.e2e = true;
}

// 解析参数
args.forEach((arg) => {
  if (arg === '--unit') options.unit = true;
  if (arg === '--integration') options.integration = true;
  if (arg === '--e2e') options.e2e = true;
  if (arg === '--coverage') options.coverage = true;
  if (arg === '--analyze') options.analyze = true;
  if (arg === '--fix') options.fix = true;
  if (arg === '--help') options.help = true;
});

// 显示帮助信息
if (options.help) {
  console.log(`
测试运行脚本

用法:
  node runTests.js [选项]

选项:
  --unit                  只运行单元测试
  --integration           只运行集成测试
  --e2e                   只运行端到端测试
  --coverage              生成覆盖率报告
  --analyze               分析覆盖率并生成报告
  --fix                   自动修复低覆盖率代码
  --help                  显示帮助信息
  `);
  process.exit(0);
}

// 获取项目根目录
const rootDir = path.resolve(__dirname, '../../..');

// 运行测试的函数
function runTests() {
  try {
    console.log('开始运行测试...');

    // 运行单元测试
    if (options.unit) {
      console.log('\n=== 运行单元测试 ===');
      execSync('jest --testMatch="**/*.test.js" --testPathIgnorePatterns="integration|e2e"', {
        cwd: rootDir,
        stdio: 'inherit',
      });
    }

    // 运行集成测试
    if (options.integration) {
      console.log('\n=== 运行集成测试 ===');
      execSync('jest --testMatch="**/integration/**/*.test.js"', {
        cwd: rootDir,
        stdio: 'inherit',
      });
    }

    // 运行端到端测试
    if (options.e2e) {
      console.log('\n=== 运行端到端测试 ===');
      execSync('jest --testMatch="**/e2e/**/*.test.js"', {
        cwd: rootDir,
        stdio: 'inherit',
      });
    }

    // 生成覆盖率报告
    if (options.coverage) {
      console.log('\n=== 生成覆盖率报告 ===');
      execSync('jest --coverage', {
        cwd: rootDir,
        stdio: 'inherit',
      });
    }

    // 分析覆盖率并生成报告
    if (options.analyze) {
      console.log('\n=== 分析覆盖率并生成报告 ===');
      execSync('node src/utils/analyzeCoverage.js --detailed --trend', {
        cwd: rootDir,
        stdio: 'inherit',
      });
    }

    // 自动修复低覆盖率代码
    if (options.fix) {
      console.log('\n=== 自动修复低覆盖率代码 ===');
      execSync('node src/utils/fixLowCoverage.js --fix', {
        cwd: rootDir,
        stdio: 'inherit',
      });
    }

    console.log('\n测试完成！');
  } catch (error) {
    console.error('\n测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();
