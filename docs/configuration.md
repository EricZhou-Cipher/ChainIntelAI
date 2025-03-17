# ChainIntelAI 配置指南

本文档详细说明了 ChainIntelAI 系统的配置选项和方法。系统支持通过环境变量和配置文件进行配置，以适应不同的部署环境和使用场景。

## 配置方法

ChainIntelAI 支持以下配置方法，按优先级从高到低排序：

1. 环境变量
2. `.env` 文件
3. 配置文件 (`config/*.json`)
4. 默认配置

## 环境变量

### 核心配置

| 环境变量    | 描述         | 默认值        | 示例                     |
| ----------- | ------------ | ------------- | ------------------------ |
| `NODE_ENV`  | 运行环境     | `development` | `production`, `test`     |
| `PORT`      | API 服务端口 | `3000`        | `8080`                   |
| `LOG_LEVEL` | 日志级别     | `info`        | `debug`, `warn`, `error` |
| `API_KEY`   | API 访问密钥 | -             | `your-secret-key`        |

### 数据库配置

| 环境变量       | 描述               | 默认值                                   | 示例                                                       |
| -------------- | ------------------ | ---------------------------------------- | ---------------------------------------------------------- |
| `MONGODB_URI`  | MongoDB 连接 URI   | `mongodb://localhost:27017/chainintelai` | `mongodb+srv://user:pass@cluster.mongodb.net/chainintelai` |
| `REDIS_URL`    | Redis 连接 URL     | `redis://localhost:6379`                 | `redis://user:pass@redis.example.com:6379`                 |
| `DB_POOL_SIZE` | 数据库连接池大小   | `10`                                     | `20`                                                       |
| `CACHE_TTL`    | 缓存过期时间（秒） | `3600`                                   | `7200`                                                     |

### 区块链节点配置

| 环境变量           | 描述               | 默认值 | 示例                                        |
| ------------------ | ------------------ | ------ | ------------------------------------------- |
| `ETH_RPC_URL`      | 以太坊 RPC URL     | -      | `https://mainnet.infura.io/v3/your-api-key` |
| `BSC_RPC_URL`      | 币安智能链 RPC URL | -      | `https://bsc-dataseed.binance.org/`         |
| `POLYGON_RPC_URL`  | Polygon RPC URL    | -      | `https://polygon-rpc.com/`                  |
| `ARBITRUM_RPC_URL` | Arbitrum RPC URL   | -      | `https://arb1.arbitrum.io/rpc`              |
| `OPTIMISM_RPC_URL` | Optimism RPC URL   | -      | `https://mainnet.optimism.io`               |

### 通知配置

| 环境变量               | 描述              | 默认值    | 示例                                                    |
| ---------------------- | ----------------- | --------- | ------------------------------------------------------- |
| `SLACK_WEBHOOK_URL`    | Slack Webhook URL | -         | `https://hooks.slack.com/services/xxx/yyy/zzz`          |
| `SLACK_CHANNEL`        | Slack 频道名称    | `#alerts` | `#risk-alerts`                                          |
| `FEISHU_WEBHOOK_URL`   | 飞书 Webhook URL  | -         | `https://open.feishu.cn/open-apis/bot/v2/hook/xxx`      |
| `DINGTALK_WEBHOOK_URL` | 钉钉 Webhook URL  | -         | `https://oapi.dingtalk.com/robot/send?access_token=xxx` |
| `NOTIFICATION_LEVEL`   | 通知级别阈值      | `high`    | `medium`, `low`, `all`                                  |

### 风险分析配置

| 环境变量                | 描述             | 默认值                    | 示例                            |
| ----------------------- | ---------------- | ------------------------- | ------------------------------- |
| `RISK_THRESHOLD_HIGH`   | 高风险阈值       | `0.8`                     | `0.75`                          |
| `RISK_THRESHOLD_MEDIUM` | 中风险阈值       | `0.5`                     | `0.6`                           |
| `RISK_THRESHOLD_LOW`    | 低风险阈值       | `0.3`                     | `0.4`                           |
| `ML_MODEL_PATH`         | 机器学习模型路径 | `./models/risk-model.pkl` | `/opt/models/risk-model-v2.pkl` |

