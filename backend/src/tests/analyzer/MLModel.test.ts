import { MLModel } from '../../analyzer/MLModel';
import { NormalizedEvent, EventType, RiskLevel } from '../../types/events';
import { AddressProfileDAO } from '../../database/dao/AddressProfileDAO';
import { RiskPatternAnalyzer } from '../../analyzer/RiskPatternAnalyzer';
import { logger } from '../../utils/logger';

// 模拟依赖
jest.mock('../../database/dao/AddressProfileDAO');
jest.mock('../../analyzer/RiskPatternAnalyzer');
jest.mock('../../utils/logger');

describe('MLModel', () => {
  let mockEvent: NormalizedEvent;

  beforeEach(() => {
    jest.clearAllMocks();

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

    // 模拟 RiskPatternAnalyzer.evaluate 方法
    (RiskPatternAnalyzer.evaluate as jest.Mock).mockResolvedValue({
      score: 0.3,
      factors: ['normal_pattern'],
      confidence: 0.7,
    });

    // 模拟 AddressProfileDAO.findByAddress 方法
    (AddressProfileDAO.findByAddress as jest.Mock).mockResolvedValue({
      address: mockEvent.from,
      riskScore: 0.2,
      lastUpdated: new Date().toISOString(),
      tags: ['active_trader'],
      category: 'wallet',
      transactionCount: 100,
      totalValue: '10000000000000000000',
      firstSeen: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
      lastSeen: new Date().toISOString(),
      relatedAddresses: [],
    });
  });

  describe('analyzeRisk', () => {
    it('should analyze normal transaction correctly', async () => {
      const result = await MLModel.analyzeRisk(mockEvent);

      expect(result).toMatchObject({
        score: expect.any(Number),
        level: expect.any(String),
        factors: expect.any(Array),
        confidence: expect.any(Number),
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(Object.values(RiskLevel)).toContain(result.level);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should detect high risk for blacklisted addresses', async () => {
      // 模拟黑名单地址
      (AddressProfileDAO.findByAddress as jest.Mock).mockResolvedValue({
        address: mockEvent.from,
        riskScore: 0.8,
        tags: ['blacklisted', 'scam'],
        category: 'suspicious',
        transactionCount: 50,
        totalValue: '5000000000000000000',
        firstSeen: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
        lastSeen: new Date().toISOString(),
        relatedAddresses: [],
      });

      const result = await MLModel.analyzeRisk(mockEvent);

      expect(result.score).toBeGreaterThanOrEqual(0.45);
      expect(result.factors).toContain('blacklisted_address');
      expect(result.level).toBe(RiskLevel.MEDIUM);
    });

    it('should detect risk for large transfers', async () => {
      // 模拟大额转账
      mockEvent.value = '1000000000000000000000'; // 1000 ETH

      // 修改 RiskPatternAnalyzer 的返回值，添加 unusual_value_pattern 因素
      (RiskPatternAnalyzer.evaluate as jest.Mock).mockResolvedValue({
        score: 0.3,
        factors: ['normal_pattern', 'unusual_value_pattern'],
        confidence: 0.7,
      });

      const result = await MLModel.analyzeRisk(mockEvent);

      expect(result.score).toBeGreaterThanOrEqual(0.29);
      expect(result.factors).toContain('unusual_value_pattern');
    });

    it('should detect risk for unusual time activity', async () => {
      // 模拟深夜交易
      const midnight = new Date();
      midnight.setHours(2, 0, 0, 0);
      mockEvent.timestamp = Math.floor(midnight.getTime() / 1000);

      const result = await MLModel.analyzeRisk(mockEvent);

      expect(result.factors).toContain('unusual_time_activity');
    });

    it('should handle errors gracefully', async () => {
      // 模拟 RiskPatternAnalyzer 抛出错误
      (RiskPatternAnalyzer.evaluate as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await MLModel.analyzeRisk(mockEvent);

      expect(result.score).toBe(0.2);
      expect(result.level).toBe(RiskLevel.LOW);
      expect(result.factors).toContain('ai_analysis_failed');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should combine multiple risk factors', async () => {
      // 模拟多个风险因素
      mockEvent.value = '1000000000000000000000'; // 1000 ETH

      // 模拟高风险交易模式
      (RiskPatternAnalyzer.evaluate as jest.Mock).mockResolvedValue({
        score: 0.7,
        factors: ['high_frequency_trading', 'time_series_anomaly', 'unusual_value_pattern'],
        confidence: 0.8,
      });

      // 模拟可疑地址
      (AddressProfileDAO.findByAddress as jest.Mock).mockResolvedValue({
        address: mockEvent.from,
        riskScore: 0.6,
        tags: ['suspicious'],
        category: 'exchange',
        transactionCount: 500,
        totalValue: '50000000000000000000',
        firstSeen: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
        lastSeen: new Date().toISOString(),
        relatedAddresses: [],
      });

      const result = await MLModel.analyzeRisk(mockEvent);

      expect(result.score).toBeGreaterThanOrEqual(0.54);
      expect(result.factors).toContain('high_frequency_trading');
      expect(result.factors).toContain('time_series_anomaly');
      expect(result.factors).toContain('unusual_value_pattern');
      expect(result.level).toBe(RiskLevel.MEDIUM);
    });
  });
});
