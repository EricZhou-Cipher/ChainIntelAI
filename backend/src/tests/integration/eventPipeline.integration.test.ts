import { EventPipeline } from '../../pipeline/eventPipeline';
import { EventNormalizer } from '../../pipeline/eventNormalizer';
import { PipelineMonitor } from '../../pipeline/pipelineMonitor';
import { NotificationRouter } from '../../notifier/notificationRouter';
import { riskAnalyzer } from '../../analyzer/riskAnalyzer';
import { addressProfiler } from '../../profiling/addressProfiler';
import { defaultConfig } from '../../pipeline/pipelineConfig';
import { RiskLevel } from '../../types/events';
import { createMockEvent, createMockProfile } from '../utils/testHelpers';

// 设置测试环境
process.env.NODE_ENV = 'test';

// 创建默认的模拟配置文件
const mockProfile = createMockProfile({
  address: '0xabcdef1234567890abcdef1234567890abcdef12',
  riskScore: 0.1,
  tags: [],
});

// 创建默认的风险分析结果
const defaultRiskAnalysis = {
  score: 0.5,
  level: RiskLevel.MEDIUM,
  factors: ['test factor'],
  features: [],
  timestamp: Date.now(),
  action: 'monitor',
  aiAnalysis: {
    behaviorAnalysis: {
      pattern: 'normal',
      confidence: 0.8,
      details: {}
    },
    graphAnalysis: {
      centrality: 0.5,
      degree: 2,
      clustering: 0.3,
      paths: []
    },
    summary: '风险分析摘要'
  },
  combinations: []
};

// 模拟依赖
jest.mock('../../pipeline/eventNormalizer');
jest.mock('../../pipeline/pipelineMonitor');
jest.mock('../../analyzer/riskAnalyzer');
jest.mock('../../notifier/notificationRouter');
jest.mock('../../profiling/addressProfiler');

