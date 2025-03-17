# ChainIntel AI 开发指南

## 目录结构

```
backend/
├── abis/                    # 合约 ABI 定义
├── config/                  # 配置文件
│   ├── chains.js           # 链配置
│   └── logger.js           # 日志配置
├── docs/                    # 文档
├── tests/                   # 测试文件
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── performance/        # 性能测试
├── aiAnalysis.js           # AI 风险分析
├── db.js                   # 数据存储
├── listener.js             # 事件监听器
├── notifier.js             # 通知系统
└── replayHistoricalEvents.js # 历史事件重放
```

## 本地开发环境搭建

1. **安装依赖**

   ```bash
   yarn install
   ```

2. **配置环境变量**

   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填写必要的配置
   ```

3. **启动本地区块链**

   ```bash
   cd hardhat
   yarn hardhat node
   ```

4. **部署测试合约**

   ```bash
   yarn hardhat run scripts/deploy.js --network localhost
   ```

5. **启动监听器**
   ```bash
   node listener.js
   ```

## 开发流程

### 1. 添加新功能

1. 创建功能分支

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 编写代码和测试

   ```bash
   # 编写功能代码
   # 添加单元测试
   # 添加集成测试
   ```

3. 运行测试

   ```bash
   yarn test
   ```

4. 提交代码
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

### 2. 调试指南

1. **本地调试**

   ```bash
   # 启动调试模式
   node --inspect listener.js

   # 使用 Chrome DevTools 调试
   chrome://inspect
   ```

2. **日志调试**

   ```javascript
   import logger from "./config/logger.js";

   logger.debug("调试信息");
   logger.info("普通信息");
   logger.warn("警告信息");
   logger.error("错误信息");
   ```

3. **事件调试**
   ```javascript
   // 在 listener.js 中添加调试点
   contract.on("Transfer", async (from, to, value, event) => {
     logger.debug("收到转账事件:", { from, to, value: value.toString() });
     // ... 其他处理
   });
   ```

### 3. 测试指南

1. **运行单元测试**

   ```bash
   yarn test:unit
   ```

2. **运行集成测试**

   ```bash
   yarn test:integration
   ```

3. **运行性能测试**

   ```bash
   yarn test:performance
   ```

4. **查看测试覆盖率**
   ```bash
   yarn coverage
   ```

### 4. 事件重放

1. **准备事件数据**

   ```json
   // events.json
   {
     "events": [
       {
         "txHash": "0x...",
         "from": "0x...",
         "to": "0x...",
         "value": "1000000000000000000",
         "blockNumber": 12345678
       }
     ]
   }
   ```

2. **运行重放**
   ```bash
   node replayHistoricalEvents.js --file events.json
   ```

## 事件处理队列

### 1. 架构说明

```
监听器/回放工具 --> 事件队列(p-queue) --> 事件处理器
                                    |
                                    v
                              存储+分析+通知
```

事件处理采用队列模式,主要组件:

- **事件队列(eventsQueue.js)**

  - 基于 p-queue 实现的内存队列
  - 支持事件去重和 TTL
  - 支持并发控制(最大 10 并发)
  - 预留接口支持替换为 Kafka/RabbitMQ

- **事件处理器(eventProcessor.js)**
  - 处理队列中的事件
  - 支持失败重试(最多 3 次)
  - AI 分析失败直接标记,不重试
  - 完整的状态流转记录

### 2. 事件状态流转

```
Pending --> Processing --> Success/Failed/AI_Failed
   ^            |
   |            |
   +------------+
   (重试,最多3次)
```

### 3. 监控指标

- `event_queue_size`: 当前队列长度
- `event_process_success_count`: 处理成功事件数
- `event_process_failure_count`: 处理失败事件数
- `event_process_duration_seconds`: 处理耗时分布
- `event_duplicate_count`: 重复事件计数

### 4. 使用示例

```javascript
// 1. 添加事件到队列
import { eventsQueue } from "./queue/eventsQueue.js";
import { eventProcessor } from "./queue/eventProcessor.js";

