import { jest } from '@jest/globals';
import { Request, Response } from 'express';
import app from '../../api/server';
import { RiskLevel } from '../../types/events';

// 模拟Express的request和response对象
const mockRequest = () => {
  const req: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {}
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
  return res as Response;
};

// 模拟EventPipeline
jest.mock('../../pipeline/eventPipeline', () => {
  return {
    EventPipeline: jest.fn().mockImplementation(() => {
      return {
        processEvent: jest.fn().mockImplementation((event) => {
          if (!event || !event.transactionHash) {
            throw new Error('Invalid event');
          }
          
          // 模拟高风险交易
          if (event.transactionHash === 'high_risk_tx') {
            return {
              score: 0.85,
              level: RiskLevel.HIGH,
              factors: ['suspicious_pattern', 'known_malicious_address']
            };
          }
          
          // 模拟中风险交易
          if (event.transactionHash === 'medium_risk_tx') {
            return {
              score: 0.55,
              level: RiskLevel.MEDIUM,
              factors: ['unusual_pattern']
            };
          }
          
          // 模拟数据库错误
          if (event.transactionHash === 'db_error_tx') {
            throw new Error('Database error');
          }
          
          // 模拟正常交易
          return {
            score: 0.2,
            level: RiskLevel.LOW,
            factors: []
          };
        })
      };
    })
  };
});

// 模拟pipelineConfig
jest.mock('../../pipeline/pipelineConfig', () => {
  return {
    loadConfig: jest.fn().mockResolvedValue({
      monitoring: {
        enabled: true,
        metricsPort: 9090,
        metricsInterval: 15,
        metricsPrefix: 'test',
        metricsBuckets: [0.1, 0.5, 1, 2, 5],
        webhooks: {}
      },
      notification: {
        riskThresholds: {
          medium: 0.4,
          high: 0.7,
          critical: 0.9
        },
        channels: {
          low: [],
          medium: ['slack'],
          high: ['slack', 'dingtalk'],
          critical: ['slack', 'dingtalk', 'feishu']
        }
      },
      profile: {
        apiUrl: 'http://localhost:3000',
        batchSize: 10,
        cacheTTL: 3600,
        fetchRetries: 3,
        fetchTimeout: 15000,
        forceRefreshRiskScore: 0.8,
        maxRetryDelay: 5000,
        minRetryDelay: 1000
      },
      ai: {
        mode: 'api',
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
        localModelPath: undefined
      },
      logging: {
        level: 'info',
        format: 'json',
        timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
      },
      maxRetries: 3,
      retryDelay: 1000
    })
  };
});

