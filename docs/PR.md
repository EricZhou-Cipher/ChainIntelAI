# feat: 画像服务增强+监控指标补充+日志格式优化

## 变更说明

### 画像服务增强

- 添加自动重试机制（支持 3 次重试，指数退避）
- 添加查询结果缓存（TTL 3600 秒，支持批量预加载）
- 优化超时配置（从 5 秒延长到 15 秒，支持配置化）
- 添加批量查询支持（可配置批次大小）

### 监控指标补充

- 画像加载耗时（Histogram）
  - 指标名：`chainintel_profile_latency_seconds`
  - 分桶：[0.1, 0.5, 1, 2, 5]
- 缓存命中率（Gauge）
  - 指标名：`chainintel_profile_cache_hit_ratio`
  - 自动计算：hits / (hits + misses)
- AI 分析耗时（Histogram）
  - 指标名：`chainintel_ai_analysis_latency_seconds`
  - 分桶同上

### 日志格式优化

- 统一日志格式为 JSON
- 添加 traceId 字段
- 优化日志级别使用
- 补充关键操作元数据

## 影响范围

### 代码修改

- `profiling/addressProfiler.ts`
- `monitoring/pipelineMonitor.ts`
- `utils/logger.ts`
- `types/config.ts`
- `types/profile.ts`

### 配置变更

- 新增环境变量：
  ```env
  PROFILE_CACHE_TTL=3600
  PROFILE_FETCH_TIMEOUT=15000
  PROFILE_FETCH_RETRIES=3
  PROFILE_MIN_RETRY_DELAY=1000
  PROFILE_MAX_RETRY_DELAY=5000
  PROFILE_BATCH_SIZE=10
  ```

### 依赖更新

- 新增依赖：
  - `ioredis`
  - `ts-retry-promise`
  - `winston`
  - `prom-client`

## 如何回归

1. 画像服务功能

```bash
# 运行单元测试
yarn test backend/tests/unit/profiling/addressProfiler.test.ts

# 检查画像查询
curl http://localhost:3000/api/profile/0x123
```

2. 监控指标

```bash
# 查看所有指标
curl http://localhost:3000/metrics | grep chainintel_profile

# 检查Grafana面板
open http://localhost:3000/grafana/d/chain-intel/profile-service
```

3. 日志格式

```bash
# 检查日志格式
tail -f /var/log/chainintel/combined.log
```

## 如何监控

### 关键指标

1. 画像加载耗时

   - 指标：`chainintel_profile_latency_seconds`
   - 告警：P95 > 2s

2. 缓存命中率

   - 指标：`chainintel_profile_cache_hit_ratio`
   - 告警：< 50%

3. 错误率
   - 指标：`chainintel_error_total{type="profile"}`
   - 告警：错误率 > 5%

### Grafana 面板

- 画像服务面板：包含耗时分布、缓存命中率、错误统计
- 已配置相应告警规则

## 关键配置项

### 画像服务配置

```env
# 缓存配置
PROFILE_CACHE_TTL=3600        # 缓存过期时间（秒）
PROFILE_BATCH_SIZE=10         # 批量查询大小

# 重试配置
PROFILE_FETCH_TIMEOUT=15000   # 查询超时时间（毫秒）
PROFILE_FETCH_RETRIES=3       # 重试次数
PROFILE_MIN_RETRY_DELAY=1000  # 最小重试延迟（毫秒）
PROFILE_MAX_RETRY_DELAY=5000  # 最大重试延迟（毫秒）
```

### 监控配置

```env
METRICS_PREFIX=chainintel
METRICS_BUCKETS=[0.1,0.5,1,2,5]
```

### 日志配置

```env
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TIMESTAMP_FORMAT=YYYY-MM-DD HH:mm:ss.SSS
```
