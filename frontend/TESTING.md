# ChainIntelAI 前端测试框架

本文档描述了 ChainIntelAI 前端应用程序的测试框架和策略。

## 测试类型

我们的测试框架包含以下几种测试类型：

1. **单元测试**：使用 Jest 测试框架测试独立组件和函数
2. **API 测试**：测试 API 路由和处理程序
3. **组件测试**：使用 Cypress 组件测试功能测试 React 组件
4. **端到端测试**：使用 Cypress 测试整个应用程序流程

## 测试目录结构

```
frontend/
├── tests/                  # Jest 测试目录
│   ├── components/         # 组件单元测试
│   ├── pages/              # 页面单元测试
│   ├── hooks/              # 自定义 Hook 测试
│   ├── utils/              # 工具函数测试
│   └── api/                # API 路由测试
├── cypress/                # Cypress 测试目录
│   ├── e2e/                # 端到端测试
│   ├── component/          # 组件测试
│   ├── fixtures/           # 测试数据
│   └── support/            # 支持文件和命令
└── jest.config.js          # Jest 配置
```

## 运行测试

### 单元测试

```bash
# 运行所有单元测试
yarn test

# 运行特定测试文件
yarn test tests/components/RiskAlerts.test.js

# 运行带有覆盖率报告的测试
yarn test --coverage
```

### API 测试

```bash
# 运行所有 API 测试
yarn test tests/api

# 运行特定 API 测试
yarn test tests/api/addresses.test.js

# 运行带有覆盖率报告的 API 测试
yarn test --coverage tests/api
```

### 端到端测试

```bash
# 打开 Cypress 测试运行器
yarn cypress

# 运行所有端到端测试（无头模式）
yarn cypress:headless

# 运行特定端到端测试
yarn cypress run --spec "cypress/e2e/api.cy.js"

# 运行端到端测试（启动开发服务器）
yarn e2e
```

### 组件测试

```bash
# 打开 Cypress 组件测试运行器
yarn cypress:component

# 运行所有组件测试（无头模式）
yarn cypress:component:headless
```

## 测试覆盖率

我们的目标是保持以下测试覆盖率：

- 单元测试：90% 以上的代码覆盖率
- API 测试：85% 以上的代码覆盖率
- 端到端测试：覆盖所有关键用户流程

覆盖率报告可以通过运行 `yarn test --coverage` 生成，报告将保存在 `coverage/` 目录中。

## 测试策略

### 单元测试策略

- 测试每个组件的渲染和基本功能
- 测试自定义 Hook 的行为
- 测试工具函数的输入和输出
- 使用模拟（mock）隔离测试单元

### API 测试策略

- 测试每个 API 路由的正常响应
- 测试错误处理和边缘情况
- 测试参数验证
- 测试数据库连接失败和外部 API 超时等异常情况

### 端到端测试策略

- 测试关键用户流程（如搜索地址、查看交易详情等）
- 测试错误处理和用户反馈
- 测试响应式设计在不同设备上的表现
- 使用模拟数据测试 API 响应

## CI/CD 集成

我们使用 GitHub Actions 自动运行测试。工作流配置文件位于 `.github/workflows/frontend-tests.yml`。

每次推送到 `main` 或 `develop` 分支，或创建针对这些分支的拉取请求时，都会触发测试工作流。

工作流包括以下任务：

1. 运行单元测试和生成覆盖率报告
2. 运行 API 测试和生成覆盖率报告
3. 运行端到端测试
4. 运行代码质量检查（ESLint 和类型检查）

## 最佳实践

1. **测试驱动开发**：先编写测试，再实现功能
2. **测试可维护性**：保持测试简单、可读和可维护
3. **测试独立性**：每个测试应该独立运行，不依赖其他测试的状态
4. **测试命名**：使用描述性的测试名称，清晰表达测试的目的
5. **测试覆盖率**：定期检查测试覆盖率，确保关键代码路径被测试
6. **测试速度**：保持测试运行速度快，特别是单元测试
7. **测试稳定性**：避免不稳定的测试，如依赖外部服务或时间的测试

## 边缘情况测试

我们特别关注以下边缘情况的测试：

1. **数据库连接失败**：测试当数据库连接失败时应用程序的行为
2. **外部 API 超时**：测试当外部 API 请求超时时的错误处理
3. **无效输入格式**：测试当用户提供无效输入时的验证和错误消息
4. **并发请求**：测试应用程序处理多个并发请求的能力
5. **极端数据值**：测试处理极大或极小数据值的能力
6. **空数据集**：测试当没有数据返回时的行为
7. **权限错误**：测试当用户没有足够权限时的行为

