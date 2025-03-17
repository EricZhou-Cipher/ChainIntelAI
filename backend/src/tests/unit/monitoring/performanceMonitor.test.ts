import { Request, Response, NextFunction } from 'express';
import { 
  performanceMonitor, 
  recordDbQueryLatency, 
  recordCacheHit, 
  recordCacheMiss, 
  recordDbConnection,
  getPerformanceStats,
  resetPerformanceStats
} from '../../../monitoring/performanceMonitor';
import { register } from 'prom-client';

// 模拟 Express 请求和响应
const mockRequest = () => {
  return {
    path: '/test',
    method: 'GET',
    ip: '127.0.0.1',
    get: jest.fn().mockImplementation((header) => {
      if (header === 'user-agent') return 'test-agent';
      if (header === 'content-length') return '100';
      return null;
    })
  } as unknown as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    statusCode: 200,
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis()
  };
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('Performance Monitor', () => {
  beforeEach(() => {
    // 清理 Prometheus 注册表
    register.clear();
    // 重置性能统计数据
    resetPerformanceStats();
  });

  describe('performanceMonitor middleware', () => {
    it('should create a middleware function', () => {
      const middleware = performanceMonitor();
      expect(typeof middleware).toBe('function');
    });

    it('should track request metrics', () => {
      const middleware = performanceMonitor();
      const req = mockRequest();
      const res = mockResponse();
      
      // 调用中间件
      middleware(req, res, mockNext);
      
      // 验证 next 被调用
      expect(mockNext).toHaveBeenCalled();
      
      // 验证 res.send 被重写
      expect(res.send).not.toBe(mockResponse().send);
      
      // 调用重写后的 send 方法
      res.send!('test');
      
      // 获取性能统计
      const stats = getPerformanceStats();
      
      // 验证请求计数
      expect(stats.requestCount).toBe(1);
      expect(stats.errorCount).toBe(0);
    });
    
    it('should track error responses', () => {
      const middleware = performanceMonitor();
      const req = mockRequest();
      const res = mockResponse();
      res.statusCode = 500;
      
      middleware(req, res, mockNext);
      res.send!('error');
      
      const stats = getPerformanceStats();
      expect(stats.errorCount).toBe(1);
    });
  });
  
  describe('recordDbQueryLatency', () => {
    it('should record database query latency', () => {
      recordDbQueryLatency('find', 'users', 0.1);
      recordDbQueryLatency('find', 'users', 0.2);
      
      const stats = getPerformanceStats();
      expect(stats.dbLatency).toHaveProperty('find');
    });
  });
  
  describe('recordCacheHit and recordCacheMiss', () => {
    it('should record cache hits and misses', () => {
      recordCacheHit();
      recordCacheHit();
      recordCacheMiss();
      
      const stats = getPerformanceStats();
      expect(stats.cacheHitRatio).toBeCloseTo(0.67, 1);
    });
  });
  
  describe('recordDbConnection', () => {
    it('should record database connections', () => {
      recordDbConnection('mongodb', true);
      recordDbConnection('mongodb', true);
      recordDbConnection('mongodb', false);
      
      const stats = getPerformanceStats();
      expect(stats.activeConnections.mongodb).toBe(1);
    });
  });
  
  describe('resetPerformanceStats', () => {
    it('should reset all performance statistics', () => {
      // 添加一些数据
      recordCacheHit();
      recordDbQueryLatency('find', 'users', 0.1);
      recordDbConnection('mongodb', true);
      
      // 重置
      resetPerformanceStats();
      
      // 验证数据被重置
      const stats = getPerformanceStats();
      expect(stats.requestCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(Object.keys(stats.dbLatency)).toHaveLength(0);
    });
  });
}); 