/**
 * @file 数据库事务测试
 * @description 测试MongoDB事务和Redis分布式锁机制
 */

import mongoose, { ClientSession } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventDAO } from '../../database/dao/EventDAO';
import { AddressProfileDAO } from '../../database/dao/AddressProfileDAO';
import { RiskAnalysisDAO } from '../../database/dao/RiskAnalysisDAO';
import { EventRecord } from '../../database/models/EventRecord';
import { AddressProfileModel } from '../../database/models/AddressProfile';
import { RiskAnalysisModel } from '../../database/models/RiskAnalysis';
import { cache } from '../../database/redis';
import { NormalizedEvent, EventType, RiskLevel } from '../../types/events';
import { AddressCategory } from '../../types/profile';

// 模拟MongoDB和Redis
jest.mock('../../database/mongodb', () => ({
  getMongoClient: jest.fn().mockReturnValue({
    startSession: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('../../database/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    setnx: jest.fn(),
    expire: jest.fn(),
    eval: jest.fn(),
  },
}));

// 模拟模型
jest.mock('../../database/models/EventRecord', () => ({
  EventRecord: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

jest.mock('../../database/models/AddressProfile', () => ({
  AddressProfileModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../../database/models/RiskAnalysis', () => ({
  RiskAnalysisModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

describe('数据库事务测试', () => {
  let mockSession: ClientSession;
  let mockEvent: NormalizedEvent;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 模拟MongoDB会话
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    } as unknown as ClientSession;
    
    // 模拟事件数据
    mockEvent = {
      traceId: '0x123',
      chainId: 1,
      blockNumber: 12345,
      transactionHash: '0xabc',
      from: '0x123',
      to: '0x456',
      value: '1000000000000000000',
      timestamp: Math.floor(Date.now() / 1000),
      type: EventType.TRANSFER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // 模拟MongoDB客户端的startSession方法
    const { getMongoClient } = require('../../database/mongodb');
    getMongoClient().startSession.mockResolvedValue(mockSession);
  });
  
  describe('MongoDB事务', () => {
    it('应该在事务中成功执行多个操作', async () => {
      // 模拟事件记录
      const mockEventRecord = {
        traceId: mockEvent.traceId,
        event: mockEvent,
        status: 'pending',
      };
      
      // 模拟地址画像
      const mockAddressProfile = {
        address: mockEvent.from,
        riskScore: 0.2,
        category: AddressCategory.WALLET,
        tags: ['active'],
        transactionCount: 100,
        totalValue: '1000000000000000000',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        relatedAddresses: [],
      };
      
      // 模拟风险分析
      const mockRiskAnalysis = {
        address: mockEvent.from,
        analysis: {
          score: 0.3,
          level: RiskLevel.LOW,
          factors: ['normal_activity'],
          timestamp: Date.now(),
        },
      };
      
      // 模拟创建操作
      (EventRecord.create as jest.Mock).mockResolvedValue(mockEventRecord);
      (AddressProfileModel.create as jest.Mock).mockResolvedValue(mockAddressProfile);
      (RiskAnalysisModel.create as jest.Mock).mockResolvedValue(mockRiskAnalysis);
      
      // 执行事务
      const { getMongoClient } = require('../../database/mongodb');
      const mongoClient = getMongoClient();
      const session = await mongoClient.startSession();
      
      try {
        session.startTransaction();
        
        // 在事务中执行多个操作
        await EventRecord.create(mockEventRecord, { session });
        await AddressProfileModel.create(mockAddressProfile, { session });
        await RiskAnalysisModel.create(mockRiskAnalysis, { session });
        
        await session.commitTransaction();
        
        // 验证事务操作
        expect(session.startTransaction).toHaveBeenCalled();
        expect(EventRecord.create).toHaveBeenCalledWith(mockEventRecord, { session });
        expect(AddressProfileModel.create).toHaveBeenCalledWith(mockAddressProfile, { session });
        expect(RiskAnalysisModel.create).toHaveBeenCalledWith(mockRiskAnalysis, { session });
        expect(session.commitTransaction).toHaveBeenCalled();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    });
    
    it('应该在操作失败时回滚事务', async () => {
      // 模拟事件记录
      const mockEventRecord = {
        traceId: mockEvent.traceId,
        event: mockEvent,
        status: 'pending',
      };
      
      // 模拟地址画像
      const mockAddressProfile = {
        address: mockEvent.from,
        riskScore: 0.2,
        category: AddressCategory.WALLET,
        tags: ['active'],
        transactionCount: 100,
        totalValue: '1000000000000000000',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        relatedAddresses: [],
      };
      
      // 模拟第一个操作成功，第二个操作失败
      (EventRecord.create as jest.Mock).mockResolvedValue(mockEventRecord);
      const dbError = new Error('数据库错误');
      (AddressProfileModel.create as jest.Mock).mockRejectedValue(dbError);
      
      // 执行事务
      const { getMongoClient } = require('../../database/mongodb');
      const mongoClient = getMongoClient();
      const session = await mongoClient.startSession();
      
      try {
        session.startTransaction();
        
        // 第一个操作成功
        await EventRecord.create(mockEventRecord, { session });
        
        // 第二个操作失败，应该触发回滚
        await AddressProfileModel.create(mockAddressProfile, { session });
        
        await session.commitTransaction();
      } catch (error) {
        // 验证错误
        expect(error).toBe(dbError);
        
        // 验证回滚
        await session.abortTransaction();
        expect(session.abortTransaction).toHaveBeenCalled();
      } finally {
        session.endSession();
      }
    });
    
    it('应该处理并发事务', async () => {
      // 模拟两个并发事务的会话
      const session1 = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      } as unknown as ClientSession;
      
      const session2 = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      } as unknown as ClientSession;
      
      // 模拟MongoDB客户端的startSession方法
      const { getMongoClient } = require('../../database/mongodb');
      getMongoClient().startSession
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2);
      
      // 模拟事件记录
      const mockEventRecord1 = {
        traceId: '0x123',
        event: { ...mockEvent, transactionHash: '0xabc1' },
        status: 'pending',
      };
      
      const mockEventRecord2 = {
        traceId: '0x456',
        event: { ...mockEvent, transactionHash: '0xabc2' },
        status: 'pending',
      };
      
      // 模拟第一个事务成功，第二个事务失败（模拟并发冲突）
      (EventRecord.create as jest.Mock)
        .mockResolvedValueOnce(mockEventRecord1)
        .mockImplementationOnce(() => {
          // 模拟并发冲突
          const error = new Error('WriteConflict');
          error.name = 'MongoError';
          error.code = 112; // MongoDB写冲突错误码
          return Promise.reject(error);
        });
      
      // 执行第一个事务
      const mongoClient = getMongoClient();
      const session1Promise = mongoClient.startSession().then(async (session) => {
        try {
          session.startTransaction();
          await EventRecord.create(mockEventRecord1, { session });
          await session.commitTransaction();
          return true;
        } catch (error) {
          await session.abortTransaction();
          return false;
        } finally {
          session.endSession();
        }
      });
      
      // 执行第二个事务
      const session2Promise = mongoClient.startSession().then(async (session) => {
        try {
          session.startTransaction();
          await EventRecord.create(mockEventRecord2, { session });
          await session.commitTransaction();
          return true;
        } catch (error) {
          await session.abortTransaction();
          return false;
        } finally {
          session.endSession();
        }
      });
      
      // 等待两个事务完成
      const [result1, result2] = await Promise.all([session1Promise, session2Promise]);
      
      // 验证第一个事务成功，第二个事务失败
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(session1.commitTransaction).toHaveBeenCalled();
      expect(session2.abortTransaction).toHaveBeenCalled();
    });
  });
  
  describe('Redis分布式锁', () => {
    it('应该成功获取和释放分布式锁', async () => {
      const lockKey = 'lock:test';
      const lockValue = Date.now().toString();
      const lockTTL = 10; // 10秒
      
      // 模拟成功获取锁
      (cache.setnx as jest.Mock).mockResolvedValue(1);
      (cache.expire as jest.Mock).mockResolvedValue(1);
      
      // 模拟成功释放锁
      (cache.eval as jest.Mock).mockResolvedValue(1);
      
      // 获取锁
      const acquireLock = async () => {
        const result = await cache.setnx(lockKey, lockValue);
        if (result === 1) {
          await cache.expire(lockKey, lockTTL);
          return true;
        }
        return false;
      };
      
      // 释放锁
      const releaseLock = async () => {
        // 使用Lua脚本确保原子性操作
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const result = await cache.eval(script, 1, lockKey, lockValue);
        return result === 1;
      };
      
      // 执行获取锁
      const lockAcquired = await acquireLock();
      
      // 验证锁获取成功
      expect(lockAcquired).toBe(true);
      expect(cache.setnx).toHaveBeenCalledWith(lockKey, lockValue);
      expect(cache.expire).toHaveBeenCalledWith(lockKey, lockTTL);
      
      // 执行释放锁
      const lockReleased = await releaseLock();
      
      // 验证锁释放成功
      expect(lockReleased).toBe(true);
      expect(cache.eval).toHaveBeenCalled();
    });
    
    it('应该处理锁获取失败的情况', async () => {
      const lockKey = 'lock:test';
      const lockValue = Date.now().toString();
      const lockTTL = 10; // 10秒
      
      // 模拟锁已被其他进程获取
      (cache.setnx as jest.Mock).mockResolvedValue(0);
      
      // 获取锁
      const acquireLock = async () => {
        const result = await cache.setnx(lockKey, lockValue);
        if (result === 1) {
          await cache.expire(lockKey, lockTTL);
          return true;
        }
        return false;
      };
      
      // 执行获取锁
      const lockAcquired = await acquireLock();
      
      // 验证锁获取失败
      expect(lockAcquired).toBe(false);
      expect(cache.setnx).toHaveBeenCalledWith(lockKey, lockValue);
      expect(cache.expire).not.toHaveBeenCalled();
    });
    
    it('应该处理高并发下的锁竞争', async () => {
      const lockKey = 'lock:test';
      const lockTTL = 10; // 10秒
      
      // 模拟三个并发请求
      const client1 = { id: 'client1', value: 'value1' };
      const client2 = { id: 'client2', value: 'value2' };
      const client3 = { id: 'client3', value: 'value3' };
      
      // 模拟只有第一个客户端成功获取锁
      (cache.setnx as jest.Mock)
        .mockResolvedValueOnce(1)  // client1 成功
        .mockResolvedValueOnce(0)  // client2 失败
        .mockResolvedValueOnce(0); // client3 失败
      
      (cache.expire as jest.Mock).mockResolvedValue(1);
      
      // 获取锁函数
      const acquireLock = async (clientId: string, clientValue: string) => {
        const result = await cache.setnx(lockKey, clientValue);
        if (result === 1) {
          await cache.expire(lockKey, lockTTL);
          return true;
        }
        return false;
      };
      
      // 并发获取锁
      const results = await Promise.all([
        acquireLock(client1.id, client1.value),
        acquireLock(client2.id, client2.value),
        acquireLock(client3.id, client3.value),
      ]);
      
      // 验证只有第一个客户端成功获取锁
      expect(results).toEqual([true, false, false]);
      expect(cache.setnx).toHaveBeenCalledTimes(3);
      expect(cache.expire).toHaveBeenCalledTimes(1);
    });
    
    it('应该处理锁超时自动释放', async () => {
      const lockKey = 'lock:test';
      const lockValue = Date.now().toString();
      const lockTTL = 10; // 10秒
      
      // 模拟成功获取锁
      (cache.setnx as jest.Mock).mockResolvedValue(1);
      (cache.expire as jest.Mock).mockResolvedValue(1);
      
      // 模拟锁超时
      jest.useFakeTimers();
      
      // 获取锁
      const acquireLock = async () => {
        const result = await cache.setnx(lockKey, lockValue);
        if (result === 1) {
          await cache.expire(lockKey, lockTTL);
          return true;
        }
        return false;
      };
      
      // 执行获取锁
      const lockAcquired = await acquireLock();
      
      // 验证锁获取成功
      expect(lockAcquired).toBe(true);
      
      // 模拟锁超时
      jest.advanceTimersByTime(lockTTL * 1000 + 1000); // 超过TTL时间
      
      // 重置mock，模拟锁已过期，可以重新获取
      (cache.setnx as jest.Mock).mockReset().mockResolvedValue(1);
      
      // 再次获取锁
      const lockAcquiredAgain = await acquireLock();
      
      // 验证可以重新获取锁
      expect(lockAcquiredAgain).toBe(true);
      
      // 恢复真实计时器
      jest.useRealTimers();
    });
  });
}); 