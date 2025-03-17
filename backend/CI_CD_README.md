# ChainIntelAI CI/CD测试自动化与性能监控

本文档详细介绍了ChainIntelAI项目的CI/CD测试自动化和性能监控系统。

## 目录

- [测试自动化](#测试自动化)
  - [GitHub Actions工作流](#github-actions工作流)
  - [自动化测试类型](#自动化测试类型)
  - [覆盖率分析](#覆盖率分析)
  - [自动修复低覆盖率代码](#自动修复低覆盖率代码)
- [性能监控](#性能监控)
  - [Prometheus指标](#prometheus指标)
  - [性能基准测试](#性能基准测试)
  - [性能警报](#性能警报)
- [测试报告自动化](#测试报告自动化)
  - [覆盖率报告](#覆盖率报告)
  - [性能趋势报告](#性能趋势报告)
- [环境变量配置](#环境变量配置)
  - [GitHub Actions环境变量](#github-actions环境变量)
  - [通知配置](#通知配置)
- [本地开发测试](#本地开发测试)
  - [运行测试](#运行测试)
  - [生成测试](#生成测试)
  - [修复低覆盖率代码](#修复低覆盖率代码)

## 测试自动化

### GitHub Actions工作流

我们使用GitHub Actions自动化测试流程。主要工作流文件位于`.github/workflows/test-coverage.yml`，包含以下作业：

1. **测试与覆盖率分析**：运行单元测试和集成测试，生成覆盖率报告
2. **性能测试**：运行API性能测试，生成性能报告
3. **自动修复**：自动修复低覆盖率代码（仅在手动触发时执行）

工作流触发条件：

- 推送到`main`或`develop`分支
- 创建针对`main`或`develop`分支的Pull Request
- 手动触发

### 自动化测试类型

我们的自动化测试包括：

1. **单元测试**：测试独立组件和函数

   ```bash
   yarn test:unit
   ```

2. **集成测试**：测试组件之间的交互

   ```bash
   yarn test:integration
   ```

3. **端到端测试**：测试完整的用户流程

   ```bash
   yarn test:e2e
   ```

4. **负载测试**：使用Artillery测试API性能
   ```bash
   yarn test:load
   ```

### 覆盖率分析

我们使用Jest的覆盖率工具生成覆盖率报告，并使用自定义脚本分析低覆盖率代码：

```bash
# 运行测试并生成覆盖率报告
yarn test --coverage

# 分析低覆盖率代码
node src/utils/fixLowCoverage.js --coverage-dir=./coverage --min-coverage=80 --report
```

我们还提供了一个高级覆盖率分析工具，可以生成详细的覆盖率报告，包括趋势分析和改进建议：

```bash
# 生成基本覆盖率分析报告
node src/utils/analyzeCoverage.js --coverage-dir=./coverage --min-coverage=80

# 生成详细覆盖率分析报告，包含未覆盖代码分类和改进建议
node src/utils/analyzeCoverage.js --coverage-dir=./coverage --detailed

# 生成包含趋势分析的HTML格式报告
node src/utils/analyzeCoverage.js --trend --format=html --output=./coverage-report.html
```

该工具可以：

- 分析未覆盖代码的类型（错误处理、条件逻辑、边界情况等）
- 生成针对性的改进建议
- 跟踪覆盖率趋势变化
- 输出Markdown或HTML格式的报告

覆盖率阈值要求：

- 行覆盖率：≥80%
- 分支覆盖率：≥80%
- 函数覆盖率：≥80%

### 自动修复低覆盖率代码

我们开发了自动修复低覆盖率代码的工具，可以：

1. 分析未覆盖的代码
2. 识别未覆盖代码的类型（错误处理、条件逻辑、边界情况等）
3. 生成针对性的测试代码
4. 提供修复建议

使用方法：

```bash
# 分析低覆盖率代码并生成报告
node src/utils/fixLowCoverage.js --coverage-dir=./coverage --min-coverage=80 --report

# 自动修复低覆盖率代码
node src/utils/fixLowCoverage.js --coverage-dir=./coverage --min-coverage=80 --fix
```

## 性能监控

### Prometheus指标

我们使用`prom-client`库收集以下性能指标：

1. **API请求延迟**：各端点的响应时间
2. **请求吞吐量**：每秒请求数
3. **错误率**：按错误类型分类的错误率
4. **资源使用情况**：CPU、内存使用情况

指标端点：`/metrics`

### 性能基准测试

我们使用Artillery进行性能基准测试：

```bash
# 运行性能测试
artillery run src/tests/performance/api.load.test.yml

# 生成HTML报告
artillery report performance-report.json -o performance-report.html
```

测试场景包括：

- 健康检查
- 单笔交易分析
- 高风险交易分析
- 批量交易分析
- 大批量交易分析

### 性能警报

我们实现了性能警报系统，当性能指标超过阈值时发送通知：

- P95延迟 > 500ms
- 错误率 > 1%
- CPU使用率 > 80%

警报通过Slack和电子邮件发送。

## 测试报告自动化

### 覆盖率报告

覆盖率报告包括：

1. **总体覆盖率**：行、分支、函数覆盖率
2. **文件级覆盖率**：每个文件的覆盖率
3. **低覆盖率文件分析**：未覆盖代码的类型和修复建议

报告格式：HTML和Markdown

### 性能趋势报告

性能趋势报告包括：

1. **响应时间趋势**：P50、P95、P99响应时间
2. **吞吐量趋势**：每秒请求数
3. **错误率趋势**：按错误类型分类的错误率

报告格式：HTML和JSON

## 环境变量配置

### GitHub Actions环境变量

在GitHub仓库设置中配置以下密钥：

- `MONGODB_URI`：MongoDB连接URI
- `REDIS_HOST`：Redis主机
- `REDIS_PORT`：Redis端口
- `SLACK_WEBHOOK`：Slack Webhook URL

### 通知配置

配置通知渠道：

1. **Slack**：

   ```
   SLACK_WEBHOOK=https://hooks.slack.com/services/xxx/yyy/zzz
   SLACK_CHANNEL=ci-notifications
   ```

2. **电子邮件**：
   ```
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=ci@example.com
   EMAIL_PASS=password
   EMAIL_RECIPIENTS=team@example.com
   ```

## 本地开发测试

### 运行测试

我们提供了一个统一的测试运行脚本，可以方便地运行各种类型的测试：

```bash
# 运行所有测试
./src/tests/runTests.js

# 运行单元测试
./src/tests/runTests.js --unit

# 运行集成测试
./src/tests/runTests.js --integration

# 运行端到端测试
./src/tests/runTests.js --e2e

# 运行测试并生成覆盖率报告
./src/tests/runTests.js --coverage

# 运行测试、生成覆盖率报告并分析
./src/tests/runTests.js --coverage --analyze

# 运行测试、生成覆盖率报告、分析并自动修复低覆盖率代码
./src/tests/runTests.js --coverage --analyze --fix
```

你也可以使用传统的命令运行测试：

```bash
# 运行所有测试
yarn test

# 运行单元测试
yarn test:unit

# 运行集成测试
yarn test:integration

# 运行端到端测试
yarn test:e2e

# 运行负载测试
yarn test:load
```

### 生成测试

使用我们的智能测试生成工具：

```bash
# 为单个文件生成测试
node src/utils/generateTests.js --source=src/api/controllers/analyzeController.js

# 为整个目录生成测试
node src/utils/generateTests.js --source=src/api/controllers --output=tests/api/controllers

# 生成包含边界情况的测试
node src/utils/generateTests.js --source=src/api/controllers --edge-cases

# 生成带有模拟依赖的测试
node src/utils/generateTests.js --source=src/api/controllers --mock-deps
```

### 修复低覆盖率代码

```bash
# 分析低覆盖率代码
node src/utils/fixLowCoverage.js --coverage-dir=./coverage --min-coverage=80 --report

# 自动修复低覆盖率代码
node src/utils/fixLowCoverage.js --coverage-dir=./coverage --min-coverage=80 --fix

# 限制处理文件数量
node src/utils/fixLowCoverage.js --coverage-dir=./coverage --min-coverage=80 --fix --max-files=5
```
