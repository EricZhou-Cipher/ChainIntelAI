# ChainIntelAI API 测试

本目录包含 ChainIntelAI 项目的 API 测试文件。这些测试使用 Jest 和 Supertest 来验证 API 端点的功能正确性。

## 测试文件结构

- `transactions.test.js` - 交易 API 测试
- `addresses.test.js` - 地址 API 测试
- `alerts.test.js` - 风险警报 API 测试
- `risk.test.js` - 风险分析 API 测试
- `stats.test.js` - 统计数据 API 测试

## 运行测试

要运行所有 API 测试，请使用以下命令：

```bash
yarn test tests/api
```

要运行特定的测试文件，请使用：

```bash
yarn test tests/api/transactions.test.js
```

## 测试方法

每个测试文件使用以下方法来测试 API 端点：

1. 使用 `createServer` 和 `apiResolver` 创建一个测试服务器
2. 使用 Supertest 发送 HTTP 请求到测试服务器
3. 验证响应状态码和响应体的结构和内容

## 测试覆盖范围

这些测试覆盖了以下方面：

- 基本功能测试 - 验证 API 端点返回预期的数据结构
- 参数测试 - 验证 API 端点正确处理查询参数
- 错误处理测试 - 验证 API 端点正确处理无效输入和错误情况
- 边界条件测试 - 验证 API 端点在边界条件下的行为

## 模拟数据

测试使用模拟数据来验证 API 端点的行为。在实际环境中，API 将连接到数据库并返回真实数据。

## 添加新测试

要添加新的 API 测试，请按照以下步骤操作：

1. 创建一个新的测试文件，命名为 `<endpoint>.test.js`
2. 导入必要的依赖项（`supertest`、`createServer`、`apiResolver`）
3. 创建一个测试服务器
4. 编写测试用例，验证 API 端点的行为
5. 运行测试并确保所有测试都通过

## 最佳实践

- 每个测试应该独立且可重复
- 测试应该覆盖正常情况和错误情况
- 测试应该验证响应状态码和响应体的结构
- 使用 `beforeAll` 和 `afterAll` 来设置和清理测试环境
- 使用描述性的测试名称，清晰地表明测试的目的
