# ChainIntelAI 测试文档

本文档提供了关于如何运行和维护 ChainIntelAI 后端测试的详细说明。

## 测试类型

我们的测试框架包含以下几种类型的测试：

1. **单元测试**：测试单个函数和组件
2. **集成测试**：测试多个组件之间的交互
3. **端到端测试**：测试完整的API流程
4. **性能测试**：测试API在负载下的表现

## 运行测试

### 单元测试和集成测试

运行所有测试：

```bash
yarn test
```

运行特定测试文件：

```bash
yarn test src/tests/path/to/test.ts
```

带覆盖率报告运行测试：

```bash
yarn test --coverage
```

### 端到端测试

端到端测试需要启动MongoDB和Redis服务。可以使用Docker Compose来运行：

```bash
# 使用Docker Compose运行测试
docker-compose -f docker-compose.test.yml up
```

或者手动运行：

```bash
# 确保MongoDB和Redis已启动
yarn test:e2e
```

### 性能测试

我们使用Artillery进行API负载测试。运行负载测试：

```bash
# 在本地环境运行
./scripts/run-load-tests.sh local

# 在开发环境运行
./scripts/run-load-tests.sh dev

# 在预发布环境运行
./scripts/run-load-tests.sh staging

# 在生产环境运行
./scripts/run-load-tests.sh prod
```

测试结果将保存在`load-test-results`目录中，包括JSON和HTML格式的报告。

## 测试结构

```
src/tests/
├── analyzer/           # 分析器测试
├── database/           # 数据库层测试
├── integration/        # 集成测试
│   └── api.e2e.test.ts # API端到端测试
├── models/             # 数据模型测试
├── performance/        # 性能测试
│   ├── api.load.test.yml    # Artillery负载测试配置
│   └── api.load.processor.js # 负载测试数据生成器
├── pipeline/           # 事件处理管道测试
├── rules/              # 风险规则测试
└── utils/              # 测试工具和模拟对象
    └── mockDatabase.ts # 数据库模拟工具
```

## 编写测试

### 单元测试

使用Jest进行单元测试。每个测试文件应该与被测试的源文件位于相同的目录结构中。

```typescript
import { functionToTest } from '../../path/to/source';

describe('functionToTest', () => {
  it('should do something specific', () => {
    // 准备
    const input = {...};

    // 执行
    const result = functionToTest(input);

    // 断言
    expect(result).toEqual(expectedOutput);
  });
});
```

### 集成测试

集成测试应该使用`mockDatabase.ts`中提供的模拟函数来模拟数据库交互。

```typescript
import { mockMongoDB, mockRedis } from '../utils/mockDatabase';

describe('Integration Test', () => {
  // 设置模拟
  const mockMongo = mockMongoDB();
  const mockRedisClient = mockRedis();

  beforeEach(() => {
    // 重置模拟
    jest.clearAllMocks();
  });

  it('should integrate components correctly', async () => {
    // 测试代码
  });
});
```

### 端到端测试

端到端测试使用`supertest`库来测试API端点。

```typescript
import request from 'supertest';
import { app } from '../../api/server';

describe('API Endpoints', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
```

### 性能测试

性能测试使用Artillery配置文件和处理器。要添加新的测试场景，请编辑`api.load.test.yml`文件。

## CI/CD集成

我们的测试已集成到GitHub Actions工作流程中。每次推送和拉取请求都会触发测试运行。

查看`.github/workflows/test.yml`文件了解详情。

## 测试覆盖率

我们的目标是保持至少90%的测试覆盖率。覆盖率报告会在运行`yarn test --coverage`后生成，并可在`coverage/`目录中找到。

## 故障排除

如果测试失败，请检查以下几点：

1. MongoDB和Redis服务是否正在运行
2. 环境变量是否正确设置
3. 依赖项是否已安装
4. 测试数据是否正确设置

如有其他问题，请参考错误日志或联系开发团队。
