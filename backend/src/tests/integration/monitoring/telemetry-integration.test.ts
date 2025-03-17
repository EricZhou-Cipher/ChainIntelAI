/**
 * OpenTelemetry 集成测试
 * 
 * 测试 OpenTelemetry 与 Express 应用程序的集成
 */

import express from 'express';
import request from 'supertest';
import { initTelemetry } from '../../../monitoring/telemetry';
import * as api from '@opentelemetry/api';

// 模拟 OpenTelemetry API
jest.mock('@opentelemetry/api', () => {
  const mockSpan = {
    setAttribute: jest.fn(),
    addEvent: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
    spanContext: jest.fn().mockReturnValue({
      traceId: 'test-trace-id',
      spanId: 'test-span-id'
    })
  };
  
  const mockTracer = {
    startActiveSpan: jest.fn((name, fn) => fn(mockSpan)),
    startSpan: jest.fn().mockReturnValue(mockSpan)
  };
  
  return {
    trace: {
      getTracer: jest.fn().mockReturnValue(mockTracer),
      getActiveSpan: jest.fn().mockReturnValue(mockSpan),
      setSpan: jest.fn(),
      SpanStatusCode: {
        ERROR: 'ERROR'
      }
    },
    context: {
      active: jest.fn(),
      bind: jest.fn(fn => fn)
    },
    metrics: {
      getMeter: jest.fn().mockReturnValue({
        createCounter: jest.fn().mockReturnValue({
          add: jest.fn()
        })
      })
    },
    SpanStatusCode: {
      ERROR: 'ERROR'
    }
  };
});

// 模拟 SDK 依赖
jest.mock('@opentelemetry/sdk-node', () => {
  return {
    NodeSDK: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        shutdown: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

jest.mock('@opentelemetry/sdk-trace-node', () => {
  return {
    ConsoleSpanExporter: jest.fn()
  };
});

jest.mock('@opentelemetry/resources', () => {
  return {
    Resource: jest.fn().mockImplementation(() => ({}))
  };
});

jest.mock('@opentelemetry/semantic-conventions', () => {
  return {
    SemanticResourceAttributes: {
      SERVICE_NAME: 'service.name',
      SERVICE_VERSION: 'service.version',
      DEPLOYMENT_ENVIRONMENT: 'deployment.environment'
    }
  };
});

jest.mock('@opentelemetry/instrumentation-express', () => {
  return {
    ExpressInstrumentation: jest.fn()
  };
});

jest.mock('@opentelemetry/instrumentation-http', () => {
  return {
    HttpInstrumentation: jest.fn()
  };
});

jest.mock('@opentelemetry/instrumentation-mongodb', () => {
  return {
    MongoDBInstrumentation: jest.fn()
  };
});

jest.mock('@opentelemetry/instrumentation-redis', () => {
  return {
    RedisInstrumentation: jest.fn()
  };
});

jest.mock('@opentelemetry/exporter-prometheus', () => {
  return {
    PrometheusExporter: jest.fn()
  };
});

describe('OpenTelemetry 集成测试', () => {
  let app: express.Application;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 创建一个简单的 Express 应用
    app = express();
    
    // 初始化 OpenTelemetry
    initTelemetry();
    
    // 添加一个简单的路由
    app.get('/test', (req, res) => {
      res.status(200).json({ message: 'Hello, World!' });
    });
    
    // 添加一个会抛出错误的路由
    app.get('/error', (req, res) => {
      throw new Error('Test error');
    });
    
    // 错误处理中间件
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({ error: err.message });
    });
  });
  
  it('应该初始化 OpenTelemetry SDK', () => {
    expect(require('@opentelemetry/sdk-node').NodeSDK).toHaveBeenCalled();
  });
  
  it('应该处理正常请求', async () => {
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello, World!' });
  });
  
  it('应该处理错误请求', async () => {
    const response = await request(app).get('/error');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Test error' });
  });
}); 