describe('EventPipeline Integration Tests', () => {
  let pipeline: EventPipeline;
  let normalizer: jest.Mocked<EventNormalizer>;
  let monitor: jest.Mocked<PipelineMonitor>;
  let notifier: jest.Mocked<NotificationRouter>;
  let mockLogger: any;

  beforeEach(() => {
    // 重置环境变量
    process.env.NODE_ENV = 'test';
    
    // 创建模拟日志记录器
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setTraceId: jest.fn(),
      getTraceId: jest.fn().mockReturnValue('test-trace-id'),
      setDefaultContext: jest.fn(),
    };
    
    // 创建模拟组件
    normalizer = new EventNormalizer(mockLogger) as jest.Mocked<EventNormalizer>;
    monitor = new PipelineMonitor(defaultConfig, mockLogger) as jest.Mocked<PipelineMonitor>;
    notifier = new NotificationRouter() as jest.Mocked<NotificationRouter>;
    
    // 模拟 normalizer.normalizeEvent 方法
    normalizer.normalizeEvent = jest.fn().mockImplementation((chainId, event) => {
      if (!event) throw new Error('Invalid event');
      
      return Promise.resolve(createMockEvent({
        chainId: event.chainId || chainId || 1,
        transactionHash: event.transactionHash || '0x123',
        from: event.from || '0xabcdef1234567890abcdef1234567890abcdef12',
        to: event.to || '0xdefabc1234567890defabc1234567890defabc12',
        value: event.value || '1000000000000000000', // 1 ETH
        timestamp: event.blockTimestamp || Math.floor(Date.now() / 1000),
        raw: event
      }));
    });
    
    // 模拟 monitor 方法
    monitor.recordEvent = jest.fn().mockResolvedValue(undefined);
    monitor.recordRiskLevel = jest.fn().mockResolvedValue(undefined);
    monitor.recordProfileLatency = jest.fn().mockResolvedValue(undefined);
    monitor.recordRiskAnalysisLatency = jest.fn().mockResolvedValue(undefined);
    monitor.recordNotificationLatency = jest.fn().mockResolvedValue(undefined);
    monitor.recordError = jest.fn().mockResolvedValue(undefined);
    
    // 模拟 addressProfiler.getProfile 方法 - 确保始终返回有效的配置文件
    (addressProfiler.getProfile as jest.Mock) = jest.fn().mockResolvedValue(mockProfile);
    
    // 模拟 riskAnalyzer.analyze 方法 - 确保始终返回有效的风险分析结果
    (riskAnalyzer.analyze as jest.Mock) = jest.fn().mockResolvedValue(defaultRiskAnalysis);
    
    // 模拟 NotificationRouter.send 方法
    NotificationRouter.send = jest.fn().mockResolvedValue(undefined);
    
    // 创建 pipeline 实例
    pipeline = new EventPipeline(defaultConfig, mockLogger);
    
    // 设置内部属性
    (pipeline as any).normalizer = normalizer;
    (pipeline as any).monitor = monitor;
    (pipeline as any).notifier = notifier;
  });

  describe('End-to-End Transaction Processing', () => {
    it('should process a normal transaction end-to-end', async () => {
      // 创建普通交易事件
      const event = {
        blockTimestamp: 1678901234,
        transactionHash: '0x123',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xdefabc1234567890defabc1234567890defabc12',
        value: '1000000000000000000', // 1 ETH
        chainId: 1
      };
      
      // 处理事件
      await expect(pipeline.processEvent(event)).resolves.not.toThrow();
      
      // 验证流程
      expect(normalizer.normalizeEvent).toHaveBeenCalledWith(1, event);
      expect(addressProfiler.getProfile).toHaveBeenCalledTimes(2); // from 和 to 地址
      expect(riskAnalyzer.analyze).toHaveBeenCalled();
      expect(monitor.recordEvent).toHaveBeenCalledWith('event_received', expect.any(String));
      expect(monitor.recordEvent).toHaveBeenCalledWith('event_normalized', expect.any(String));
      expect(monitor.recordEvent).toHaveBeenCalledWith('risk_analyzed', expect.any(String));
      
      // 调试信息
      console.log('Debug: Normal transaction processed successfully');
    });
    
    it('should process a high-risk transaction and trigger notification', async () => {
      // 创建高风险交易事件
      const event = {
        blockTimestamp: 1678901234,
        transactionHash: '0x456',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xdefabc1234567890defabc1234567890defabc12',
        value: '100000000000000000000', // 100 ETH
        chainId: 1
      };
      
      // 模拟高风险分析结果
      (riskAnalyzer.analyze as jest.Mock).mockResolvedValueOnce({
        score: 0.9,
        level: RiskLevel.CRITICAL,
        factors: ['suspicious_activity', 'large_transfer'],
        features: [],
        timestamp: Date.now(),
        action: 'alert',
        aiAnalysis: {
          behaviorAnalysis: {
            pattern: 'suspicious',
            confidence: 0.9,
            details: {}
          },
          graphAnalysis: {
            centrality: 0.8,
            degree: 5,
            clustering: 0.7,
            paths: []
          },
          summary: '高风险交易'
        },
        combinations: []
      });
      
      // 模拟可疑地址资料
      (addressProfiler.getProfile as jest.Mock).mockResolvedValue(createMockProfile({
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        riskScore: 0.8,
        tags: ['suspicious'],
      }));
      
      // 处理事件
      await expect(pipeline.processEvent(event)).resolves.not.toThrow();
      
      // 验证流程
      expect(normalizer.normalizeEvent).toHaveBeenCalledWith(1, event);
      expect(addressProfiler.getProfile).toHaveBeenCalledTimes(2);
      expect(riskAnalyzer.analyze).toHaveBeenCalled();
      expect(NotificationRouter.send).toHaveBeenCalled();
      expect(monitor.recordRiskLevel).toHaveBeenCalledWith(RiskLevel.CRITICAL);
      
      // 调试信息
      console.log('Debug: High-risk transaction processed successfully');
    });
    
    it('should handle incomplete transaction data gracefully', async () => {
      // 创建不完整的交易事件
      const incompleteEvent = {
        transactionHash: '0x789',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        // 缺少 to 和 value
        chainId: 1
      };
      
      // 处理事件
      await expect(pipeline.processEvent(incompleteEvent)).resolves.not.toThrow();
      
      // 验证流程
      expect(normalizer.normalizeEvent).toHaveBeenCalledWith(1, incompleteEvent);
      expect(addressProfiler.getProfile).toHaveBeenCalled();
      expect(riskAnalyzer.analyze).toHaveBeenCalled();
      
      // 调试信息
      console.log('Debug: Incomplete transaction data handled gracefully');
    });
    
    it('should handle null risk analysis result gracefully', async () => {
      // 创建交易事件
      const event = {
        blockTimestamp: 1678901234,
        transactionHash: '0xabc',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xdefabc1234567890defabc1234567890defabc12',
        value: '1000000000000000000', // 1 ETH
        chainId: 1
      };
      
      // 模拟 riskAnalyzer.analyze 返回 null
      (riskAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(null);
      
      // 处理事件
      await expect(pipeline.processEvent(event)).resolves.not.toThrow();
      
      // 验证流程
      expect(normalizer.normalizeEvent).toHaveBeenCalledWith(1, event);
      expect(addressProfiler.getProfile).toHaveBeenCalled();
      expect(riskAnalyzer.analyze).toHaveBeenCalled();
      
      // 调试信息
      console.log('Debug: Null risk analysis result handled gracefully');
    });
  });
  
  describe('Concurrency and Performance', () => {
    it('should handle multiple transactions concurrently', async () => {
      // 创建多个交易事件
      const events = Array(10).fill(0).map((_, i) => ({
        blockTimestamp: 1678901234 + i,
        transactionHash: `0x${i}`,
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xdefabc1234567890defabc1234567890defabc12',
        value: '1000000000000000000', // 1 ETH
        chainId: 1
      }));
      
      // 并发处理事件
      await expect(Promise.all(events.map(event => pipeline.processEvent(event)))).resolves.not.toThrow();
      
      // 验证流程
      expect(normalizer.normalizeEvent).toHaveBeenCalledTimes(10);
      expect(addressProfiler.getProfile).toHaveBeenCalledTimes(20); // 10个事件，每个事件2个地址
      expect(riskAnalyzer.analyze).toHaveBeenCalledTimes(10);
      
      // 调试信息
      console.log('Debug: Multiple transactions processed concurrently');
    });
    
    it('should handle database write failures gracefully', async () => {
      // 创建交易事件
      const event = {
        blockTimestamp: 1678901234,
        transactionHash: '0xabc',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xdefabc1234567890defabc1234567890defabc12',
        value: '1000000000000000000', // 1 ETH
        chainId: 1
      };
      
      // 模拟数据库写入失败
      (monitor.recordEvent as jest.Mock).mockRejectedValueOnce(new Error('Database write failed'));
      
      // 处理事件
      await expect(pipeline.processEvent(event)).resolves.not.toThrow();
      
      // 验证流程
      expect(mockLogger.error).toHaveBeenCalled();
      expect(monitor.recordError).toHaveBeenCalled();
      
      // 调试信息
      console.log('Debug: Database write failure handled gracefully');
    });
    
    it('should handle address profiling failures gracefully', async () => {
      // 创建交易事件
      const event = {
        blockTimestamp: 1678901234,
        transactionHash: '0xdef',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xdefabc1234567890defabc1234567890defabc12',
        value: '1000000000000000000', // 1 ETH
        chainId: 1
      };
      
      // 模拟地址资料获取失败，但确保第二次调用成功
      (addressProfiler.getProfile as jest.Mock)
        .mockRejectedValueOnce(new Error('Profile fetch failed'))
        .mockResolvedValueOnce(mockProfile);
      
      // 处理事件
      await expect(pipeline.processEvent(event)).resolves.not.toThrow();
      
      // 验证流程
      expect(mockLogger.error).toHaveBeenCalled();
      expect(riskAnalyzer.analyze).toHaveBeenCalled(); // 应该继续分析
      
      // 调试信息
      console.log('Debug: Address profiling failure handled gracefully');
    });
    
    it('should handle risk analyzer failures gracefully', async () => {
      // 创建交易事件
      const event = {
        blockTimestamp: 1678901234,
        transactionHash: '0xdef',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xdefabc1234567890defabc1234567890defabc12',
        value: '1000000000000000000', // 1 ETH
        chainId: 1
      };
      
      // 模拟风险分析失败
      (riskAnalyzer.analyze as jest.Mock).mockRejectedValueOnce(new Error('Risk analysis failed'));
      
      // 处理事件
      await expect(pipeline.processEvent(event)).resolves.not.toThrow();
      
      // 验证流程
      expect(mockLogger.error).toHaveBeenCalled();
      
      // 调试信息
      console.log('Debug: Risk analyzer failure handled gracefully');
    });
  });
}); 