# ChainIntelAI API 文档

ChainIntelAI 提供了一组 RESTful API，用于与系统交互、查询数据和管理配置。本文档详细说明了可用的 API 端点、请求参数和响应格式。

## API 概述

- 基础 URL: `http://localhost:3000/api/v1` (开发环境)
- 认证: API 密钥 (通过 `X-API-Key` 请求头传递)
- 响应格式: JSON

## 认证

除了公开端点外，所有 API 请求都需要通过 `X-API-Key` 请求头进行认证：

```
X-API-Key: your-api-key
```

API 密钥可以在系统配置中设置。

## 通用响应格式

所有 API 响应都遵循以下格式：

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

错误响应：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## API 端点

### 健康检查

#### GET /health

检查 API 服务的健康状态。

**请求参数**: 无

**响应**:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "uptime": 3600
  },
  "error": null
}
```

### 交易分析

#### POST /transactions/analyze

分析单个交易的风险。

**请求体**:

```json
{
  "chainId": "1",
  "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "chainId": "1",
      "from": "0xabcdef1234567890abcdef1234567890abcdef12",
      "to": "0x7890abcdef1234567890abcdef1234567890abcd",
      "value": "1.5",
      "timestamp": 1634567890
    },
    "risk": {
      "score": 0.75,
      "level": "medium",
      "factors": [
        {
          "type": "large-transfer",
          "description": "Unusually large transfer amount",
          "score": 0.6
        },
        {
          "type": "new-address",
          "description": "Recipient is a newly created address",
          "score": 0.4
        }
      ]
    }
  },
  "error": null
}
```

#### GET /transactions/:hash

获取交易详情和风险分析结果。

**路径参数**:

- `hash`: 交易哈希

**查询参数**:

- `chainId`: 区块链 ID (可选，默认为 "1")

**响应**:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "chainId": "1",
      "blockNumber": 12345678,
      "from": "0xabcdef1234567890abcdef1234567890abcdef12",
      "to": "0x7890abcdef1234567890abcdef1234567890abcd",
      "value": "1.5",
      "gasUsed": 21000,
      "gasPrice": "50",
      "input": "0x",
      "timestamp": 1634567890
    },
    "risk": {
      "score": 0.75,
      "level": "medium",
      "factors": [
        {
          "type": "large-transfer",
          "description": "Unusually large transfer amount",
          "score": 0.6
        },
        {
          "type": "new-address",
          "description": "Recipient is a newly created address",
          "score": 0.4
        }
      ]
    },
    "normalized": {
      "type": "transfer",
      "method": null,
      "params": null,
      "value": "1.5",
      "symbol": "ETH"
    }
  },
  "error": null
}
```

### 地址分析

#### GET /addresses/:address

获取地址的详细信息和风险分析。

**路径参数**:

- `address`: 区块链地址

**查询参数**:

- `chainId`: 区块链 ID (可选，默认为 "1")

**响应**:

```json
{
  "success": true,
  "data": {
    "address": "0xabcdef1234567890abcdef1234567890abcdef12",
    "chainId": "1",
    "profile": {
      "firstSeen": 1634567890,
      "lastSeen": 1634657890,
      "transactionCount": 42,
      "balance": "10.5",
      "tags": ["exchange", "high-volume"]
    },
    "risk": {
      "score": 0.2,
      "level": "low",
      "factors": [
        {
          "type": "known-exchange",
          "description": "Address belongs to a known exchange",
          "score": 0.1
        }
      ]
    },
    "relatedAddresses": [
      {
        "address": "0x7890abcdef1234567890abcdef1234567890abcd",
        "transactionCount": 15,
        "lastInteraction": 1634657890
      }
    ]
  },
  "error": null
}
```

#### GET /addresses/:address/transactions

获取地址的交易历史。

**路径参数**:

- `address`: 区块链地址

**查询参数**:

