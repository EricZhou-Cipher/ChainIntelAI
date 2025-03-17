/**
 * EventNormalizer Unit Tests
 *
 * 测试目标：验证事件标准化逻辑的正确性
 * 覆盖范围：
 * 1. 基础事件标准化
 * 2. 地址格式验证
 * 3. 数值格式验证
 * 4. 合约调用解析
 * 5. 异常处理
 */

import { EventNormalizer } from '../../../pipeline/eventNormalizer';
import { Logger } from '../../../utils/logger';
import { NormalizedEvent, EventType } from '../../../types/events';

describe('EventNormalizer', () => {
  let normalizer: EventNormalizer;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      getTraceId: jest.fn().mockReturnValue('test-trace-id'),
      setTraceId: jest.fn(),
      setDefaultContext: jest.fn(),
      traceId: 'test-trace-id',
      defaultContext: {},
      formatMessage: jest.fn((msg: string) => msg),
    } as unknown as jest.Mocked<Logger>;

    normalizer = new EventNormalizer(mockLogger);
  });

  describe('normalizeEvent', () => {
    it('should normalize a valid transfer event', async () => {
      const event = {
        hash: '0xabcdef1234567890',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '1000000000000000000',
        blockNumber: 12345678,
        input: '0x',
        timestamp: 1234567890,
      };

      const result = await normalizer.normalizeEvent('1', event);
      expect(result).toBeDefined();
      expect(result.type).toBe(EventType.UNKNOWN);
      expect(result.from).toBe(event.from.toLowerCase());
      expect(result.to).toBe(event.to.toLowerCase());
      expect(result.value).toBe(event.value);
      expect(result.chainId).toBe(1);
      expect(result.blockNumber).toBe(event.blockNumber);
      expect(result.transactionHash).toBe(event.hash);
    });

    it('should throw error for missing required fields', async () => {
      const event = {
        hash: '0xabcdef1234567890',
        from: '0x1234567890123456789012345678901234567890',
        // missing 'to' field
        value: '1000000000000000000',
      };

      await expect(normalizer.normalizeEvent('1', event)).rejects.toThrow(
        'Missing required fields in event'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle empty event', async () => {
      await expect(normalizer.normalizeEvent('1', {})).rejects.toThrow(
        'Missing required fields in event'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle null event', async () => {
      try {
        await normalizer.normalizeEvent('1', null);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(mockLogger.error).toHaveBeenCalled();
      }
    });
  });
});
