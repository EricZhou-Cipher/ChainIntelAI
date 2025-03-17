import mongoose from 'mongoose';
import { jest } from '@jest/globals';

/**
 * 模拟MongoDB数据库
 * @returns 模拟的MongoDB对象和清理函数
 */
export function mockMongoDB() {
  // 创建模拟对象
  const mockMongoose = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      db: {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnThis(),
          findOne: jest.fn().mockReturnThis(),
          insertOne: jest.fn().mockReturnThis(),
          updateOne: jest.fn().mockReturnThis(),
          deleteOne: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([]),
        }),
      },
    },
    startSession: jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
    Schema: {
      Types: {
        Mixed: 'mixed',
        ObjectId: 'objectid'
      }
    },
  };

  // 模拟mongoose模块
  jest.mock('mongoose', () => mockMongoose);

  // 模拟事务相关方法
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
    withTransaction: jest.fn().mockImplementation(async (callback) => {
      try {
        return await callback();
      } catch (error) {
        throw error;
      }
    }),
  };

  mockMongoose.startSession.mockResolvedValue(mockSession);

  // 返回模拟对象和清理函数
  return {
    mockMongoose,
    mockSession,
    cleanup: () => {
      jest.resetAllMocks();
    }
  };
}

/**
 * 模拟Redis数据库
 * @returns 模拟的Redis对象和清理函数
 */
export function mockRedis() {
  // 创建模拟Redis实例
  const mockRedisInstance = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    status: 'ready',
  };

  // 模拟ioredis模块
  jest.mock('ioredis', () => {
    return {
      default: jest.fn(() => mockRedisInstance),
      Redis: jest.fn(() => mockRedisInstance),
    };
  });

  // 模拟cache方法
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  };

  // 模拟redis模块
  jest.mock('../../database/redis', () => {
    return {
      redis: mockRedisInstance,
      cache: mockCache,
    };
  });

  // 设置默认实现
  mockCache.get.mockImplementation(async (key) => {
    try {
      const data = await mockRedisInstance.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  });

  mockCache.set.mockImplementation(async (key, value, ttl) => {
    try {
      if (ttl) {
        await mockRedisInstance.setex(key, ttl, JSON.stringify(value));
      } else {
        await mockRedisInstance.set(key, JSON.stringify(value));
      }
    } catch (error) {
      // 忽略错误
    }
  });

  mockCache.del.mockImplementation(async (key) => {
    try {
      await mockRedisInstance.del(key);
    } catch (error) {
      // 忽略错误
    }
  });

  mockCache.exists.mockImplementation(async (key) => {
    try {
      const result = await mockRedisInstance.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  });

  // 返回模拟对象和清理函数
  return {
    mockRedisInstance,
    mockCache,
    cleanup: () => {
      jest.resetAllMocks();
    }
  };
}

/**
 * 模拟数据库模型
 * @returns 模拟的数据库模型对象
 */
export function mockModels() {
  // 模拟数据库模型
  const mockEventRecord = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockAddressProfile = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockRiskAnalysis = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  // 模拟数据库模型
  jest.mock('../../database/models/EventRecord', () => mockEventRecord, { virtual: true });
  jest.mock('../../database/models/AddressProfile', () => mockAddressProfile, { virtual: true });
  jest.mock('../../database/models/RiskAnalysis', () => mockRiskAnalysis, { virtual: true });

  return {
    mockEventRecord,
    mockAddressProfile,
    mockRiskAnalysis,
    cleanup: () => {
      jest.resetAllMocks();
    }
  };
}

/**
 * 模拟DAO层
 * @returns 模拟的DAO对象
 */
export function mockDAOs() {
  // 模拟DAO方法
  const mockEventDAO = {
    create: jest.fn(),
    findByTraceId: jest.fn(),
    findByTransactionHash: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  const mockAddressProfileDAO = {
    create: jest.fn(),
    findByAddress: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  };

  const mockRiskAnalysisDAO = {
    create: jest.fn(),
    findByAddress: jest.fn(),
    findByTransactionHash: jest.fn(),
    updateAnalysis: jest.fn(),
    deleteAnalysis: jest.fn(),
  };

  // 模拟DAO模块
  jest.mock('../../database/dao/EventDAO', () => ({
    EventDAO: mockEventDAO,
  }));

  jest.mock('../../database/dao/AddressProfileDAO', () => ({
    AddressProfileDAO: mockAddressProfileDAO,
  }));

  jest.mock('../../database/dao/RiskAnalysisDAO', () => ({
    RiskAnalysisDAO: mockRiskAnalysisDAO,
  }));

  return {
    mockEventDAO,
    mockAddressProfileDAO,
    mockRiskAnalysisDAO,
    cleanup: () => {
      jest.resetAllMocks();
    }
  };
}

/**
 * 模拟logger
 * @returns 模拟的logger对象
 */
export function mockLogger() {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  // 模拟logger模块
  jest.mock('../../utils/logger', () => ({
    createLogger: jest.fn(() => mockLogger),
    Logger: jest.fn(() => mockLogger),
  }));

  return {
    mockLogger,
    cleanup: () => {
      jest.resetAllMocks();
    }
  };
} 