const event = {
  chainId: 1,
  txHash: "0x...",
  from: "0x...",
  to: "0x...",
  value: "1000000000000000000",
};

await eventsQueue.addEvent(event, eventProcessor.processEvent);

// 2. 查看队列状态
const status = eventsQueue.getStatus();
console.log("当前队列状态:", status);

// 3. 暂停/恢复队列
eventsQueue.pause();
eventsQueue.resume();

// 4. 等待队列处理完成
await eventsQueue.waitForIdle();
```

### 5. 替换队列引擎

如需替换为其他队列引擎(如 Kafka),只需:

1. 创建新的队列适配器实现相同接口:

```javascript
class KafkaQueue {
  async addEvent(event, processor) {}
  getStatus() {}
  pause() {}
  resume() {}
  clear() {}
  waitForIdle() {}
}
```

2. 更新 eventsQueue.js 中的实现即可,无需修改其他代码。

### 6. 注意事项

- 队列去重窗口为 1 小时,可通过配置调整
- 处理超时时间默认 30 秒
- AI 分析失败不重试,直接标记状态
- 重试间隔递增(1 分钟、3 分钟、5 分钟)
- 所有错误都有详细日志记录

## 故障排查指南

### 1. 连接问题

- **症状**: WebSocket 连接失败

  ```
  解决方案:
  1. 检查节点地址是否正确
  2. 确认网络连接是否正常
  3. 验证 WebSocket 端口是否开放
  ```

- **症状**: 合约事件未捕获
  ```
  解决方案:
  1. 确认合约地址正确
  2. 检查 ABI 定义是否匹配
  3. 验证事件过滤器配置
  ```

### 2. 数据问题

- **症状**: 事件数据不完整

  ```
  解决方案:
  1. 检查事件解析逻辑
  2. 验证数据格式转换
  3. 确认存储操作成功
  ```

- **症状**: 重复事件
  ```
  解决方案:
  1. 检查去重逻辑
  2. 验证事件唯一性判断
  3. 清理缓存数据
  ```

### 3. 性能问题

- **症状**: 事件处理延迟

  ```
  解决方案:
  1. 检查系统资源使用
  2. 优化数据库查询
  3. 调整并发处理参数
  ```

- **症状**: 内存使用过高
  ```
  解决方案:
  1. 检查内存泄漏
  2. 优化数据缓存
  3. 调整垃圾回收
  ```

## 示例配置

### 1. 黑名单配置

```json
// blacklist.json
{
  "addresses": ["0x1234...", "0x5678..."],
  "patterns": ["0x0000*", "0xdead*"]
}
```

### 2. 白名单配置

```json
// whitelist.json
{
  "addresses": ["0xabcd...", "0xef01..."],
  "contracts": ["0x2345..."]
}
```

### 3. 事件配置

```json
// events.json
{
  "startBlock": 1000000,
  "endBlock": 2000000,
  "batchSize": 1000,
  "concurrency": 5
}
```

## 代码规范

1. **命名规范**

   - 使用驼峰命名法
   - 常量使用大写
   - 私有方法以下划线开头

2. **注释规范**

   - 每个文件顶部添加说明
   - 关键函数添加 JSDoc
   - 复杂逻辑添加行内注释

3. **错误处理**

   - 使用 try-catch 包装异步操作
   - 统一错误格式
   - 记录详细错误信息

4. **代码格式**
   - 使用 2 空格缩进
   - 行尾不留空格
   - 文件以空行结束

## 地址画像系统

### 1. 系统架构

```
事件触发 ---> 地址画像查询 ---> AI分析
                |
                +---> 画像不存在/过期 ---> 实时生成
                                          |
                                          v
                                        存储到MongoDB
