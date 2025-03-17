/**
 * @file 测试环境设置
 * @description 配置Jest测试环境
 */

import { register } from 'prom-client';
import { ILogger } from '../src/utils/logger';
import { AppConfig } from '../src/config';
import { RiskLevel } from '../src/types/events';
import { jest, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import { Logger } from '../src/utils/logger';

// 测试日志实现
class TestLogger extends Logger {
  constructor() {
    super();
    this.traceId = 'test-trace-id';
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, meta);
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }
}

export const testLogger = new TestLogger();

// 测试配置
export const testConfig: AppConfig = {
  app: {
    name: 'ChainIntelAI',
    version: '1.0.0',
    environment: 'test',
  },
  server: {
    port: 3000,
    host: 'localhost',
  },
  database: {
    host: 'localhost',
    port: 27017,
    username: 'test',
    password: 'test',
    database: 'chainintel_test',
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
  },
  monitoring: {
    prometheus: {
      enabled: true,
      port: 9090,
    },
    logging: {
      level: 'debug',
      format: 'json',
    },
  },
  riskAnalysis: {
    thresholds: {
      [RiskLevel.LOW]: 0.3,
      [RiskLevel.MEDIUM]: 0.5,
      [RiskLevel.HIGH]: 0.7,
      [RiskLevel.CRITICAL]: 0.9,
    },
    minRiskLevel: RiskLevel.HIGH,
    maxRiskLevel: RiskLevel.CRITICAL,
  },
};

// 清理 Prometheus 指标
beforeAll(() => {
  register.clear();
});

// 设置测试超时
jest.setTimeout(30000);

// 全局测试设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';

  // 设置测试日志
  testLogger.info('Starting test suite');
});

afterAll(async () => {
  testLogger.info('Test suite completed');
});

// 每个测试用例的设置
beforeEach(() => {
  // 重置测试状态
  jest.clearAllMocks();

  // 设置新的 traceId
  testLogger.setTraceId(require('uuid').v4());
});

// 模拟控制台输出
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.debug = jest.fn();
});

afterAll(() => {
  console = originalConsole;
});

beforeEach(() => {
  // 清除所有Prometheus指标
  register.clear();
});

afterAll(() => {
  // Clean up any remaining metrics
  register.clear();
});

// 扩展Jest的匹配器
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
