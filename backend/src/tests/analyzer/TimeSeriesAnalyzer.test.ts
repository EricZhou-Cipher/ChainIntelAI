import { TimeSeriesAnalyzer } from '../../analyzer/TimeSeriesAnalyzer';
import { NormalizedEvent, EventType } from '../../types/events';

describe('TimeSeriesAnalyzer', () => {
  // 创建模拟事件
  const createMockEvent = (
    hash: string,
    from: string,
    to: string,
    value: string,
    timestamp: number,
    type: EventType = EventType.TRANSFER
  ): NormalizedEvent => ({
    traceId: hash,
    transactionHash: hash,
    chainId: 1,
    from,
    to,
    value,
    timestamp,
    blockNumber: 12345678,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
    params: {},
  });

  describe('detectAnomalies', () => {
    it('should return 0 for empty events array', () => {
      const result = TimeSeriesAnalyzer.detectAnomalies([]);
      expect(result).toBe(0);
    });

    it('should return 0 for single event', () => {
      const event = createMockEvent(
        '0x1234',
        '0xuser1',
        '0xuser2',
        '1.0',
        1000
      );
      
      const result = TimeSeriesAnalyzer.detectAnomalies([event]);
      expect(result).toBe(0);
    });

    it('should detect normal transaction pattern with low score', () => {
      // 创建均匀分布的交易
      const events = [
        createMockEvent('0x1111', '0xuser1', '0xuser2', '1.0', 1000),
        createMockEvent('0x2222', '0xuser3', '0xuser4', '1.5', 1100),
        createMockEvent('0x3333', '0xuser5', '0xuser6', '2.0', 1200),
        createMockEvent('0x4444', '0xuser7', '0xuser8', '1.2', 1300),
        createMockEvent('0x5555', '0xuser9', '0xuser10', '1.8', 1400),
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 正常模式应该得到较低的分数
      expect(result).toBeLessThan(0.5);
    });

    it('should detect sudden spike in transaction volume', () => {
      // 创建交易量突然增加的模式
      const events = [
        createMockEvent('0x1111', '0xuser1', '0xuser2', '1.0', 1000),
        createMockEvent('0x2222', '0xuser3', '0xuser4', '1.5', 1100),
        createMockEvent('0x3333', '0xuser5', '0xuser6', '50.0', 1200), // 突然的大额交易
        createMockEvent('0x4444', '0xuser7', '0xuser8', '1.2', 1300),
        createMockEvent('0x5555', '0xuser9', '0xuser10', '1.8', 1400),
        createMockEvent('0x6666', '0xuser11', '0xuser12', '2.0', 1500),
        createMockEvent('0x7777', '0xuser13', '0xuser14', '1.5', 1600),
        createMockEvent('0x8888', '0xuser15', '0xuser16', '1.7', 1700),
        createMockEvent('0x9999', '0xuser17', '0xuser18', '1.9', 1800),
        createMockEvent('0xaaaa', '0xuser19', '0xuser20', '2.1', 1900),
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 突然的交易量增加应该得到较高的分数
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should detect unusual transaction frequency', () => {
      // 创建交易频率异常的模式
      const events = [
        createMockEvent('0x1111', '0xuser1', '0xuser2', '1.0', 1000),
        createMockEvent('0x2222', '0xuser3', '0xuser4', '1.5', 1100),
        createMockEvent('0x3333', '0xuser5', '0xuser6', '2.0', 1101), // 几乎同时的交易
        createMockEvent('0x4444', '0xuser7', '0xuser8', '1.2', 1102), // 几乎同时的交易
        createMockEvent('0x5555', '0xuser9', '0xuser10', '1.8', 1103), // 几乎同时的交易
        createMockEvent('0x6666', '0xuser11', '0xuser12', '1.3', 1500),
        createMockEvent('0x7777', '0xuser13', '0xuser14', '1.5', 1600),
        createMockEvent('0x8888', '0xuser15', '0xuser16', '1.7', 1700),
        createMockEvent('0x9999', '0xuser17', '0xuser18', '1.9', 1800),
        createMockEvent('0xaaaa', '0xuser19', '0xuser20', '2.1', 1900),
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 异常的交易频率应该得到较高的分数
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should detect unusual transaction value pattern', () => {
      // 创建交易金额异常的模式
      const events = [
        createMockEvent('0x1111', '0xuser1', '0xuser2', '1.0', 1000),
        createMockEvent('0x2222', '0xuser3', '0xuser4', '1.5', 1100),
        createMockEvent('0x3333', '0xuser5', '0xuser6', '100.0', 1200), // 异常大额
        createMockEvent('0x4444', '0xuser7', '0xuser8', '0.001', 1300), // 异常小额
        createMockEvent('0x5555', '0xuser9', '0xuser10', '200.0', 1400), // 异常大额
        createMockEvent('0x6666', '0xuser11', '0xuser12', '1.3', 1500),
        createMockEvent('0x7777', '0xuser13', '0xuser14', '1.5', 1600),
        createMockEvent('0x8888', '0xuser15', '0xuser16', '1.7', 1700),
        createMockEvent('0x9999', '0xuser17', '0xuser18', '1.9', 1800),
        createMockEvent('0xaaaa', '0xuser19', '0xuser20', '2.1', 1900),
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 异常的交易金额模式应该得到较高的分数
      expect(result).toBeGreaterThanOrEqual(0.6);
    });

    it('should detect cyclic transaction pattern', () => {
      // 创建循环交易模式
      const user1 = '0xuser1';
      const user2 = '0xuser2';
      
      const events = [
        createMockEvent('0x1111', user1, user2, '1.0', 1000),
        createMockEvent('0x2222', user2, user1, '1.0', 1100),
        createMockEvent('0x3333', user1, user2, '1.0', 1200),
        createMockEvent('0x4444', user2, user1, '1.0', 1300),
        createMockEvent('0x5555', user1, user2, '1.0', 1400),
        createMockEvent('0x6666', user2, user1, '1.0', 1500),
        createMockEvent('0x7777', user1, user2, '1.0', 1600),
        createMockEvent('0x8888', user2, user1, '1.0', 1700),
        createMockEvent('0x9999', user1, user2, '1.0', 1800),
        createMockEvent('0xaaaa', user2, user1, '1.0', 1900),
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 循环交易模式应该得到较高的分数
      expect(result).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect wash trading pattern', () => {
      // 创建洗盘交易模式（同一地址反复交易）
      const user1 = '0xuser1';
      const user2 = '0xuser2';
      
      const events = [
        createMockEvent('0x1111', user1, user2, '1.0', 1000),
        createMockEvent('0x2222', user2, user1, '1.0', 1010),
        createMockEvent('0x3333', user1, user2, '1.0', 1020),
        createMockEvent('0x4444', user2, user1, '1.0', 1030),
        createMockEvent('0x5555', user1, user2, '1.0', 1040),
        createMockEvent('0x6666', user2, user1, '1.0', 1050),
        createMockEvent('0x7777', user1, user2, '1.0', 1060),
        createMockEvent('0x8888', user2, user1, '1.0', 1070),
        createMockEvent('0x9999', user1, user2, '1.0', 1080),
        createMockEvent('0xaaaa', user2, user1, '1.0', 1090),
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 洗盘交易模式应该得到很高的分数
      expect(result).toBeGreaterThanOrEqual(0.8);
    });

    it('should handle mixed transaction patterns', () => {
      // 创建混合交易模式
      const events = [
        createMockEvent('0x1111', '0xuser1', '0xuser2', '1.0', 1000),
        createMockEvent('0x2222', '0xuser3', '0xuser4', '1.5', 1100),
        createMockEvent('0x3333', '0xuser1', '0xuser2', '1.2', 1200), // 重复地址对
        createMockEvent('0x4444', '0xuser5', '0xuser6', '10.0', 1300), // 较大金额
        createMockEvent('0x5555', '0xuser7', '0xuser8', '1.8', 1400),
        createMockEvent('0x6666', '0xuser1', '0xuser2', '1.5', 1500), // 再次重复
        createMockEvent('0x7777', '0xuser2', '0xuser1', '1.7', 1600), // 反向交易
        createMockEvent('0x8888', '0xuser9', '0xuser10', '1.9', 1700),
        createMockEvent('0x9999', '0xuser1', '0xuser2', '2.0', 1800), // 再次重复
        createMockEvent('0xaaaa', '0xuser2', '0xuser1', '2.1', 1900), // 再次反向
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 混合模式应该得到中等的分数
      expect(result).toBeGreaterThanOrEqual(0.3);
      expect(result).toBeLessThanOrEqual(0.8);
    });

    it('should analyze time intervals between transactions', () => {
      // 创建时间间隔不均匀的交易
      const events = [
        createMockEvent('0x1111', '0xuser1', '0xuser2', '1.0', 1000),
        createMockEvent('0x2222', '0xuser3', '0xuser4', '1.5', 1010), // 短间隔
        createMockEvent('0x3333', '0xuser5', '0xuser6', '2.0', 1020), // 短间隔
        createMockEvent('0x4444', '0xuser7', '0xuser8', '1.2', 1500), // 长间隔
        createMockEvent('0x5555', '0xuser9', '0xuser10', '1.8', 1510), // 短间隔
        createMockEvent('0x6666', '0xuser11', '0xuser12', '1.3', 1520), // 短间隔
        createMockEvent('0x7777', '0xuser13', '0xuser14', '1.5', 2000), // 长间隔
        createMockEvent('0x8888', '0xuser15', '0xuser16', '1.7', 2010), // 短间隔
        createMockEvent('0x9999', '0xuser17', '0xuser18', '1.9', 2020), // 短间隔
        createMockEvent('0xaaaa', '0xuser19', '0xuser20', '2.1', 2500), // 长间隔
      ];
      
      const result = TimeSeriesAnalyzer.detectAnomalies(events);
      
      // 时间间隔不均匀应该得到中等的分数
      expect(result).toBeGreaterThanOrEqual(0.4);
    });
  });
}); 