## 模拟策略

在测试中，我们使用以下模拟策略：

1. **API 响应模拟**：使用 Cypress 拦截器模拟 API 响应
2. **服务模拟**：使用 Jest 模拟服务和依赖
3. **用户交互模拟**：使用 Cypress 模拟用户交互
4. **时间模拟**：使用 Jest 的 `jest.useFakeTimers()` 模拟时间相关功能

# 前端组件测试指南

本文档提供了关于如何在项目中创建和运行组件测试的指南。

## 目录

- [测试环境](#测试环境)
- [测试工具](#测试工具)
- [测试脚本](#测试脚本)
- [创建测试](#创建测试)
- [运行测试](#运行测试)
- [测试规范](#测试规范)
- [常见问题](#常见问题)

## 测试环境

我们使用以下工具进行测试：

- **Jest**: JavaScript 测试框架
- **React Testing Library**: React 组件测试工具
- **User Event**: 模拟用户交互的工具

## 测试工具

我们提供了两个脚本来简化测试流程：

1. `scripts/create-test.sh`: 创建新的组件测试文件
2. `scripts/run-tests.sh`: 运行测试

## 测试脚本

### 创建测试

使用 `create-test.sh` 脚本为组件创建测试文件：

```bash
# 进入前端目录
cd frontend

# 为 SearchBar 组件创建测试
./scripts/create-test.sh -c SearchBar
```

这将在 `__tests__/components/` 目录下创建一个测试文件模板。

### 运行测试

使用 `run-tests.sh` 脚本运行测试：

```bash
# 进入前端目录
cd frontend

# 运行所有测试
./scripts/run-tests.sh -a

# 运行特定组件的测试
./scripts/run-tests.sh -c SearchBar

# 以监视模式运行测试（修改文件时自动重新运行）
./scripts/run-tests.sh -c SearchBar -w
```

## 创建测试

每个组件测试文件应包含以下几种测试：

1. **渲染测试**: 确保组件正确渲染
2. **交互测试**: 测试用户交互（点击、输入等）
3. **状态测试**: 测试组件状态变化
4. **边缘情况**: 测试异常情况

### 测试文件示例

以下是 `SearchBar` 组件测试的示例：

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../../app/components/SearchBar';
import userEvent from '@testing-library/user-event';

describe('SearchBar组件', () => {
  test('正确渲染搜索栏', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} placeholder="搜索地址或交易" />);

    // 检查输入框和按钮是否正确渲染
    const input = screen.getByPlaceholderText('搜索地址或交易');
    expect(input).toBeInTheDocument();

    // 验证搜索按钮
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('点击搜索按钮触发回调', async () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} placeholder="搜索..." />);

    // 输入搜索词
    const input = screen.getByPlaceholderText('搜索...');
    await userEvent.type(input, 'test query');

    // 点击搜索按钮
    fireEvent.click(screen.getByRole('button'));

    // 验证回调被调用，且参数正确
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith('test query');
  });

  test('搜索为空时不触发回调', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);

    // 点击搜索按钮但没有输入内容
    fireEvent.click(screen.getByRole('button'));

    // 验证回调没有被调用
    expect(handleSearch).not.toHaveBeenCalled();
  });
});
```

## 测试规范

编写测试时，请遵循以下规范：

1. **测试文件命名**: 使用 `组件名.test.js` 格式
2. **测试描述**: 使用清晰的描述说明测试内容
3. **测试隔离**: 每个测试应该独立，不依赖其他测试
4. **模拟函数**: 使用 `jest.fn()` 模拟回调函数
5. **用户交互**: 使用 `userEvent` 模拟用户交互，而不是直接使用 `fireEvent`
6. **断言**: 使用明确的断言验证结果

## 常见问题

### 找不到元素

如果测试中找不到元素，可以尝试以下方法：

1. 使用 `screen.debug()` 查看渲染的 DOM
2. 使用不同的查询方法，如 `getByText`、`getByPlaceholderText` 等
3. 检查组件是否正确渲染

### 测试失败

如果测试失败，请检查：

1. 组件实现是否正确
2. 测试代码是否正确
3. 是否有异步操作需要等待

### 异步测试

对于异步操作，请使用 `async/await` 或 `act` 确保测试正确等待操作完成：

```javascript
test('异步操作', async () => {
  // 使用 async/await
  await userEvent.type(input, 'text');

  // 或使用 act
  await act(async () => {
    // 异步操作
  });
});
```

---

如有任何问题，请联系项目负责人。
