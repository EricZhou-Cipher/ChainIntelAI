# Pipeline 集成测试

本目录包含了 Pipeline 的端到端集成测试，用于验证完整的事件处理流程。

## 目录结构

```
integration/
  ├── mocks/                    # Mock工具
  │   ├── eventMocks.ts        # 事件Mock
  │   ├── profileMocks.ts      # 画像Mock
  │   ├── aiMocks.ts           # AI分析Mock
  │   └── notificationMocks.ts # 通知Mock
  ├── pipelineFlow.test.ts     # 集成测试用例
  ├── runTestReport.sh         # 测试报告生成脚本
  └── README.md                # 说明文档
```

## 测试内容

集成测试覆盖以下方面：

1. 事件处理流程

   - 事件标准化
   - 画像获取
   - 风险分析
   - 通知分发
   - 事件存档
   - 监控记录

2. 配置验证

   - 风险阈值设置
   - 通知渠道选择
   - 重试策略

3. 监控指标
   - 处理时间统计
   - 事件计数
   - 错误统计
   - 风险等级分布

## 运行测试

1. 运行所有测试：

```bash
yarn test backend/tests/integration/pipelineFlow.test.ts
```

2. 生成测试报告：

```bash
cd backend/tests/integration
chmod +x runTestReport.sh
./runTestReport.sh
```

## 测试报告内容

测试报告包含以下信息：

1. 测试执行统计

   - 总用例数
   - 通过数
   - 失败数
   - 执行时间
   - 成功率

2. 性能指标

   - 平均处理时间
   - 各阶段耗时分布
   - 总处理事件数
   - 错误数量

3. 风险分析统计

   - 风险等级分布
   - 风险因素统计

4. 通知统计
   - 各渠道通知数量
   - 通知成功率
   - 风险等级分布

## Mock 工具说明

1. eventMocks.ts

   - createTransferEvent：创建转账事件
   - createContractCallEvent：创建合约调用事件
   - EventGenerator：批量生成事件

2. profileMocks.ts

   - createProfile：创建地址画像
   - ProfileGenerator：批量生成画像

3. aiMocks.ts

   - createRiskAnalysis：创建风险分析结果
   - RiskAnalysisGenerator：批量生成分析结果

4. notificationMocks.ts
   - mockSendNotification：模拟发送通知
   - getMockedNotifications：获取已发送通知
   - getNotificationStats：获取通知统计

## 注意事项

1. 所有 Mock 数据都支持自定义参数，可根据测试需求调整
2. 测试用例中的 traceId 会自动生成并在整个流程中传递
3. 监控指标会实时记录到 Prometheus 格式的 metrics 文件
4. 通知记录会保存到 notifications.json 文件

## 调试建议

1. 使用 Jest 的--verbose 参数查看详细日志：

```bash
yarn test --verbose
```

2. 使用 Jest 的--testNamePattern 参数运行特定测试：

```bash
yarn test -t "should process transfer event"
```

3. 查看实时日志：

```bash
tail -f backend/logs/combined.log
```

## 常见问题

1. 如果测试报告生成失败，检查是否有权限执行脚本：

```bash
chmod +x runTestReport.sh
```

2. 如果 metrics.txt 或 notifications.json 不存在，确保至少运行过一次测试：

```bash
yarn test
```

3. 如果需要清理测试数据：

```bash
rm metrics.txt notifications.json
```
