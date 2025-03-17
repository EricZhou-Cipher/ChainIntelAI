/**
 * @file 测试环境设置
 * @description 配置Jest测试环境
 */

import { register } from 'prom-client';
import { ILogger } from '../utils/logger';
import { AppConfig } from '../config';
import { RiskLevel } from '../types/events';
import { jest, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import { Logger } from '../utils/logger';

// 设置默认超时时间
jest.setTimeout(10000);

// 测试日志实现
class TestLogger extends Logger {
  constructor() {
    super();
    this.traceId = 'test-trace-id';
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
    port: 5432,
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

// 模拟 Redis
jest.mock('../database/redis', () => {
  return {
    redis: {
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    },
    cache: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    }
  };
});

// 模拟 MongoDB 连接
jest.mock('mongoose', () => {
  return {
    connect: jest.fn().mockReturnValue(Promise.resolve()),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
    },
    Schema: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnThis(),
    })),
    model: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
  };
});

// 全局设置
beforeAll(async () => {
  // 在这里添加测试前的设置逻辑
});

// 每个测试前重置状态
beforeEach(async () => {
  // 在这里添加每个测试前的重置逻辑
});

// 全局清理
afterAll(async () => {
  // 在这里添加测试后的清理逻辑
});

// 清理 Prometheus 指标
beforeAll(() => {
  register.clear();
});

// 全局测试设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';

  // 设置测试日志
  testLogger.info('Starting test suite');

  // 禁用控制台输出
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
  jest.spyOn(console, 'warn').mockImplementation(() => { });
});

afterAll(async () => {
  testLogger.info('Test suite completed');
  jest.restoreAllMocks();
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
