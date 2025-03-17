import { RiskPatternAnalyzer } from '../../analyzer/RiskPatternAnalyzer';
import { NormalizedEvent, EventType } from '../../types/events';
import { EventDAO } from '../../database/dao/EventDAO';
import { AddressProfileDAO } from '../../database/dao/AddressProfileDAO';
import { logger } from '../../utils/logger';
import { TimeSeriesAnalyzer } from '../../analyzer/TimeSeriesAnalyzer';
import { MEVDetector } from '../../analyzer/MEVDetector';

// 模拟依赖
jest.mock('../../database/dao/EventDAO');
jest.mock('../../database/dao/AddressProfileDAO');
jest.mock('../../utils/logger');
jest.mock('../../analyzer/TimeSeriesAnalyzer');
jest.mock('../../analyzer/MEVDetector');

describe('RiskPatternAnalyzer', () => {
  let mockEvent: NormalizedEvent;
  let mockRecentEvents: NormalizedEvent[];

  beforeEach(() => {
    jest.clearAllMocks();

    // 模拟 logger 方法
    (logger.info as jest.Mock).mockImplementation(() => { });
    (logger.error as jest.Mock).mockImplementation(() => { });
    (logger.warn as jest.Mock).mockImplementation(() => { });

    // 准备测试数据
    mockEvent = {
      traceId: 'test-trace-id',
      chainId: 1,
      blockNumber: 12345678,
      transactionHash: '0xabcdef1234567890',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      value: '1000000000000000000', // 1 ETH
      timestamp: Math.floor(Date.now() / 1000),
      type: EventType.TRANSFER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 准备最近交易数据
    mockRecentEvents = Array(10)
      .fill(null)
      .map((_, i) => ({
        ...mockEvent,
        traceId: `test-trace-id-${i}`,
        transactionHash: `0xabcdef123456789${i}`,
        blockNumber: 12345678 - i,
        timestamp: mockEvent.timestamp - i * 600, // 每10分钟一笔交易
        value: `${1 + i}000000000000000000`, // 1-10 ETH
      }));

    // 模拟 EventDAO.findByAddress 方法
    (EventDAO.findByAddress as jest.Mock).mockResolvedValue(
      mockRecentEvents.map((event) => ({
        event,
        _id: `mock-id-${event.transactionHash}`,
      }))
    );

    // 模拟 AddressProfileDAO.findByAddress 方法
    (AddressProfileDAO.findByAddress as jest.Mock).mockResolvedValue({
      address: mockEvent.from,
      riskScore: 0.2,
      transactionCount: 100,
    });

    // 模拟 TimeSeriesAnalyzer.detectAnomalies 方法
    (TimeSeriesAnalyzer.detectAnomalies as jest.Mock).mockReturnValue(0.3);

    // 模拟 MEVDetector.detect 方法
    (MEVDetector.detect as jest.Mock).mockResolvedValue(false);
  });

  describe('evaluate', () => {
    it('should evaluate normal transaction pattern correctly', async () => {
      const result = await RiskPatternAnalyzer.evaluate(mockEvent);

      expect(result).toMatchObject({
        score: expect.any(Number),
        factors: expect.any(Array),
        confidence: expect.any(Number),
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(EventDAO.findByAddress).toHaveBeenCalledWith(mockEvent.from, 20);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should detect high frequency trading', async () => {
      // 模拟高频交易 (每10秒一笔)
      const highFrequencyEvents = mockRecentEvents.map((event, i) => ({
        ...event,
        timestamp: mockEvent.timestamp - i * 10,
      }));

      (EventDAO.findByAddress as jest.Mock).mockResolvedValue(
        highFrequencyEvents.map((event) => ({
          event,
          _id: `mock-id-${event.transactionHash}`,
        }))
      );

      // 模拟 analyzeTransactionFrequency 返回高分
      (AddressProfileDAO.findByAddress as jest.Mock).mockResolvedValue({
        address: mockEvent.from,
        riskScore: 0.2,
        transactionCount: 100,
      });

      const result = await RiskPatternAnalyzer.evaluate(mockEvent);

      expect(result.score).toBeGreaterThanOrEqual(0.2);
      expect(result.factors).toContain('high_frequency_trading');
    });

    it('should detect unusual value patterns', async () => {
      // 模拟异常金额模式 (当前交易金额是平均值的20倍)
      const normalValueEvents = mockRecentEvents.map((event) => ({
        ...event,
        value: '1000000000000000000', // 1 ETH
      }));

      // 当前交易金额设为20 ETH
      const largeValueEvent = {
        ...mockEvent,
        value: '20000000000000000000', // 20 ETH
      };

      (EventDAO.findByAddress as jest.Mock).mockResolvedValue(
        normalValueEvents.map((event) => ({
          event,
          _id: `mock-id-${event.transactionHash}`,
        }))
      );

      const result = await RiskPatternAnalyzer.evaluate(largeValueEvent);

      expect(result.score).toBeGreaterThanOrEqual(0.2);
      expect(result.factors).toContain('unusual_value_pattern');
    });

    it('should detect suspicious contract interactions', async () => {
      // 模拟频繁合约调用 (90% 的交易是合约调用)
      const contractCallEvents = mockRecentEvents.map((event) => ({
        ...event,
        type: EventType.CONTRACT_CALL,
        methodName: 'transfer',
      }));

      (EventDAO.findByAddress as jest.Mock).mockResolvedValue(
        contractCallEvents.map((event) => ({
          event,
          _id: `mock-id-${event.transactionHash}`,
        }))
      );

      const result = await RiskPatternAnalyzer.evaluate({
        ...mockEvent,
        type: EventType.CONTRACT_CALL,
      });

      expect(result.score).toBeGreaterThanOrEqual(0.2);
      expect(result.factors).toContain('suspicious_contract_interaction');
    });

    it('should detect MEV activity', async () => {
      // 模拟 MEV 行为
      (MEVDetector.detect as jest.Mock).mockResolvedValue(true);

      const result = await RiskPatternAnalyzer.evaluate(mockEvent);

      expect(result.score).toBeGreaterThanOrEqual(0.2);
      expect(result.factors).toContain('mev_activity');
      expect(MEVDetector.detect).toHaveBeenCalled();
    });

    it('should detect time series anomalies', async () => {
      // 模拟时间序列异常
      (TimeSeriesAnalyzer.detectAnomalies as jest.Mock).mockReturnValue(0.7);

      const result = await RiskPatternAnalyzer.evaluate(mockEvent);

      expect(result.score).toBeGreaterThanOrEqual(0.2);
      expect(result.factors).toContain('time_series_anomaly');
      expect(TimeSeriesAnalyzer.detectAnomalies).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // 模拟 EventDAO 抛出错误
      (EventDAO.findByAddress as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await RiskPatternAnalyzer.evaluate(mockEvent);

      expect(result.score).toBe(0.1);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty recent events', async () => {
      // 模拟没有最近交易
      (EventDAO.findByAddress as jest.Mock).mockResolvedValue([]);

      const result = await RiskPatternAnalyzer.evaluate(mockEvent);

      expect(result.score).toBeLessThanOrEqual(0.3);
      expect(result.confidence).toBeLessThan(0.6);
    });

    it('should combine multiple risk factors', async () => {
      // 模拟高频交易
      const highFrequencyEvents = mockRecentEvents.map((event, i) => ({
        ...event,
        timestamp: mockEvent.timestamp - i * 10,
        type: EventType.CONTRACT_CALL,
        methodName: 'transfer',
      }));

      (EventDAO.findByAddress as jest.Mock).mockResolvedValue(
        highFrequencyEvents.map((event) => ({
          event,
          _id: `mock-id-${event.transactionHash}`,
        }))
      );
      (TimeSeriesAnalyzer.detectAnomalies as jest.Mock).mockReturnValue(0.7);
      (MEVDetector.detect as jest.Mock).mockResolvedValue(true);

      const result = await RiskPatternAnalyzer.evaluate({
        ...mockEvent,
        type: EventType.CONTRACT_CALL,
      });

      expect(result.score).toBeGreaterThanOrEqual(0.2);
      expect(result.factors).toContain('high_frequency_trading');
      expect(result.factors).toContain('suspicious_contract_interaction');
      expect(result.factors).toContain('time_series_anomaly');
      expect(result.factors).toContain('mev_activity');
    });
  });
});