### 管道配置

| 环境变量               | 描述             | 默认值  | 示例    |
| ---------------------- | ---------------- | ------- | ------- |
| `PIPELINE_BATCH_SIZE`  | 批处理大小       | `100`   | `200`   |
| `PIPELINE_CONCURRENCY` | 并发处理数       | `5`     | `10`    |
| `PIPELINE_RETRY_COUNT` | 重试次数         | `3`     | `5`     |
| `PIPELINE_TIMEOUT_MS`  | 超时时间（毫秒） | `30000` | `60000` |

## 配置文件

除了环境变量，ChainIntelAI 还支持通过 JSON 配置文件进行配置。配置文件位于 `config/` 目录下，按环境命名：

- `config/default.json`: 默认配置
- `config/development.json`: 开发环境配置
- `config/production.json`: 生产环境配置
- `config/test.json`: 测试环境配置

### 配置文件示例

```json
{
  "server": {
    "port": 3000,
    "logLevel": "info"
  },
  "database": {
    "mongodb": {
      "uri": "mongodb://localhost:27017/chainintelai",
      "poolSize": 10
    },
    "redis": {
      "url": "redis://localhost:6379",
      "ttl": 3600
    }
  },
  "blockchain": {
    "ethereum": {
      "rpcUrl": "https://mainnet.infura.io/v3/your-api-key",
      "wsUrl": "wss://mainnet.infura.io/ws/v3/your-api-key",
      "confirmations": 12
    },
    "bsc": {
      "rpcUrl": "https://bsc-dataseed.binance.org/",
      "wsUrl": "wss://bsc-ws-node.nariox.org:443",
      "confirmations": 15
    }
  },
  "notification": {
    "slack": {
      "webhookUrl": "https://hooks.slack.com/services/xxx/yyy/zzz",
      "channel": "#alerts"
    },
    "feishu": {
      "webhookUrl": "https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
    },
    "dingtalk": {
      "webhookUrl": "https://oapi.dingtalk.com/robot/send?access_token=xxx"
    },
    "level": "high"
  },
  "riskAnalysis": {
    "thresholds": {
      "high": 0.8,
      "medium": 0.5,
      "low": 0.3
    },
    "modelPath": "./models/risk-model.pkl"
  },
  "pipeline": {
    "batchSize": 100,
    "concurrency": 5,
    "retryCount": 3,
    "timeoutMs": 30000
  }
}
```

## 高级配置

### 多链配置

ChainIntelAI 支持监控多个区块链网络。可以通过 `config/chains.json` 文件配置支持的链：

```json
{
  "chains": [
    {
      "id": "1",
      "name": "Ethereum Mainnet",
      "rpcUrl": "https://mainnet.infura.io/v3/your-api-key",
      "wsUrl": "wss://mainnet.infura.io/ws/v3/your-api-key",
      "confirmations": 12,
      "enabled": true
    },
    {
      "id": "56",
      "name": "Binance Smart Chain",
      "rpcUrl": "https://bsc-dataseed.binance.org/",
      "wsUrl": "wss://bsc-ws-node.nariox.org:443",
      "confirmations": 15,
      "enabled": true
    },
    {
      "id": "137",
      "name": "Polygon",
      "rpcUrl": "https://polygon-rpc.com/",
      "wsUrl": "wss://polygon-ws.nariox.org:443",
      "confirmations": 128,
      "enabled": true
    }
  ]
}
```

### 风险规则配置

风险分析规则可以通过 `config/risk-rules.json` 文件配置：