```

### 2. 画像数据结构

```javascript
{
  // 基础信息
  address: "0x...",
  type: "eoa|contract",
  firstSeen: Date,
  lastSeen: Date,

  // 交互统计
  stats: {
    totalTxCount: Number,
    uniqueAddressCount: Number,
    contractInteractions: [{
      address: String,
      count: Number,
      lastInteraction: Date
    }],
    incomingTxCount: Number,
    outgoingTxCount: Number
  },

  // 资金流动
  flows: {
    last24h: {
      inflow: String,  // BigNumber
      outflow: String,
      netFlow: String
    },
    last7d: { ... },
    last30d: { ... }
  },

  // 风险特征
  riskFeatures: {
    isHoneypot: Boolean,
    hasBatchOperations: Boolean,
    blacklistAssociation: Number,
    suspiciousPatterns: [{
      type: String,
      confidence: Number,
      lastDetected: Date
    }]
  },

  // 风险评分
  riskScore: {
    total: Number,
    components: {
      flowScore: Number,
      patternScore: Number,
      associationScore: Number,
      activityScore: Number
    }
  },

  // 元数据
  metadata: {
    version: Number,
    lastUpdated: Date,
    updateCount: Number
  }
}
```

### 3. 主要组件

- **AddressProfiler**

  - 负责画像生成和查询
  - 支持实时生成和批量更新
  - 包含完整的风险评分逻辑

- **ProfileUpdater**

  - 负责定时更新过期画像
  - 默认每天凌晨 2 点运行
  - 支持手动触发更新

- **ProfileSchema**
  - MongoDB 数据模型
  - 包含索引和虚拟字段
  - 支持画像版本管理

### 4. 监控指标

- `address_profile_total`: 已生成画像总数
- `address_profile_query_count`: 画像查询次数
- `address_profile_miss_count`: 画像未命中次数
- `address_profile_update_count`: 画像更新次数
- `address_profile_score_distribution`: 风险评分分布

### 5. 使用示例

```javascript
// 1. 查询地址画像
import { addressProfiler } from "./profiling/addressProfiler.js";

const address = "0x...";
const profile = await addressProfiler.getProfile(address);

// 2. 手动触发画像更新
import { profileUpdater } from "./profiling/profileUpdater.js";

await profileUpdater.triggerUpdate();

// 3. 启动定时更新
profileUpdater.start();
```

### 6. 风险评分规则

风险评分由以下组件构成:

1. **流动评分 (30%)**

   - 24 小时流动规模
   - 7 天净流入/流出趋势
   - 大额交易频率

2. **模式评分 (30%)**

   - 批量操作行为
   - 交易时间分布
   - 交易对手多样性

3. **关联评分 (20%)**

   - 黑名单地址关联度
   - 可疑合约交互
   - 蜜罐特征检测

4. **活动评分 (20%)**
   - 账户活跃度
   - 交易频率变化
   - 合约调用复杂度

### 7. 注意事项

1. **画像更新**

   - 画像默认 24 小时过期
   - 可通过配置调整更新频率
   - 支持手动触发紧急更新

2. **性能优化**

   - 画像查询结果缓存
   - 批量更新任务分片
   - 索引优化

3. **数据一致性**

   - 版本号管理
   - 原子性更新
   - 更新记录追踪

4. **扩展性**
   - 预留合约画像接口
   - 支持自定义评分规则
   - 支持添加新的特征维度

## 通知系统

### 1. 系统架构

```
事件处理完成 ---> 通知路由器 ---> 频率控制 ---> 通知发送
                     |
                     +---> 批量操作缓存
                     |
                     +---> 紧急提醒
```

主要组件:

- **NotificationRouter**: 通知分流与策略控制
- **RateLimiter**: 通知频率控制
- **NotificationRules**: 分流策略配置

### 2. 通知规则配置

```javascript
// 风险等级对应的默认通知渠道
{
  HIGH: ["telegram", "discord", "email"],
  MEDIUM: ["telegram", "discord"],
  LOW: ["discord"]
}

// 事件类型的通知模板
{
  TRANSFER: {
    title: "资金异动通知",
    template: "..."
  },
  CONTRACT_INTERACTION: {
    title: "合约交互通知",
    template: "..."
  }
}

