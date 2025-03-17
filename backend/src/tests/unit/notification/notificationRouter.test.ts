import { NotificationRouter, NotificationParams } from '../../../notifier/notificationRouter';
import { logger } from '../../../utils/logger';
import { NormalizedEvent, EventType, RiskLevel, RiskAnalysis } from '../../../types/events';

jest.mock('../../../utils/logger');

describe('NotificationRouter', () => {
  let router: NotificationRouter;

  beforeEach(() => {
    router = new NotificationRouter();
    (logger.error as jest.Mock).mockClear();
    (logger.info as jest.Mock).mockClear();
    (logger.warn as jest.Mock).mockClear();
  });

  describe('route', () => {
    const mockEvent: NormalizedEvent = {
      traceId: '0x123',
      type: EventType.TRANSFER,
      chainId: 1,
      blockNumber: 12345678,
      transactionHash: '0x123',
      from: '0xabc',
      to: '0xdef',
      value: '1000000000000000000', // 1 ETH
      timestamp: Math.floor(Date.now() / 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRiskAnalysis: RiskAnalysis = {
      score: 0.85,
      level: RiskLevel.HIGH,
      factors: ['Large amount', 'New address'],
      features: [
        { description: 'Amount', score: 0.7 },
        { description: 'Address age', score: 0.8 },
        { description: 'Behavior', score: 0.9 },
        { description: 'Contract', score: 0.6 },
      ],
      details: {
        amountScore: 0.7,
        historyScore: 0.8,
        behaviorScore: 0.9,
        contractScore: 0.6,
      },
    };

    it('should route high risk event correctly', async () => {
      const params: NotificationParams = {
        event: mockEvent,
        riskAnalysis: mockRiskAnalysis,
        channels: ['telegram', 'discord', 'email'],
        traceId: 'test-trace-id',
      };

      await router.route(params);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('通知发送成功'),
        expect.any(Object)
      );
    });

    it('should handle batch operations', async () => {
      const params: NotificationParams = {
        event: {
          ...mockEvent,
          metadata: { batchOperation: true },
        },
        riskAnalysis: mockRiskAnalysis,
        channels: ['telegram', 'discord'],
        traceId: 'test-trace-id',
      };

      await router.route(params);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('批量操作已缓存'),
        expect.any(Object)
      );
    });

    it('should handle missing event template', async () => {
      const params: NotificationParams = {
        event: {
          ...mockEvent,
          methodName: 'unknown_method',
        },
        riskAnalysis: mockRiskAnalysis,
        channels: ['telegram'],
        traceId: 'test-trace-id',
      };

      await router.route(params);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('未找到事件类型的通知模板'),
        expect.any(Object)
      );
    });

    it('should handle emergency notifications', async () => {
      const params: NotificationParams = {
        event: {
          ...mockEvent,
          value: '1000000000000000000000', // 1000 ETH
        },
        riskAnalysis: mockRiskAnalysis,
        channels: ['telegram', 'discord', 'email'],
        traceId: 'test-trace-id',
      };

      await router.route(params);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('通知发送成功'),
        expect.objectContaining({
          isEmergency: true,
        })
      );
    });

    it('should handle low risk events', async () => {
      const params: NotificationParams = {
        event: mockEvent,
        riskAnalysis: {
          ...mockRiskAnalysis,
          score: 0.2,
          level: RiskLevel.LOW,
          factors: ['Low value transfer'],
          features: [{ description: 'Amount', score: 0.2 }],
        },
        channels: ['discord'],
        traceId: 'test-trace-id',
      };

      await router.route(params);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('没有匹配的接收人'),
        expect.any(Object)
      );
    });

    it('should handle notification errors', async () => {
      const params: NotificationParams = {
        event: mockEvent,
        riskAnalysis: mockRiskAnalysis,
        channels: ['telegram'],
        traceId: 'test-trace-id',
      };

      // 模拟发送通知失败
      jest
        .spyOn(router as any, '_sendNotification')
        .mockRejectedValue(new Error('Failed to send notification'));

      await expect(router.route(params)).rejects.toThrow('Failed to send notification');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('通知发送失败'),
        expect.objectContaining({
          traceId: 'test-trace-id',
          error: 'Failed to send notification',
        })
      );
    });
  });
});