describe('API Endpoints', () => {
  // 在所有测试之前初始化
  beforeAll(async () => {
    // 确保app已经初始化
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  // 在每个测试前重置模拟
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('should return 200 and status ok', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/health')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String)
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      // 移除时间戳以便快照比较
      const { timestamp, ...snapshotData } = responseData;
      expect(snapshotData).toMatchSnapshot();
    });
  });

  describe('Transaction Analysis', () => {
    test('should analyze a transaction successfully', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transaction: {
          transactionHash: 'test_tx_hash',
          from: '0x123',
          to: '0x456',
          value: '1000000000000000000',
          chainId: 1
        }
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionHash: 'test_tx_hash',
          riskScore: expect.any(Number),
          riskLevel: expect.any(String),
          timestamp: expect.any(String)
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      // 移除时间戳以便快照比较
      const { timestamp, ...snapshotData } = responseData;
      expect(snapshotData).toMatchSnapshot();
    });

    test('should return 400 for missing transaction data', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {};
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing transaction data'
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    test('should return 400 for missing required parameters', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transaction: {
          // 缺少必要参数
          chainId: 1
        }
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required transaction parameters'
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    test('should handle high risk transactions', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transaction: {
          transactionHash: 'high_risk_tx',
          from: '0x123',
          to: '0x456',
          value: '1000000000000000000',
          chainId: 1
        }
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          riskScore: 0.85,
          riskLevel: RiskLevel.HIGH,
          riskFactors: expect.arrayContaining(['suspicious_pattern', 'known_malicious_address'])
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      // 移除时间戳以便快照比较
      const { timestamp, ...snapshotData } = responseData;
      expect(snapshotData).toMatchSnapshot();
    });
    
    test('should handle medium risk transactions', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transaction: {
          transactionHash: 'medium_risk_tx',
          from: '0x123',
          to: '0x456',
          value: '1000000000000000000',
          chainId: 1
        }
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          riskScore: 0.55,
          riskLevel: RiskLevel.MEDIUM,
          riskFactors: expect.arrayContaining(['unusual_pattern'])
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      // 移除时间戳以便快照比较
      const { timestamp, ...snapshotData } = responseData;
      expect(snapshotData).toMatchSnapshot();
    });
    
    test('should handle database errors gracefully', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transaction: {
          transactionHash: 'db_error_tx',
          from: '0x123',
          to: '0x456',
          value: '1000000000000000000',
          chainId: 1
        }
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to analyze transaction',
          message: 'Database error'
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });
  });

  describe('Batch Analysis', () => {
    test('should analyze multiple transactions', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transactions: [
          {
            transactionHash: 'test_tx_hash',
            from: '0x123',
            to: '0x456',
            value: '1000000000000000000',
            chainId: 1
          },
          {
            transactionHash: 'high_risk_tx',
            from: '0x789',
            to: '0xabc',
            value: '5000000000000000000',
            chainId: 1
          },
          {
            transactionHash: 'medium_risk_tx',
            from: '0xdef',
            to: '0xghi',
            value: '2000000000000000000',
            chainId: 1
          }
        ]
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze/batch')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              transactionHash: 'test_tx_hash',
              success: true
            }),
            expect.objectContaining({
              transactionHash: 'high_risk_tx',
              riskLevel: RiskLevel.HIGH,
              success: true
            }),
            expect.objectContaining({
              transactionHash: 'medium_risk_tx',
              riskLevel: RiskLevel.MEDIUM,
              success: true
            })
          ]),
          timestamp: expect.any(String)
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      // 移除时间戳以便快照比较
      const { timestamp, ...snapshotData } = responseData;
      expect(snapshotData).toMatchSnapshot();
    });

    test('should return 400 for empty transactions array', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transactions: []
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze/batch')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing or invalid transactions array'
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    test('should handle individual transaction errors in batch', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transactions: [
          {
            // 缺少必要参数
            chainId: 1
          },
          {
            transactionHash: 'valid_tx',
            from: '0x123',
            to: '0x456',
            value: '1000000000000000000',
            chainId: 1
          },
          {
            transactionHash: 'db_error_tx',
            from: '0x789',
            to: '0xabc',
            value: '5000000000000000000',
            chainId: 1
          }
        ]
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze/batch')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              error: 'Missing required transaction parameters',
              success: false
            }),
            expect.objectContaining({
              transactionHash: 'valid_tx',
              success: true
            }),
            expect.objectContaining({
              transactionHash: 'db_error_tx',
              error: 'Database error',
              success: false
            })
          ])
        })
      );
      
      // 快照测试
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      // 移除时间戳以便快照比较
      const { timestamp, ...snapshotData } = responseData;
      expect(snapshotData).toMatchSnapshot();
    });
    
    test('should handle batch processing with partial failures', async () => {
      // 模拟请求和响应
      const req = mockRequest();
      req.body = {
        transactions: [
          {
            transactionHash: 'test_tx_hash',
            from: '0x123',
            to: '0x456',
            value: '1000000000000000000',
            chainId: 1
          },
          {
            transactionHash: 'db_error_tx',
            from: '0x789',
            to: '0xabc',
            value: '5000000000000000000',
            chainId: 1
          },
          {
            transactionHash: 'high_risk_tx',
            from: '0xdef',
            to: '0xghi',
            value: '10000000000000000000',
            chainId: 1
          }
        ]
      };
      const res = mockResponse();
      
      // 直接调用路由处理函数
      await app._router.stack
        .filter(layer => layer.route && layer.route.path === '/analyze/batch')
        .forEach(layer => layer.route.stack[0].handle(req, res));
      
      expect(res.status).toHaveBeenCalledWith(200);
      
      // 验证结果包含成功和失败的交易
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      const results = responseData.results;
      
      // 验证成功的交易
      const successfulTxs = results.filter((r: any) => r.success);
      expect(successfulTxs.length).toBe(2);
      
      // 验证失败的交易
      const failedTxs = results.filter((r: any) => !r.success);
      expect(failedTxs.length).toBe(1);
      expect(failedTxs[0].error).toBe('Database error');
      
      // 快照测试
      // 移除时间戳以便快照比较
      const { timestamp, ...snapshotData } = responseData;
      expect(snapshotData).toMatchSnapshot();
    });
  });
});
