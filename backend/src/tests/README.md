# ChainIntelAI 测试指南

本文档提供了有关如何运行 ChainIntelAI 后端测试的指南。

## 测试类型

ChainIntelAI 后端包含以下类型的测试：

1. **单元测试**：测试单个组件的功能
2. **集成测试**：测试多个组件之间的交互
3. **性能测试**：测试应用程序的性能和负载能力

## 运行测试

### 运行所有测试

要运行所有测试，请使用以下命令：

```bash
yarn test:all
```

在 CI 环境中运行所有测试：

```bash
yarn test:all:ci
```

### 运行特定类型的测试

#### 单元测试

```bash
yarn test:unit
```

#### 集成测试

```bash
yarn test:integration
```

#### 性能测试

```bash
yarn test:load
```

### 运行特定的测试文件

要运行特定的测试文件，可以使用以下命令：

```bash
bash scripts/run-single-test.sh <测试文件路径>
```

例如：

```bash
bash scripts/run-single-test.sh src/tests/unit/monitoring/basic-telemetry.test.ts
```

### 运行 OpenTelemetry 测试

要运行所有与 OpenTelemetry 相关的测试，可以使用以下命令：

```bash
yarn test:telemetry
```

在 CI 环境中运行 OpenTelemetry 测试：

```bash
yarn test:telemetry:ci
```

## 测试报告

测试报告将生成在 `coverage` 目录中。您可以在浏览器中打开 `coverage/lcov-report/index.html` 文件，查看详细的覆盖率报告。

## CI/CD 集成

ChainIntelAI 使用 GitHub Actions 进行 CI/CD。以下工作流程文件定义了 CI/CD 流程：

- `basic-ci.yml`：基本的 CI 工作流，只运行基本测试
- `complete-ci.yml`：完整的 CI 工作流，包括代码检查、构建、测试和部署

## 测试目录结构

```
src/tests/
├── unit/               # 单元测试
│   └── monitoring/     # 监控相关的单元测试
├── integration/        # 集成测试
│   └── monitoring/     # 监控相关的集成测试
├── performance/        # 性能测试
│   └── monitoring/     # 监控相关的性能测试
└── README.md           # 本文档
```

## 编写新测试

### 单元测试

单元测试应该放在 `src/tests/unit` 目录中，并且文件名应该以 `.test.ts` 结尾。

### 集成测试

集成测试应该放在 `src/tests/integration` 目录中，并且文件名应该以 `.test.ts` 结尾。

### 性能测试

性能测试应该放在 `src/tests/performance` 目录中，并且文件名应该以 `.test.ts` 结尾。
