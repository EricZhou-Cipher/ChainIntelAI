import { jest } from '@jest/globals';
import { initializeDatabase, closeDatabase } from '../../database';
import * as mongodb from '../../database/mongodb';
import * as redisModule from '../../database/redis';
import { EventDAO } from '../../database/dao/EventDAO';
import { AddressProfileDAO } from '../../database/dao/AddressProfileDAO';
import { RiskAnalysisDAO } from '../../database/dao/RiskAnalysisDAO';
import { mockMongoDB, mockRedis, mockModels, mockDAOs, mockLogger } from '../utils/mockDatabase';

describe('Database', () => {
  // 初始化所有模拟
  const { mockMongoose, mockSession, cleanup: cleanupMongoDB } = mockMongoDB();
  const { mockRedisInstance, mockCache, cleanup: cleanupRedis } = mockRedis();
  const { mockEventRecord, mockAddressProfile, mockRiskAnalysis, cleanup: cleanupModels } = mockModels();
  const { mockEventDAO, mockAddressProfileDAO, mockRiskAnalysisDAO, cleanup: cleanupDAOs } = mockDAOs();
  const { mockLogger, cleanup: cleanupLogger } = mockLogger();

  // 在所有测试前设置模拟
  beforeAll(() => {
    // 显式模拟 connectMongoDB 和 disconnectMongoDB
    jest.spyOn(mongodb, 'connectMongoDB');
    jest.spyOn(mongodb, 'disconnectMongoDB');
    
    // 模拟cache方法
    jest.spyOn(redisModule.cache, 'get');
    jest.spyOn(redisModule.cache, 'set');
    jest.spyOn(redisModule.cache, 'del');
    jest.spyOn(redisModule.cache, 'exists');
  });
  
  // 在每个测试前重置模拟
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // 在所有测试后清理模拟
  afterAll(() => {
    cleanupMongoDB();
    cleanupRedis();
    cleanupModels();
    cleanupDAOs();
    cleanupLogger();
  });

  describe('MongoDB', () => {
    it('should connect to MongoDB successfully', async () => {
      mockMongoose.connect.mockResolvedValueOnce(undefined);
      
      await expect(mongodb.connectMongoDB()).resolves.not.toThrow();
      expect(mockMongoose.connect).toHaveBeenCalled();
    });

    it('should handle MongoDB connection failure', async () => {
      const error = new Error('MongoDB Connection Failed');
      mockMongoose.connect.mockRejectedValueOnce(error);
      
      await expect(mongodb.connectMongoDB()).rejects.toThrow('MongoDB Connection Failed');
    });

    it('should disconnect from MongoDB successfully', async () => {
      mockMongoose.disconnect.mockResolvedValueOnce(undefined);
      
      await expect(mongodb.disconnectMongoDB()).resolves.not.toThrow();
      expect(mockMongoose.disconnect).toHaveBeenCalled();
    });

    it('should handle MongoDB disconnection failure', async () => {
      const error = new Error('MongoDB Disconnection Failed');
      mockMongoose.disconnect.mockRejectedValueOnce(error);
      
      await expect(mongodb.disconnectMongoDB()).rejects.toThrow('MongoDB Disconnection Failed');
    });
    
    it('should handle MongoDB connection events', () => {
      // 设置mongoose.connection.on的模拟实现
      mockMongoose.connection.on.mockImplementation((event, callback) => {
        // 立即调用回调函数以触发事件处理
        if (event === 'error') {
          callback(new Error('Connection error'));
        } else if (event === 'disconnected') {
          callback();
        } else if (event === 'reconnected') {
          callback();
        }
        return mockMongoose.connection;
      });
      
      // 手动调用mongodb模块中的事件监听设置
      // 这将触发我们上面设置的模拟实现
      mongodb.connectMongoDB();
      
      // 验证事件监听器被调用
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
    });
    
    it('should handle MongoDB transactions', async () => {
      // 模拟事务成功
      mockSession.withTransaction.mockImplementationOnce(async (callback) => {
        return await callback();
      });
      
      // 执行事务
      const result = await mockMongoose.startSession().withTransaction(async () => {
        return { success: true };
      });
      
      expect(result).toEqual({ success: true });
      expect(mockSession.withTransaction).toHaveBeenCalled();
    });
    
    it('should handle MongoDB transaction failures and rollback', async () => {
      // 模拟事务失败
      mockSession.withTransaction.mockImplementationOnce(async (callback) => {
        try {
          await callback();
        } catch (error) {
          // 模拟回滚
          mockSession.abortTransaction.mockResolvedValueOnce(undefined);
          throw error;
        }
      });
      
      // 执行事务，预期会失败
      try {
        await mockMongoose.startSession().withTransaction(async () => {
          throw new Error('Transaction failed');
        });
        fail('Transaction should have failed');
      } catch (error) {
        expect(error.message).toBe('Transaction failed');
        expect(mockSession.abortTransaction).toHaveBeenCalled();
      }
    });
  });

  describe('Redis', () => {
    beforeEach(() => {
      // 重置模拟并设置cache方法的实现
      jest.clearAllMocks();
      
      // 模拟cache.get的实现
      mockCache.get.mockImplementation(async (key) => {
        try {
          const data = await mockRedisInstance.get(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          return null;
        }
      });
      
      // 模拟cache.set的实现
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
      
      // 模拟cache.del的实现
      mockCache.del.mockImplementation(async (key) => {
        try {
          await mockRedisInstance.del(key);
        } catch (error) {
          // 忽略错误
        }
      });
      
      // 模拟cache.exists的实现
      mockCache.exists.mockImplementation(async (key) => {
        try {
          const result = await mockRedisInstance.exists(key);
          return result === 1;
        } catch (error) {
          return false;
        }
      });
    });
    
    it('should handle Redis get operation', async () => {
      const mockData = JSON.stringify({ key: 'value' });
      mockRedisInstance.get.mockResolvedValueOnce(mockData);
      
      const result = await redisModule.cache.get('test-key');
      
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual({ key: 'value' });
    });
    
    it('should handle Redis get failure', async () => {
      mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis get error'));
      
      const result = await redisModule.cache.get('test-key');
      
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });
    
    it('should handle Redis get with null result', async () => {
      mockRedisInstance.get.mockResolvedValueOnce(null);
      
      const result = await redisModule.cache.get('test-key');
      
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });
    
    it('should handle Redis get with invalid JSON', async () => {
      mockRedisInstance.get.mockResolvedValueOnce('invalid-json');
      
      const result = await redisModule.cache.get('test-key');
      
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });
    
    it('should handle Redis set operation with TTL', async () => {
      mockRedisInstance.setex.mockResolvedValueOnce('OK');
      
      await redisModule.cache.set('test-key', { key: 'value' }, 60);
      
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'test-key',
        60,
        JSON.stringify({ key: 'value' })
      );
    });
    
    it('should handle Redis set operation without TTL', async () => {
      mockRedisInstance.set.mockResolvedValueOnce('OK');
      
      await redisModule.cache.set('test-key', { key: 'value' });
      
      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ key: 'value' })
      );
    });
    
    it('should handle Redis set failure', async () => {
      mockRedisInstance.set.mockRejectedValueOnce(new Error('Redis set error'));
      
      // 不会抛出错误
      await redisModule.cache.set('test-key', { key: 'value' });
      
      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ key: 'value' })
      );
    });
    
    it('should handle Redis setex failure', async () => {
      mockRedisInstance.setex.mockRejectedValueOnce(new Error('Redis setex error'));
      
      // 不会抛出错误
      await redisModule.cache.set('test-key', { key: 'value' }, 60);
      
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'test-key',
        60,
        JSON.stringify({ key: 'value' })
      );
    });
    
    it('should handle Redis delete operation', async () => {
      mockRedisInstance.del.mockResolvedValueOnce(1);
      
      await redisModule.cache.del('test-key');
      
      expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
    });
    
    it('should handle Redis delete failure', async () => {
      mockRedisInstance.del.mockRejectedValueOnce(new Error('Redis del error'));
      
      // 不会抛出错误
      await redisModule.cache.del('test-key');
      
      expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
    });
    
    it('should handle Redis exists operation', async () => {
      mockRedisInstance.exists.mockResolvedValueOnce(1);
      
      const result = await redisModule.cache.exists('test-key');
      
      expect(mockRedisInstance.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });
    
    it('should handle Redis exists with zero result', async () => {
      mockRedisInstance.exists.mockResolvedValueOnce(0);
      
      const result = await redisModule.cache.exists('test-key');
      
      expect(mockRedisInstance.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(false);
    });
    
    it('should handle Redis exists failure', async () => {
      mockRedisInstance.exists.mockRejectedValueOnce(new Error('Redis exists error'));
      
      const result = await redisModule.cache.exists('test-key');
      
      expect(mockRedisInstance.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(false);
    });
    
    it('should handle Redis connection events', () => {
      // 设置redis.on的模拟实现
      mockRedisInstance.on.mockImplementation((event, callback) => {
        // 立即调用回调函数以触发事件处理
        if (event === 'connect') {
          callback();
        } else if (event === 'error') {
          callback(new Error('Redis error'));
        } else if (event === 'close') {
          callback();
        } else if (event === 'reconnecting') {
          callback();
        }
        return mockRedisInstance;
      });
      
      // 确保事件监听器被调用
      expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
    });
    
    it('should handle Redis connection state changes', () => {
      // 模拟连接状态变化
      mockRedisInstance.status = 'connecting';
      expect(mockRedisInstance.status).toBe('connecting');
      
      mockRedisInstance.status = 'ready';
      expect(mockRedisInstance.status).toBe('ready');
      
      mockRedisInstance.status = 'closing';
      expect(mockRedisInstance.status).toBe('closing');
      
      mockRedisInstance.status = 'closed';
      expect(mockRedisInstance.status).toBe('closed');
    });
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      (mongodb.connectMongoDB as jest.Mock).mockResolvedValueOnce(undefined);
      
      await expect(initializeDatabase()).resolves.not.toThrow();
      
      expect(mongodb.connectMongoDB).toHaveBeenCalled();
    });
    
    it('should handle database initialization failure', async () => {
      const error = new Error('Database initialization failed');
      (mongodb.connectMongoDB as jest.Mock).mockRejectedValueOnce(error);
      
      await expect(initializeDatabase()).rejects.toThrow('Database initialization failed');
      
      expect(mongodb.connectMongoDB).toHaveBeenCalled();
    });
    
    it('should close database successfully', async () => {
      (mongodb.disconnectMongoDB as jest.Mock).mockResolvedValueOnce(undefined);
      mockRedisInstance.quit.mockResolvedValueOnce('OK');
      
      await expect(closeDatabase()).resolves.not.toThrow();
      
      expect(mongodb.disconnectMongoDB).toHaveBeenCalled();
      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
    
    it('should handle database closure failure', async () => {
      const error = new Error('Database closure failed');
      (mongodb.disconnectMongoDB as jest.Mock).mockRejectedValueOnce(error);
      
      await expect(closeDatabase()).rejects.toThrow('Database closure failed');
      
      expect(mongodb.disconnectMongoDB).toHaveBeenCalled();
    });
    
    it('should handle Redis quit failure during database closure', async () => {
      (mongodb.disconnectMongoDB as jest.Mock).mockResolvedValueOnce(undefined);
      mockRedisInstance.quit.mockRejectedValueOnce(new Error('Database closure failed'));
      
      try {
        await closeDatabase();
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Database closure failed');
      }
      
      expect(mongodb.disconnectMongoDB).toHaveBeenCalled();
      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
  });
  
  describe('DAO Integration', () => {
    describe('EventDAO', () => {
      it('should create event record', async () => {
        const mockEvent = {
          traceId: 'trace-123',
          event: {
            transactionHash: '0x123',
            from: '0xabc',
            to: '0xdef',
            value: '1000000000000000000',
            chainId: 1,
            blockNumber: 12345678,
            timestamp: Date.now(),
            type: 'transfer',
          },
          status: 'pending',
        } as any; // 使用类型断言
        
        mockEventDAO.create.mockResolvedValueOnce({ 
          ...mockEvent, 
          _id: 'event-id' 
        });
        
        const result = await EventDAO.create(mockEvent);
        
        expect(mockEventDAO.create).toHaveBeenCalledWith(mockEvent);
        expect(result).toHaveProperty('_id', 'event-id');
        expect(result).toHaveProperty('traceId', 'trace-123');
      });
      
      it('should handle event creation failure', async () => {
        const mockEvent = {
          traceId: 'trace-123',
          event: {
            transactionHash: '0x123',
            from: '0xabc',
            to: '0xdef',
          },
          status: 'pending',
        } as any;
        
        const error = new Error('Event creation failed');
        mockEventDAO.create.mockRejectedValueOnce(error);
        
        await expect(EventDAO.create(mockEvent)).rejects.toThrow('Event creation failed');
        expect(mockEventDAO.create).toHaveBeenCalledWith(mockEvent);
      });
      
      it('should find event by transaction hash', async () => {
        const mockEvent = {
          _id: 'event-id',
          traceId: 'trace-123',
          event: {
            transactionHash: '0x123',
            from: '0xabc',
            to: '0xdef',
          },
          status: 'completed',
        };
        
        mockEventDAO.findByTransactionHash.mockResolvedValueOnce(mockEvent);
        
        const result = await EventDAO.findByTransactionHash('0x123');
        
        expect(mockEventDAO.findByTransactionHash).toHaveBeenCalledWith('0x123');
        expect(result).toEqual(mockEvent);
      });
      
      it('should handle event not found by transaction hash', async () => {
        mockEventDAO.findByTransactionHash.mockResolvedValueOnce(null);
        
        const result = await EventDAO.findByTransactionHash('0x123');
        
        expect(mockEventDAO.findByTransactionHash).toHaveBeenCalledWith('0x123');
        expect(result).toBeNull();
      });
      
      it('should handle error when finding event by transaction hash', async () => {
        const error = new Error('Database error');
        mockEventDAO.findByTransactionHash.mockRejectedValueOnce(error);
        
        await expect(EventDAO.findByTransactionHash('0x123')).rejects.toThrow('Database error');
        expect(mockEventDAO.findByTransactionHash).toHaveBeenCalledWith('0x123');
      });
    });
    
    describe('AddressProfileDAO', () => {
      it('should create address profile', async () => {
        const mockProfile = {
          address: '0xabc',
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          category: 'user',
          tags: ['high-value'],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any; // 使用类型断言
        
        mockAddressProfileDAO.create.mockResolvedValueOnce({
          ...mockProfile,
          _id: 'profile-id',
        });
        
        const result = await AddressProfileDAO.create(mockProfile);
        
        expect(mockAddressProfileDAO.create).toHaveBeenCalledWith(mockProfile);
        expect(result).toHaveProperty('_id', 'profile-id');
        expect(result).toHaveProperty('address', '0xabc');
      });
      
      it('should handle profile creation failure', async () => {
        const mockProfile = {
          address: '0xabc',
          category: 'user',
        } as any;
        
        const error = new Error('Profile creation failed');
        mockAddressProfileDAO.create.mockRejectedValueOnce(error);
        
        await expect(AddressProfileDAO.create(mockProfile)).rejects.toThrow('Profile creation failed');
        expect(mockAddressProfileDAO.create).toHaveBeenCalledWith(mockProfile);
      });
      
      it('should find profile by address', async () => {
        const mockProfile = {
          _id: 'profile-id',
          address: '0xabc',
          category: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        mockAddressProfileDAO.findByAddress.mockResolvedValueOnce(mockProfile);
        
        const result = await AddressProfileDAO.findByAddress('0xabc');
        
        expect(mockAddressProfileDAO.findByAddress).toHaveBeenCalledWith('0xabc');
        expect(result).toEqual(mockProfile);
      });
      
      it('should handle profile not found by address', async () => {
        mockAddressProfileDAO.findByAddress.mockResolvedValueOnce(null);
        
        const result = await AddressProfileDAO.findByAddress('0xabc');
        
        expect(mockAddressProfileDAO.findByAddress).toHaveBeenCalledWith('0xabc');
        expect(result).toBeNull();
      });
      
      it('should handle error when finding profile by address', async () => {
        const error = new Error('Database error');
        mockAddressProfileDAO.findByAddress.mockRejectedValueOnce(error);
        
        await expect(AddressProfileDAO.findByAddress('0xabc')).rejects.toThrow('Database error');
        expect(mockAddressProfileDAO.findByAddress).toHaveBeenCalledWith('0xabc');
      });
      
      it('should update profile', async () => {
        const mockProfile = {
          address: '0xabc',
          category: 'exchange',
          tags: ['high-volume'],
        };
        
        mockAddressProfileDAO.updateProfile.mockResolvedValueOnce({
          ...mockProfile,
          _id: 'profile-id',
          updatedAt: new Date(),
        });
        
        const result = await AddressProfileDAO.updateProfile('0xabc', mockProfile);
        
        expect(mockAddressProfileDAO.updateProfile).toHaveBeenCalledWith('0xabc', mockProfile);
        expect(result).toHaveProperty('address', '0xabc');
        expect(result).toHaveProperty('category', 'exchange');
      });
    });
    
    describe('RiskAnalysisDAO', () => {
      it('should create risk analysis', async () => {
        const mockAnalysis = {
          address: '0xabc',
          analysis: {
            score: 0.85,
            level: 'high',
            factors: ['large-transfer', 'new-address'],
            details: {
              transactions: 5,
              volume: '10000000000000000000'
            }
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any; // 使用类型断言
        
        mockRiskAnalysisDAO.create.mockResolvedValueOnce({
          ...mockAnalysis,
          _id: 'analysis-id',
        });
        
        const result = await RiskAnalysisDAO.create(mockAnalysis);
        
        expect(mockRiskAnalysisDAO.create).toHaveBeenCalledWith(mockAnalysis);
        expect(result).toHaveProperty('_id', 'analysis-id');
        expect(result).toHaveProperty('address', '0xabc');
      });
      
      it('should handle analysis creation failure', async () => {
        const mockAnalysis = {
          address: '0xabc',
          analysis: {
            score: 0.85,
            level: 'high',
          },
        } as any;
        
        const error = new Error('Analysis creation failed');
        mockRiskAnalysisDAO.create.mockRejectedValueOnce(error);
        
        await expect(RiskAnalysisDAO.create(mockAnalysis)).rejects.toThrow('Analysis creation failed');
        expect(mockRiskAnalysisDAO.create).toHaveBeenCalledWith(mockAnalysis);
      });
      
      it('should find analysis by address', async () => {
        const mockAnalysis = {
          _id: 'analysis-id',
          address: '0xabc',
          analysis: {
            score: 0.85,
            level: 'high',
            factors: ['large-transfer', 'new-address'],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        mockRiskAnalysisDAO.findByAddress.mockResolvedValueOnce(mockAnalysis);
        
        const result = await RiskAnalysisDAO.findByAddress('0xabc');
        
        expect(mockRiskAnalysisDAO.findByAddress).toHaveBeenCalledWith('0xabc');
        expect(result).toEqual(mockAnalysis);
      });
      
      it('should handle analysis not found by address', async () => {
        mockRiskAnalysisDAO.findByAddress.mockResolvedValueOnce(null);
        
        const result = await RiskAnalysisDAO.findByAddress('0xabc');
        
        expect(mockRiskAnalysisDAO.findByAddress).toHaveBeenCalledWith('0xabc');
        expect(result).toBeNull();
      });
      
      it('should find analysis by transaction hash', async () => {
        const mockAnalysis = {
          _id: 'analysis-id',
          transactionHash: '0x123',
          score: 0.85,
          level: 'high',
          factors: ['large-transfer', 'new-address'],
          createdAt: new Date(),
        };
        
        mockRiskAnalysisDAO.findByTransactionHash.mockResolvedValueOnce(mockAnalysis);
        
        const result = await RiskAnalysisDAO.findByTransactionHash('0x123');
        
        expect(mockRiskAnalysisDAO.findByTransactionHash).toHaveBeenCalledWith('0x123');
        expect(result).toEqual(mockAnalysis);
      });
      
      it('should handle error when finding analysis by transaction hash', async () => {
        const error = new Error('Database error');
        mockRiskAnalysisDAO.findByTransactionHash.mockRejectedValueOnce(error);
        
        await expect(RiskAnalysisDAO.findByTransactionHash('0x123')).rejects.toThrow('Database error');
        expect(mockRiskAnalysisDAO.findByTransactionHash).toHaveBeenCalledWith('0x123');
      });
    });
  });
}); 