```json
{
  "rules": [
    {
      "id": "large-transfer",
      "name": "Large Transfer Detection",
      "description": "Detects unusually large transfers",
      "type": "threshold",
      "params": {
        "threshold": "100",
        "unit": "ETH"
      },
      "risk": 0.7,
      "enabled": true
    },
    {
      "id": "tornado-cash",
      "name": "Tornado Cash Interaction",
      "description": "Detects interactions with Tornado Cash contracts",
      "type": "address-list",
      "params": {
        "addresses": [
          "0x722122dF12D4e14e13Ac3b6895a86e84145b6967",
          "0xDD4c48C0B24039969fC16D1cdF626eaB821d3384"
        ]
      },
      "risk": 0.9,
      "enabled": true
    }
  ]
}
```

### 通知模板配置

通知模板可以通过 `config/notification-templates.json` 文件配置：

```json
{
  "templates": {
    "high-risk-alert": {
      "title": "🚨 高风险交易警报",
      "body": "检测到高风险交易：\n- 交易哈希: {{hash}}\n- 风险分数: {{riskScore}}\n- 风险类型: {{riskType}}\n- 发送方: {{from}}\n- 接收方: {{to}}\n- 金额: {{value}} {{symbol}}"
    },
    "medium-risk-alert": {
      "title": "⚠️ 中风险交易警报",
      "body": "检测到中风险交易：\n- 交易哈希: {{hash}}\n- 风险分数: {{riskScore}}\n- 风险类型: {{riskType}}\n- 发送方: {{from}}\n- 接收方: {{to}}\n- 金额: {{value}} {{symbol}}"
    }
  }
}
```

## 环境特定配置

### 开发环境

开发环境通常使用本地数据库和模拟服务：

```bash
# .env.development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
MONGODB_URI=mongodb://localhost:27017/chainintelai-dev
REDIS_URL=redis://localhost:6379
ETH_RPC_URL=http://localhost:8545  # 本地 Ganache 或 Hardhat
```

### 测试环境

测试环境通常使用独立的测试数据库：

```bash
# .env.test
NODE_ENV=test
PORT=3001
LOG_LEVEL=info
MONGODB_URI=mongodb://localhost:27017/chainintelai-test
REDIS_URL=redis://localhost:6379
# 使用模拟的区块链节点
```

### 生产环境

生产环境需要更严格的安全配置：

```bash
# .env.production
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chainintelai
REDIS_URL=redis://user:pass@redis.example.com:6379
ETH_RPC_URL=https://mainnet.infura.io/v3/your-api-key
BSC_RPC_URL=https://bsc-dataseed.binance.org/
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

## 配置验证

ChainIntelAI 在启动时会验证配置的有效性。如果发现无效配置，系统将记录错误并可能拒绝启动。

验证包括：

- 必需配置项检查
- 类型验证
- 值范围验证
- 连接测试

## 配置热重载

在开发环境中，ChainIntelAI 支持配置热重载。当 `.env` 文件或配置文件发生变化时，系统会自动重新加载配置，无需重启服务。

要启用配置热重载，请设置：

```bash
ENABLE_CONFIG_RELOAD=true
```

## 配置加密

敏感配置（如 API 密钥）可以使用环境变量加密功能进行保护：

```bash
# 加密配置
ENCRYPT_CONFIG=true
ENCRYPTION_KEY=your-encryption-key
```

## 故障排除

### 配置问题诊断

如果遇到配置相关问题，可以启用配置调试模式：

```bash
DEBUG_CONFIG=true
```

这将在启动时打印完整的配置（敏感信息会被遮蔽）。

### 常见问题

1. **数据库连接失败**

   - 检查 MongoDB/Redis 连接 URL 是否正确
   - 确认数据库服务是否运行
   - 验证网络连接和防火墙设置

2. **区块链节点连接问题**

   - 验证 RPC URL 是否有效
   - 检查 API 密钥是否正确
   - 确认节点服务是否可用

3. **通知发送失败**
   - 验证 Webhook URL 是否正确
   - 检查网络连接
   - 确认通知服务的 API 限制