// 接收人配置
{
  "admin": {
    channels: {
      telegram: "@admin",
      discord: "admin#1234"
    },
    subscriptions: {
      chains: ["*"],
      riskLevels: ["HIGH", "MEDIUM"],
      eventTypes: ["*"]
    }
  }
}
```

### 3. 频率控制规则

- 高风险事件: 1 分钟最多 1 条
- 中风险事件: 5 分钟最多 3 条
- 低风险事件: 1 小时最多 5 条
- 批量操作: 5 分钟内最多合并 20 条
- 紧急提醒: 忽略频控限制

### 4. 监控指标

- `notification_total_count`: 通知总发送数
- `notification_filtered_count`: 被策略过滤数
- `notification_rate_limited_count`: 因频控丢弃数
- `notification_channel_count`: 各渠道发送数
- `notification_delivery_time_seconds`: 发送耗时分布

### 5. 使用示例

```javascript
// 1. 发送通知
import { notificationRouter } from "./notifier/notificationRouter.js";

await notificationRouter.route(event, profile, riskAnalysis);

// 2. 检查频率限制
import { rateLimiter } from "./notifier/rateLimiter.js";

const canSend = rateLimiter.canSendNotification(receiver, channel, riskLevel);

// 3. 强制发送(忽略频控)
rateLimiter.forceNotification(receiver, channel, riskLevel);
```

### 6. 扩展通知渠道

1. 在`notificationRules.js`中添加新渠道配置:

```javascript
export const channelConfig = {
  webhook: {
    type: "webhook",
    config: {
      url: "https://api.example.com/webhook",
      headers: {
        /* ... */
      },
    },
  },
};
```

2. 在`notificationRouter.js`中实现发送逻辑:

```javascript
async _sendNotification(channel, receiver, content) {
  switch (channel) {
    case "webhook":
      await this._sendWebhook(receiver, content);
      break;
  }
}
```

### 7. 注意事项

1. **配置管理**

   - 所有配置支持热更新
   - 通知模板使用统一格式
   - 接收人配置需要验证

2. **性能优化**

   - 批量操作合并发送
   - 通知队列异步处理
   - 频控缓存定期清理

3. **可靠性保证**

   - 通知发送失败重试
   - 关键操作日志记录
   - 监控指标实时更新

4. **安全考虑**
   - 敏感信息脱敏
   - 接收人身份验证
   - 通知链接有效期

## 风险分析系统

### 1. 系统架构

```
事件处理完成 --> 画像+历史数据获取 --> 规则引擎匹配+AI分析 --> 综合评分+报告生成
                                                              |
                                                              v
                                                         通知/告警
```

主要组件:

- **RiskAnalyzer**: AI+规则双引擎分析器
- **RiskRules**: 风险规则配置
- **AI Models**: AI 模型集合

### 2. 分析维度

1. **资金流动维度 (30%)**

   - 大额转账检测
   - 频繁转账检测
   - 异常模式识别

2. **地址行为维度 (30%)**

   - 合约交互分析
   - 批量操作检测
   - 地址创建监控

3. **关联风险维度 (25%)**

   - 黑名单关联度
   - 风险地址关联
   - 混币器交互

4. **历史特征维度 (15%)**
   - 账户年龄评估
   - 活动模式分析
   - 余额变化追踪

### 3. AI 能力

1. **行为序列分析**

   ```javascript
   // 使用LSTM模型分析历史行为序列
   const behaviorModel = await loadModel("./aiModels/behaviorSequenceModel");
   const anomalyScore = await behaviorModel.predict(historicalEvents);
   ```

2. **交易图谱分析**

   ```javascript
   // 使用图神经网络分析交易网络
   const graphModel = await loadModel("./aiModels/transactionGraphModel");
   const graphFeatures = await graphModel.analyze(transactionGraph);
   ```

3. **风险描述生成**
   ```javascript
   // 使用LLM生成风险分析摘要
   const textModel = await loadModel("./aiModels/textSummarizer");
   const summary = await textModel.generateSummary(analysisResults);
   ```

### 4. 监控指标

- `risk_analysis_total_count`: 分析总次数
- `risk_analysis_duration_seconds`: 分析耗时分布
- `risk_score_distribution`: 风险评分分布
- `risk_point_occurrence_count`: 风险点触发次数

### 5. 使用示例

```javascript
// 1. 分析单个事件
import { riskAnalyzer } from "./analyzer/riskAnalyzer.js";

