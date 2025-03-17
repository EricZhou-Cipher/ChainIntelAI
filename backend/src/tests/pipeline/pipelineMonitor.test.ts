import { PipelineMonitor } from '../../pipeline/pipelineMonitor';
import { PipelineConfig } from '../../pipeline/pipelineConfig';
import { Logger } from '../../utils/logger';
import { register } from 'prom-client';
import { NormalizedEvent, EventType, RiskAnalysis, RiskLevel } from '../../types/events';
import axios from 'axios';
import { WebClient as SlackClient } from '@slack/web-api';
import { SlackClient as CustomSlackClient } from '../../notifier/slack';
import { DingTalkClient } from '../../notifier/dingtalk';
import { FeishuClient } from '../../notifier/feishu';

jest.mock('@slack/web-api');
jest.mock('axios');
jest.mock('../../notifier/slack');
jest.mock('../../notifier/dingtalk');
jest.mock('../../notifier/feishu');

describe('PipelineMonitor', () => {
  let monitor: PipelineMonitor;
  let mockConfig: PipelineConfig;
  let mockLogger: Logger;
  let mockSlackPostMessage: jest.Mock;

  // 定义标准的 mockEvent
  const mockEvent: NormalizedEvent = {
    traceId: 'test-trace-id',
    type: EventType.TRANSFER,
    timestamp: Math.floor(Date.now() / 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    chainId: 1,
    blockNumber: 123456,
    transactionHash: '0x123',
    from: '0xabc',
    to: '0xdef',
    value: '1000000000000000000',
  };

  const mockRiskAnalysis: RiskAnalysis = {
    score: 0.9,
    level: RiskLevel.HIGH,
    factors: ['high_value', 'new_contract'],
    features: [
      { description: 'Transaction Value', score: 0.8 },
      { description: 'Contract Age', score: 0.6 },
    ],
    details: {
      value: '1000000000000000000',
      contractAge: 0,
      transactionCount: 1,
    },
  };

  beforeEach(() => {
    // 清理所有已注册的指标
    register.clear();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      getTraceId: jest.fn().mockReturnValue(''),
      setTraceId: jest.fn(),
      setDefaultContext: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockConfig = {
      monitoring: {
        enabled: true,
        metricsPort: 9090,
        metricsInterval: 1000,
        metricsPrefix: 'chainintel',
        metricsBuckets: [0.1, 0.5, 1, 2, 5, 10],
        webhooks: {
          slack: 'https://hooks.slack.com/services/xxx',
          dingtalk: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
          feishu: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx',
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
    } as PipelineConfig;

    mockSlackPostMessage = jest.fn().mockResolvedValue({ ok: true });
    (SlackClient as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        postMessage: mockSlackPostMessage,
      },
    }));
    (CustomSlackClient as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        postMessage: mockSlackPostMessage,
      },
    }));

    monitor = new PipelineMonitor(mockConfig, mockLogger);
  });

  afterEach(() => {
    // 清理所有已注册的指标
    register.clear();
  });

  describe('事件记录', () => {
    it('应该正确记录事件', () => {
      const traceId = 'test-trace-id';
      monitor.recordEvent('event_received', traceId);
      monitor.recordEvent('event_normalized', traceId);
      monitor.recordEvent('risk_analyzed', traceId);
    });

    it('应该正确记录错误', () => {
      const traceId = 'test-trace-id';
      monitor.recordError('validation_error', traceId);
      monitor.recordError('network_error', traceId);
    });

    it('应该正确记录风险等级', () => {
      const traceId = 'test-trace-id';
      monitor.recordRiskLevel(RiskLevel.HIGH, traceId);
      monitor.recordRiskLevel(RiskLevel.MEDIUM, traceId);
      monitor.recordRiskLevel(RiskLevel.LOW, traceId);
    });
  });

  describe('延迟记录', () => {
    it('应该正确记录各种延迟', () => {
      const traceId = 'test-trace-id';
      expect(() => monitor.recordProfileLatency(0.5, traceId)).not.toThrow();
      expect(() => monitor.recordRiskAnalysisLatency(0.3, traceId)).not.toThrow();
      expect(() => monitor.recordNotificationLatency(0.2, traceId)).not.toThrow();
      expect(() => monitor.recordTotalLatency(1.0, traceId)).not.toThrow();
    });

    it('应该拒绝无效的延迟值', () => {
      const traceId = 'test-trace-id';
      expect(() => monitor.recordProfileLatency(-1, traceId)).toThrow();
      expect(() => monitor.recordRiskAnalysisLatency(-1, traceId)).toThrow();
      expect(() => monitor.recordNotificationLatency(-1, traceId)).toThrow();
      expect(() => monitor.recordTotalLatency(-1, traceId)).toThrow();
    });
  });

  describe('高风险通知', () => {
    it('应该发送高风险通知', async () => {
      await expect(monitor.notifyHighRisk(mockEvent, mockRiskAnalysis)).resolves.not.toThrow();
    });

    it('应该在webhook配置缺失时优雅处理', async () => {
      const minimalConfig: PipelineConfig = {
        ...mockConfig,
        monitoring: {
          ...mockConfig.monitoring,
          webhooks: {},
        },
      };
      const monitor = new PipelineMonitor(minimalConfig, mockLogger);
      await expect(monitor.notifyHighRisk(mockEvent, mockRiskAnalysis)).resolves.not.toThrow();
    });
  });

  describe('指标记录', () => {
    it('应该能够记录事件计数', async () => {
      const traceId = 'test-trace-id';
      monitor.recordEvent('test', traceId);
      monitor.recordEvent('test', traceId);

      const metrics = await monitor.getMetrics();
      expect(metrics).toContain('chainintel_events_total');
    });

    it('应该能够记录延迟直方图', async () => {
      const traceId = 'test-trace-id';
      monitor.recordProfileLatency(0.5, traceId);
      monitor.recordRiskAnalysisLatency(1.2, traceId);
      monitor.recordNotificationLatency(0.3, traceId);
      monitor.recordTotalLatency(2.0, traceId);

      const metrics = await monitor.getMetrics();
      expect(metrics).toContain('chainintel_latency_seconds');
    });

    it('应该能够记录风险等级', async () => {
      const traceId = 'test-trace-id';
      monitor.recordRiskLevel(RiskLevel.HIGH, traceId);
      monitor.recordRiskLevel(RiskLevel.MEDIUM, traceId);
      monitor.recordRiskLevel(RiskLevel.HIGH, traceId);

      const metrics = await monitor.getMetrics();
      expect(metrics).toContain('chainintel_risk_levels_total');
    });
  });

  describe('webhook notifications', () => {
    beforeEach(() => {
      mockSlackPostMessage = jest.fn().mockResolvedValue({ ok: true });
      (CustomSlackClient as unknown as jest.Mock).mockImplementation(() => ({
        chat: {
          postMessage: mockSlackPostMessage,
        },
      }));
      (axios.post as jest.Mock).mockClear();

      // 重新创建 monitor 实例以确保使用新的 mock
      monitor = new PipelineMonitor(mockConfig, mockLogger);
    });

    test('should send Slack notification', async () => {
      await monitor.notifyHighRisk(mockEvent, mockRiskAnalysis);

      expect(mockSlackPostMessage).toHaveBeenCalledWith({
        channel: '#risk-alerts',
        text: expect.stringContaining('High Risk Event Detected'),
      });
    });

    test('should send DingTalk notification', async () => {
      const customConfig = {
        ...mockConfig,
        monitoring: {
          ...mockConfig.monitoring,
          webhooks: {
            dingtalk: 'https://dingtalk-webhook.url',
          },
        },
      };

      const monitor = new PipelineMonitor(customConfig, mockLogger);
      await monitor.notifyHighRisk(mockEvent, mockRiskAnalysis);

      expect(axios.post).toHaveBeenCalledWith(
        'https://dingtalk-webhook.url',
        expect.objectContaining({
          msgtype: 'text',
          text: expect.objectContaining({
            content: expect.stringContaining('High Risk Event'),
          }),
        })
      );
    });

    test('should handle notification failures', async () => {
      mockSlackPostMessage.mockRejectedValueOnce(new Error('Failed'));
      await expect(monitor.notifyHighRisk(mockEvent, mockRiskAnalysis)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    test('should handle invalid metric values', () => {
      const traceId = 'test-trace-id';
      expect(() => monitor.recordProfileLatency(-1, traceId)).toThrow();
      expect(() => monitor.recordTotalLatency(NaN, traceId)).toThrow();
    });

    test('should handle missing webhook configs', async () => {
      const minimalConfig = {
        ...mockConfig,
        monitoring: {
          ...mockConfig.monitoring,
          webhooks: {},
        },
      };

      const monitor = new PipelineMonitor(minimalConfig, mockLogger);
      await expect(monitor.notifyHighRisk(mockEvent, mockRiskAnalysis)).resolves.not.toThrow();
    });
  });

  it('should record and retrieve metrics correctly', () => {
    const traceId = 'test-trace-id';
    // Record some events
    monitor.recordEvent('transfer', traceId);
    monitor.recordEvent('contract_call', traceId);
    monitor.recordEvent('transfer', traceId);

    // Verify event counts
    expect(monitor.getEventCount('transfer')).toBe(2);
    expect(monitor.getEventCount('contract_call')).toBe(1);
  });

  it('should track processing time', async () => {
    const traceId = 'test-trace-id';
    monitor.startProcessing(traceId);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait 10ms
    monitor.endProcessing(traceId);
    const processingTime = monitor.getProcessingTime(traceId);

    expect(processingTime).toBeGreaterThan(0);
    expect(processingTime).toBeLessThan(1000); // Should be less than 1 second
  });

  it('should track error counts', () => {
    const traceId = 'test-trace-id';
    monitor.recordError('validation_error', traceId);
    monitor.recordError('api_error', traceId);
    monitor.recordError('validation_error', traceId);

    expect(monitor.getErrorCount('validation_error')).toBe(2);
    expect(monitor.getErrorCount('api_error')).toBe(1);
  });

  it('should track risk levels', () => {
    const traceId = 'test-trace-id';
    monitor.recordRiskLevel(RiskLevel.HIGH, traceId);
    monitor.recordRiskLevel(RiskLevel.MEDIUM, traceId);
    monitor.recordRiskLevel(RiskLevel.HIGH, traceId);

    const riskCounts = monitor.getRiskLevelCounts();
    expect(riskCounts[RiskLevel.HIGH]).toBe(2);
    expect(riskCounts[RiskLevel.MEDIUM]).toBe(1);
    expect(riskCounts[RiskLevel.LOW]).toBe(0);
  });

  it('should calculate average processing time', async () => {
    const traceId1 = 'test-trace-id-1';
    const traceId2 = 'test-trace-id-2';

    monitor.startProcessing(traceId1);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait 10ms
    monitor.endProcessing(traceId1);

    monitor.startProcessing(traceId2);
    await new Promise((resolve) => setTimeout(resolve, 20)); // Wait 20ms
    monitor.endProcessing(traceId2);

    const avgTime = monitor.getAverageProcessingTime();
    expect(avgTime).toBeGreaterThan(0);
  });

  it('should reset metrics correctly', () => {
    const traceId = 'test-trace-id';
    monitor.recordEvent('transfer', traceId);
    monitor.recordError('validation_error', traceId);
    monitor.recordRiskLevel(RiskLevel.HIGH, traceId);

    monitor.reset();

    expect(monitor.getEventCount('transfer')).toBe(0);
    expect(monitor.getErrorCount('validation_error')).toBe(0);
    expect(monitor.getRiskLevelCounts()[RiskLevel.HIGH]).toBe(0);
  });

  it('should expose Prometheus metrics', async () => {
    const traceId = 'test-trace-id';
    monitor.recordEvent('transfer', traceId);
    monitor.recordError('validation_error', traceId);
    monitor.recordRiskLevel(RiskLevel.HIGH, traceId);

    const metrics = await monitor.getMetrics();
    expect(metrics).toContain('chainintel_events_total');
    expect(metrics).toContain('chainintel_errors_total');
    expect(metrics).toContain('chainintel_risk_levels_total');
    expect(metrics).toContain('chainintel_latency_seconds');
  });
});
