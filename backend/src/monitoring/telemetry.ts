/**
 * OpenTelemetry 集成
 * 
 * 提供分布式追踪、指标收集和日志记录的统一接口
 * 参考文档: https://opentelemetry.io/docs/
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { logger } from '../utils/logger';
import * as api from '@opentelemetry/api';

// 服务名称和版本
const SERVICE_NAME = process.env.SERVICE_NAME || 'chainintel-backend';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';

// 创建一个 meter 提供者
const meter = api.metrics.getMeter('default');

// 导出 meter 供测试使用
export { meter };

/**
 * 初始化 OpenTelemetry SDK
 */
export function initTelemetry() {
  try {
    // 创建资源
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
      [SemanticResourceAttributes.SERVICE_VERSION]: SERVICE_VERSION,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
    });

    // 创建 Prometheus 指标导出器
    const prometheusExporter = new PrometheusExporter({
      port: parseInt(process.env.METRICS_PORT || '9464', 10),
    });

    // 创建 SDK 实例
    const sdk = new NodeSDK({
      resource,
      traceExporter: new ConsoleSpanExporter(), // 开发环境使用控制台导出器
      metricReader: prometheusExporter,
      instrumentations: [
        // 自动检测常见框架和库
        new ExpressInstrumentation(),
        new HttpInstrumentation(),
        new MongoDBInstrumentation(),
        new RedisInstrumentation()
      ]
    });

    // 启动 SDK
    sdk.start();
    logger.info('OpenTelemetry initialized successfully');

    // 优雅关闭
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => logger.info('OpenTelemetry SDK shut down'))
        .catch((err: Error) => logger.error('Error shutting down OpenTelemetry SDK', { error: err }))
        .finally(() => process.exit(0));
    });

    return sdk;
  } catch (error: any) {
    logger.error('Failed to initialize OpenTelemetry', { error: error.message });
    return null;
  }
}

/**
 * 创建自定义 Span
 * @param name Span 名称
 * @param fn 要执行的函数
 * @returns 函数执行结果
 */
export async function createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const tracer = api.trace.getTracer('default');
  
  return await tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.end();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: api.SpanStatusCode.ERROR });
      span.end();
      throw error;
    }
  });
}

/**
 * 记录自定义指标
 * @param name 指标名称
 * @param value 指标值
 * @param attributes 附加属性
 */
export function recordMetric(name: string, value: number, attributes: Record<string, string> = {}) {
  try {
    const counter = meter.createCounter(name, {
      description: `Counter for ${name}`
    });
    
    counter.add(value, attributes);
    logger.debug(`Recording metric: ${name}=${value}`, { attributes });
  } catch (error) {
    logger.error(`Failed to record metric ${name}`, { error });
  }
}

/**
 * 设置 Span 属性
 * @param key 属性键
 * @param value 属性值
 */
export function setSpanAttribute(key: string, value: string | number | boolean) {
  try {
    const currentSpan = api.trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.setAttribute(key, value);
      logger.debug(`Setting span attribute: ${key}=${value}`);
    }
  } catch (error) {
    logger.error(`Failed to set span attribute ${key}`, { error });
  }
}

/**
 * 记录 Span 事件
 * @param name 事件名称
 * @param attributes 附加属性
 */
export function recordSpanEvent(name: string, attributes: Record<string, string> = {}) {
  try {
    const currentSpan = api.trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent(name, attributes);
      logger.debug(`Recording span event: ${name}`, { attributes });
    }
  } catch (error) {
    logger.error(`Failed to record span event ${name}`, { error });
  }
}

/**
 * 获取当前 Trace ID
 * @returns 当前 Trace ID 或 undefined
 */
export function getCurrentTraceId(): string | undefined {
  try {
    const currentSpan = api.trace.getActiveSpan();
    if (currentSpan) {
      const spanContext = currentSpan.spanContext();
      return spanContext.traceId;
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to get current trace ID', { error });
    return undefined;
  }
}

/**
 * 获取当前 Span ID
 * @returns 当前 Span ID 或 undefined
 */
export function getCurrentSpanId(): string | undefined {
  try {
    const currentSpan = api.trace.getActiveSpan();
    if (currentSpan) {
      const spanContext = currentSpan.spanContext();
      return spanContext.spanId;
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to get current span ID', { error });
    return undefined;
  }
} 