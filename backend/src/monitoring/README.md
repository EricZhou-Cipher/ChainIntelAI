# OpenTelemetry 集成

本目录包含 ChainIntelAI 后端的 OpenTelemetry 集成代码，用于分布式追踪、指标收集和日志记录。

## 概述

OpenTelemetry 是一个开源的可观测性框架，提供了一套 API、库和代理来收集应用程序的遥测数据（追踪、指标和日志）。我们的集成使用 OpenTelemetry 的 Node.js SDK 来实现这些功能。

## 主要功能

- **分布式追踪**：跟踪请求在系统中的流动，识别性能瓶颈
- **指标收集**：收集应用程序性能和业务指标
- **自动检测**：自动检测常见框架和库（Express、HTTP、MongoDB、Redis）
- **Prometheus 集成**：将指标导出到 Prometheus 以便进行监控和告警

## 使用方法

### 初始化

在应用程序启动时初始化 OpenTelemetry：

```typescript
import { initTelemetry } from './monitoring/telemetry';

// 初始化 OpenTelemetry
initTelemetry();
```

### 创建自定义 Span

使用 `createSpan` 函数来创建自定义 Span：

```typescript
import { createSpan } from './monitoring/telemetry';

async function processData() {
  return await createSpan('data.processing', async () => {
    // 执行需要追踪的操作
    const result = await someAsyncOperation();
    return result;
  });
}
```

### 记录指标

使用 `recordMetric` 函数来记录自定义指标：

```typescript
import { recordMetric } from './monitoring/telemetry';

// 记录计数器指标
recordMetric('api.requests', 1, { method: 'GET', path: '/api/data' });
```

### 设置 Span 属性

使用 `setSpanAttribute` 函数来设置当前活动 Span 的属性：

```typescript
import { setSpanAttribute } from './monitoring/telemetry';

// 设置 Span 属性
setSpanAttribute('user.id', userId);
setSpanAttribute('request.priority', 1);
```

### 记录 Span 事件

使用 `recordSpanEvent` 函数来记录 Span 事件：

```typescript
import { recordSpanEvent } from './monitoring/telemetry';

// 记录事件
recordSpanEvent('cache.miss', { key: 'user:123' });
```

### 获取 Trace 和 Span ID

使用 `getCurrentTraceId` 和 `getCurrentSpanId` 函数来获取当前的 Trace ID 和 Span ID：

```typescript
import { getCurrentTraceId, getCurrentSpanId } from './monitoring/telemetry';

// 获取 ID
const traceId = getCurrentTraceId();
const spanId = getCurrentSpanId();
console.log(`Trace ID: ${traceId}, Span ID: ${spanId}`);
```

## 示例

查看 `src/examples/telemetryExample.ts` 文件，了解完整的使用示例。

## 配置

通过环境变量配置 OpenTelemetry：

- `SERVICE_NAME`：服务名称（默认：'chainintel-backend'）
- `METRICS_PORT`：Prometheus 指标导出端口（默认：9464）
- `NODE_ENV`：部署环境（默认：'development'）

## 参考资料

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/)
- [OpenTelemetry JavaScript 文档](https://opentelemetry.io/docs/instrumentation/js/)
