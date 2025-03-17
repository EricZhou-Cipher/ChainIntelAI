/**
 * @file Redis缓存工具单元测试
 * @description 测试Redis缓存工具的核心功能，包括缓存操作和错误处理
 */

import Redis from 'ioredis';
import { cache } from '@/database/redis';
import { createLogger } from '@/utils/logger';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    on: jest.fn(),
    quit: jest.fn()
  }));
});

// Mock logger
jest.mock('@/utils/logger', () => ({
  createLogger: jest.fn().mockImplementation(config => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })
}));

const logger = createLogger({
  level: 'info',
  format: 'json',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss'
}); 

describe('Redis Connection Events', () => {
  it('should handle connection events', () => {
    const mockRedis = new Redis();
    const logger = createLogger({
      level: 'info',
      format: 'json',
      timestampFormat: 'YYYY-MM-DD HH:mm:ss'
    });

    expect(mockRedis.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockRedis.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(mockRedis.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
  });
}); 