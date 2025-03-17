import { PipelineMonitor } from '../../../pipeline/pipelineMonitor';
import { PipelineConfig } from '../../../pipeline/pipelineConfig';
import { Logger } from '@/utils/logger';
import { register } from 'prom-client';
import { NormalizedEvent, EventType, RiskAnalysis, RiskLevel } from '../../../types/events';
import { WebClient as SlackClient } from '@slack/web-api';
import { SlackClient as CustomSlackClient } from '../../../notifier/slack';
import axios from 'axios';

jest.mock('@slack/web-api');
jest.mock('axios');
jest.mock('../../../notifier/slack');
jest.mock('../../../notifier/dingtalk');
jest.mock('../../../notifier/feishu');

// Helper functions
function createMockEvent(): NormalizedEvent {
  const now = Date.now();
  return {
    traceId: 'test-trace-id',
    type: EventType.TRANSFER,
    timestamp: now,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    chainId: 1,
    blockNumber: 1000000,
    transactionHash: '0xabc',
    from: '0x123',
    to: '0x456',
    value: '1000000000000000000',
  };
}

function createMockRiskAnalysis(): RiskAnalysis {
  return {
    score: 0.9,
    level: RiskLevel.HIGH,
    factors: ['suspicious_activity', 'high_value_transfer'],
    features: [
      {
        description: 'High value transfer',
        score: 0.9,
      },
    ],
    details: {
      confidence: 0.9,
      timestamp: Date.now(),
    },
  };
}