const report = await riskAnalyzer.analyze(event, profile, historicalEvents);
console.log("风险评分:", report.riskScore);
console.log("风险等级:", report.riskLevel);
console.log("风险点:", report.riskPoints);
console.log("AI分析:", report.aiAnalysis);

// 2. 批量分析
const events = [
  /* ... */
];
const reports = await Promise.all(
  events.map((event) => riskAnalyzer.analyze(event, profile, historicalEvents))
);
```

### 6. 风险报告格式

```javascript
{
  // 基础信息
  riskScore: 85,           // 风险评分(0-100)
  riskLevel: "HIGH",       // 风险等级(HIGH/MEDIUM/LOW)
  timestamp: 1678234567,   // 分析时间戳

  // 风险点列表
  riskPoints: [{
    type: "LARGE_TRANSFER",
    description: "大额转账",
    details: {
      value: "1000000000000000000",
      threshold: "100"
    }
  }],

  // AI分析结果
  aiAnalysis: {
    behaviorAnalysis: {
      anomalyScore: 0.85,
      patterns: [/* ... */]
    },
    graphAnalysis: {
      communityScore: 0.7,
      flowPatterns: [/* ... */]
    },
    summary: "该地址展现出典型的资金清洗行为..."
  },

  // 组合规则触发
  combinations: [{
    name: "MONEY_LAUNDERING",
    weight: 1.5
  }],

  // 建议动作
  action: "立即通知并人工审核"
}
```

### 7. 规则配置

1. **风险权重**

   ```javascript
   export const riskWeights = {
     FLOW: {
       weight: 0.3,
       factors: {
         LARGE_TRANSFER: 0.4,
         FREQUENT_TRANSFER: 0.3,
         IRREGULAR_PATTERN: 0.3,
       },
     },
     // ...其他维度
   };
   ```

2. **风险阈值**

   ```javascript
   export const riskThresholds = {
     largeTransferThresholds: {
       1: "100", // ETH: 100
       56: "1000", // BSC: 1000
     },
     // ...其他阈值
   };
   ```

3. **组合规则**
   ```javascript
   export const combinationRules = [
     {
       name: "MONEY_LAUNDERING",
       conditions: [
         { tag: "LARGE_TRANSFER", count: 1 },
         { tag: "FREQUENT_TRANSFER", count: 5 },
         { tag: "MIXER", count: 1 },
       ],
       weight: 1.5,
     },
   ];
   ```

### 8. AI 模型训练

1. **行为序列模型**

   ```bash
   # 训练LSTM模型
   cd aiModels/behaviorSequenceModel
   python train.py --data ../data/historical_events.json
   ```

2. **交易图谱模型**

   ```bash
   # 训练GNN模型
   cd aiModels/transactionGraphModel
   python train.py --data ../data/transaction_graphs.json
   ```

3. **文本生成模型**
   ```bash
   # 微调LLM模型
   cd aiModels/textSummarizer
   python finetune.py --data ../data/risk_reports.json
   ```

### 9. 注意事项

1. **规则管理**

   - 所有规则支持热更新
   - 规则变更需要记录版本
   - 重要规则变更需要人工审核

2. **AI 模型**

   - 定期重新训练模型
   - 记录模型版本和性能
   - 保存训练数据和参数

3. **性能优化**

   - 缓存常用数据
   - 异步处理 AI 分析
   - 批量处理优化

4. **安全考虑**
   - 模型输入验证
   - 敏感信息保护
   - 审计日志记录