- `chainId`: 区块链 ID (可选，默认为 "1")
- `limit`: 返回结果数量限制 (可选，默认为 20)
- `offset`: 分页偏移量 (可选，默认为 0)
- `sort`: 排序方式 (可选，默认为 "desc")

**响应**:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "chainId": "1",
        "blockNumber": 12345678,
        "from": "0xabcdef1234567890abcdef1234567890abcdef12",
        "to": "0x7890abcdef1234567890abcdef1234567890abcd",
        "value": "1.5",
        "timestamp": 1634567890,
        "risk": {
          "score": 0.75,
          "level": "medium"
        }
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "error": null
}
```

### 风险监控

#### GET /alerts

获取风险告警列表。

**查询参数**:

- `level`: 风险级别过滤 (可选，"high", "medium", "low")
- `chainId`: 区块链 ID (可选)
- `from`: 开始时间戳 (可选)
- `to`: 结束时间戳 (可选)
- `limit`: 返回结果数量限制 (可选，默认为 20)
- `offset`: 分页偏移量 (可选，默认为 0)

**响应**:

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-123456",
        "timestamp": 1634567890,
        "level": "high",
        "type": "large-transfer",
        "description": "Unusually large transfer detected",
        "transaction": {
          "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          "chainId": "1",
          "from": "0xabcdef1234567890abcdef1234567890abcdef12",
          "to": "0x7890abcdef1234567890abcdef1234567890abcd",
          "value": "100.0"
        },
        "riskScore": 0.9,
        "status": "open"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  },
  "error": null
}
```

#### PUT /alerts/:id/status

更新告警状态。

**路径参数**:

- `id`: 告警 ID

**请求体**:

```json
{
  "status": "resolved",
  "comment": "False positive, known transfer pattern"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "alert-123456",
    "status": "resolved",
    "updatedAt": 1634567990
  },
  "error": null
}
```

### 配置管理

#### GET /config

获取当前系统配置。

**响应**:

```json
{
  "success": true,
  "data": {
    "pipeline": {
      "batchSize": 100,
      "concurrency": 5
    },
    "notification": {
      "channels": ["slack", "feishu"],
      "level": "high"
    },
    "riskAnalysis": {
      "thresholds": {
        "high": 0.8,
        "medium": 0.5,
        "low": 0.3
      }
    }
  },
  "error": null
}
```

#### PUT /config

更新系统配置。

**请求体**:

```json
{
  "notification": {
    "level": "medium"
  },
  "riskAnalysis": {
    "thresholds": {
      "high": 0.75
    }
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "updated": ["notification.level", "riskAnalysis.thresholds.high"],
    "timestamp": 1634567990
  },
  "error": null
}
```

### 风险规则管理

#### GET /rules

获取风险规则列表。

**查询参数**:

- `enabled`: 过滤启用/禁用规则 (可选，true/false)

**响应**:

```json
{
  "success": true,
  "data": {
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
  },
  "error": null
}
```

#### POST /rules

创建新的风险规则。

**请求体**:

```json
{
  "id": "flash-loan",
  "name": "Flash Loan Detection",
  "description": "Detects flash loan transactions",
  "type": "pattern",
  "params": {
    "pattern": "flash loan",
    "caseSensitive": false
  },
  "risk": 0.6,
  "enabled": true
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "flash-loan",
    "created": true,
    "timestamp": 1634567990
  },
  "error": null
}
```

#### PUT /rules/:id

更新风险规则。

**路径参数**:

- `id`: 规则 ID

**请求体**:

```json
{
  "risk": 0.8,
  "params": {
    "pattern": "flash loan|flashloan",
    "caseSensitive": false
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "flash-loan",
    "updated": ["risk", "params"],
    "timestamp": 1634567990
  },
  "error": null
}
```

#### DELETE /rules/:id

删除风险规则。

**路径参数**:

- `id`: 规则 ID

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "flash-loan",
    "deleted": true,
    "timestamp": 1634567990
  },
  "error": null
}
```

### 统计数据

#### GET /stats/overview

获取系统概览统计数据。

**查询参数**:

- `period`: 统计周期 (可选，"day", "week", "month"，默认为 "day")

**响应**:

```json
{
  "success": true,
  "data": {
    "period": "day",
    "timestamp": 1634567990,
    "transactions": {
      "total": 15420,
      "analyzed": 15420,
      "byRisk": {
        "high": 42,
        "medium": 156,
        "low": 15222
      }
    },
    "alerts": {
      "total": 198,
      "byLevel": {
        "high": 42,
        "medium": 156,
        "low": 0
      },
      "byStatus": {
        "open": 180,
        "resolved": 15,
        "falsePositive": 3
      }
    },
    "performance": {
      "avgProcessingTime": 0.25,
      "maxProcessingTime": 1.2,
      "throughput": 178
    }
  },
  "error": null
}
```

#### GET /stats/risk-distribution

获取风险分布统计数据。

**查询参数**:

- `chainId`: 区块链 ID (可选)
- `period`: 统计周期 (可选，"day", "week", "month"，默认为 "day")

**响应**:

```json
{
  "success": true,
  "data": {
    "period": "day",
    "timestamp": 1634567990,
    "distribution": [
      {
        "score": "0.0-0.1",
        "count": 12500
      },
      {
        "score": "0.1-0.2",
        "count": 2000
      },
      {
        "score": "0.2-0.3",
        "count": 500
      },
      {
        "score": "0.3-0.4",
        "count": 200
      },
      {
        "score": "0.4-0.5",
        "count": 100
      },
      {
        "score": "0.5-0.6",
        "count": 70
      },
      {
        "score": "0.6-0.7",
        "count": 30
      },
      {
        "score": "0.7-0.8",
        "count": 15
      },
      {
        "score": "0.8-0.9",
        "count": 4
      },
      {
        "score": "0.9-1.0",
        "count": 1
      }
    ]
  },
  "error": null
}
```

## 错误代码

| 错误代码             | 描述                           |
| -------------------- | ------------------------------ |
| `UNAUTHORIZED`       | 未授权访问，API 密钥无效或缺失 |
| `INVALID_REQUEST`    | 请求参数无效                   |
| `RESOURCE_NOT_FOUND` | 请求的资源不存在               |
| `INTERNAL_ERROR`     | 服务器内部错误                 |
| `RATE_LIMITED`       | 请求频率超过限制               |
| `VALIDATION_ERROR`   | 数据验证错误                   |
| `BLOCKCHAIN_ERROR`   | 区块链节点连接或查询错误       |
| `DATABASE_ERROR`     | 数据库操作错误                 |

## 速率限制

API 请求受到速率限制，以防止滥用。限制如下：

- 认证请求: 100 请求/分钟
- 未认证请求: 10 请求/分钟

超过限制时，API 将返回 `429 Too Many Requests` 状态码和 `RATE_LIMITED` 错误。

## Webhook 通知

除了 API 查询外，ChainIntelAI 还支持通过 Webhook 推送风险告警。要配置 Webhook，请使用以下 API：

#### POST /webhooks

注册新的 Webhook。

**请求体**:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["high-risk-alert", "medium-risk-alert"],
  "secret": "your-webhook-secret"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "webhook-123456",
    "created": true,
    "timestamp": 1634567990
  },
  "error": null
}
```

Webhook 请求格式：

```json
{
  "event": "high-risk-alert",
  "timestamp": 1634567990,
  "data": {
    "alert": {
      "id": "alert-123456",
      "level": "high",
      "type": "large-transfer",
      "description": "Unusually large transfer detected",
      "transaction": {
        "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "chainId": "1",
        "from": "0xabcdef1234567890abcdef1234567890abcdef12",
        "to": "0x7890abcdef1234567890abcdef1234567890abcd",
        "value": "100.0"
      },
      "riskScore": 0.9
    }
  },
  "signature": "sha256=..."
}
```

Webhook 请求包含 `X-ChainIntelAI-Signature` 请求头，用于验证请求的真实性。