describe('PipelineMonitor', () => {
  let monitor: PipelineMonitor;
  let mockLogger: jest.Mocked<Logger>;
  let mockSlackPostMessage: jest.Mock;

  beforeEach(() => {
    register.clear();
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

    const mockConfig: PipelineConfig = {
      monitoring: {
        enabled: true,
        metricsPort: 9090,
        metricsInterval: 15,
        metricsPrefix: 'test_pipeline',
        metricsBuckets: [0.1, 0.5, 1, 2, 5],
        webhooks: {
          slack: 'https://slack.webhook.url',
          dingtalk: 'https://dingtalk.webhook.url',
          feishu: 'https://feishu.webhook.url',
        },
      },
      notification: {
        riskThresholds: {
          medium: 0.4,
          high: 0.7,
          critical: 0.9,
        },
        channels: {
          low: [],
          medium: ['slack'],
          high: ['slack', 'dingtalk'],
          critical: ['slack', 'dingtalk', 'feishu'],
        },
      },
      profile: {
        apiUrl: 'http://localhost:3000',
        cacheTTL: 3600,
        fetchTimeout: 5000,
        fetchRetries: 3,
        minRetryDelay: 1000,
        maxRetryDelay: 5000,
        batchSize: 100,
        forceRefreshRiskScore: 0.8,
      },
      ai: {
        mode: 'api',
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7,
      },
      logging: {
        level: 'info',
        format: 'json',
        timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      },
      maxRetries: 3,
      retryDelay: 1000,
    };

    mockSlackPostMessage = jest.fn().mockResolvedValue({ ok: true });
    jest.mock('@slack/web-api', () => ({
      WebClient: jest.fn().mockImplementation(() => ({
        chat: {
          postMessage: mockSlackPostMessage,
        },
      })),
    }));

    monitor = new PipelineMonitor(mockConfig, mockLogger);
  });

  describe('event recording', () => {
    it('should record events correctly', () => {
      const traceId = 'test-trace-id';
      monitor.recordEvent('event_received', traceId);
      monitor.recordEvent('event_normalized', traceId);
      monitor.recordEvent('risk_analyzed', traceId);

      expect(monitor.getEventCount('event_received')).toBe(1);
      expect(monitor.getEventCount('event_normalized')).toBe(1);
      expect(monitor.getEventCount('risk_analyzed')).toBe(1);
    });

    it('should handle multiple events of same type', () => {
      const traceId = 'test-trace-id';
      monitor.recordEvent('event_received', traceId);
      monitor.recordEvent('event_received', traceId);
      monitor.recordEvent('event_received', traceId);

      expect(monitor.getEventCount('event_received')).toBe(3);
    });

    it('should return 0 for unknown event types', () => {
      expect(monitor.getEventCount('unknown_event')).toBe(0);
    });

    it('should record errors correctly', () => {
      const traceId = 'test-trace-id';
      monitor.recordError('validation_error', traceId);
      monitor.recordError('network_error', traceId);

      expect(monitor.getErrorCount('validation_error')).toBe(1);
      expect(monitor.getErrorCount('network_error')).toBe(1);
    });
  });

  describe('webhook notifications', () => {
    let mockSlackPostMessage: jest.Mock;

    beforeEach(() => {
      // 重置配置，启用 Slack 通知
      const testConfig: PipelineConfig = {
        monitoring: {
          enabled: true,
          metricsPort: 9090,
          metricsInterval: 15,
          metricsPrefix: 'test_pipeline',
          metricsBuckets: [0.1, 0.5, 1, 2, 5],
          webhooks: {
            slack: 'https://hooks.slack.com/services/XXX/YYY/ZZZ',
            dingtalk: undefined,
            feishu: undefined,
          },
        },
        notification: {
          riskThresholds: {
            medium: 0.4,
            high: 0.7,
            critical: 0.9,
          },
          channels: {
            low: [],
            medium: ['slack'],
            high: ['slack', 'dingtalk'],
            critical: ['slack', 'dingtalk', 'feishu'],
          },
        },
        profile: {
          apiUrl: 'http://localhost:3000',
          cacheTTL: 3600,
          fetchTimeout: 15000,
          fetchRetries: 3,
          minRetryDelay: 1000,
          maxRetryDelay: 5000,
          batchSize: 10,
          forceRefreshRiskScore: 0.8,
        },
        ai: {
          mode: 'api' as const,
          provider: 'openai' as const,
          model: 'gpt-4',
          maxTokens: 2048,
          temperature: 0.7,
        },
        logging: {
          level: 'info' as const,
          format: 'json' as const,
          timestampFormat: 'YYYY-MM-DD HH:mm:ss',
        },
        maxRetries: 3,
        retryDelay: 1000,
      };

      // 创建新的监控器实例，使用测试配置
      monitor = new PipelineMonitor(testConfig, mockLogger);

      // 模拟 Slack 客户端
      mockSlackPostMessage = jest.fn().mockResolvedValue({ ok: true });
      (monitor as any).slackClient = {
        chat: {
          postMessage: mockSlackPostMessage,
        },
      };
    });

    it('should handle notification failures gracefully', async () => {
      const event = createMockEvent();
      const analysis = createMockRiskAnalysis();

      mockSlackPostMessage.mockRejectedValueOnce(new Error('Failed to send'));

      await monitor.notifyHighRisk(event, analysis);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should send slack notification for high risk events', async () => {
      const event: NormalizedEvent = {
        traceId: 'test-trace-id',
        type: EventType.TRANSFER,
        chainId: 1,
        blockNumber: 12345678,
        transactionHash: '0xabcdef1234567890',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '1000000000000000000',
        timestamp: 1234567890,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const analysis: RiskAnalysis = {
        score: 0.9,
        level: RiskLevel.HIGH,
        factors: ['Large amount', 'New address'],
        features: [
          { description: 'Amount', score: 0.9 },
          { description: 'Address age', score: 0.8 },
        ],
      };

      await monitor.notifyHighRisk(event, analysis);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Sending high risk notification'),
        expect.any(Object)
      );
      expect(mockSlackPostMessage).toHaveBeenCalledWith({
        channel: '#risk-alerts',
        text: expect.stringContaining('High Risk Event Detected'),
      });
    });
  });
});
