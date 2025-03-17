# 数据库系统设计文档

## 概述

ChainIntelAI 使用 MongoDB 作为主数据库，Redis 作为缓存层，实现高性能的数据存储和访问。

## 数据库选型

1. MongoDB

   - 文档型数据库，适合存储非结构化数据
   - 支持复杂查询和聚合操作
   - 良好的扩展性和性能
   - 适合存储事件数据和地址画像

2. Redis
   - 高性能内存数据库
   - 支持多种数据结构
   - 适合缓存和实时数据
   - 支持过期时间设置

## 数据模型设计

### 1. 事件记录 (EventRecord)

```typescript
interface IEventRecord {
  traceId: string; // 追踪ID
  event: NormalizedEvent; // 规范化的事件数据
  status: string; // 处理状态
  riskAnalysis?: {
    // 风险分析结果
    score: number;
    level: string;
    factors: string[];
    timestamp: number;
  };
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}
```

### 2. 地址画像 (AddressProfile)

```typescript
interface IAddressProfile {
  address: string; // 地址
  riskScore: number; // 风险评分
  lastUpdated: Date; // 最后更新时间
  tags: string[]; // 标签
  category: string; // 分类
  transactionCount: number; // 交易数量
  totalValue: string; // 总交易价值
  firstSeen: Date; // 首次出现时间
  lastSeen: Date; // 最后出现时间
  relatedAddresses: string[]; // 关联地址
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}
```

### 3. 风险分析 (RiskAnalysis)

```typescript
interface IRiskAnalysis {
  address: string; // 地址
  analysis: EnhancedRiskAnalysis; // 风险分析结果
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}
```

## 缓存策略

### 1. 缓存键设计

- 事件记录: `event:{traceId}`
- 地址画像: `profile:{address}`
- 风险分析: `risk:{address}`

### 2. 缓存时间

- 默认缓存时间: 1小时
- 高风险地址: 30分钟
- 实时数据: 5分钟

### 3. 缓存更新策略

- 写入时更新缓存
- 删除时清除缓存
- 定期刷新高风险数据

## 索引设计

### 1. 事件记录索引

- `traceId`: 唯一索引
- `event.transactionHash`: 普通索引
- `event.from`: 普通索引
- `event.to`: 普通索引
- `createdAt`: 降序索引

### 2. 地址画像索引

- `address`: 唯一索引
- `riskScore`: 普通索引
- `category`: 普通索引
- `tags`: 多键索引
- `lastUpdated`: 降序索引

### 3. 风险分析索引

- `address`: 唯一索引
- `analysis.score`: 普通索引
- `analysis.level`: 普通索引
- `createdAt`: 降序索引

## 性能优化

### 1. 数据库优化

- 使用连接池
- 定期清理过期数据
- 分片存储大量数据
- 使用复合索引优化查询

### 2. 缓存优化

- 热点数据预加载
- 批量缓存更新
- 缓存穿透防护
- 缓存雪崩防护

## 部署要求

### 1. MongoDB

- 版本: 6.0+
- 内存: 8GB+
- 磁盘: SSD
- 副本集: 3节点

### 2. Redis

- 版本: 7.0+
- 内存: 4GB+
- 持久化: RDB+AOF
- 集群: 主从模式

## 监控指标

### 1. MongoDB

- 连接数
- 查询性能
- 写入性能
- 磁盘使用率
- 内存使用率

### 2. Redis

- 命中率
- 内存使用率
- 连接数
- 命令执行时间
- 持久化状态

## 备份策略

### 1. MongoDB

- 每日全量备份
- 每小时增量备份
- 异地容灾备份
- 定期恢复测试

### 2. Redis

- 每日RDB备份
- 实时AOF同步
- 主从复制
- 定期数据校验
