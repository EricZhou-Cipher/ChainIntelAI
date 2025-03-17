import { EventPipeline } from '../../pipeline/eventPipeline';
import { PipelineMonitor } from '../../pipeline/pipelineMonitor';
import { EventNormalizer } from '../../pipeline/eventNormalizer';
import { RiskAnalyzer } from '../../analyzer/riskAnalyzer';
import { NotificationRouter } from '../../notifier/notificationRouter';
import { defaultConfig } from '../../pipeline/pipelineConfig';
import { createTransferEvent, createContractCallEvent, EventGenerator } from './mocks/eventMocks';
import { createProfile, ProfileGenerator } from './mocks/profileMocks';
import { createRiskAnalysis, RiskAnalysisGenerator } from './mocks/aiMocks';
import {
  mockSendNotification,
  getMockedNotifications,
  clearMockedNotifications,
  getNotificationStats,
} from './mocks/notificationMocks';
import { logger } from '../../utils/logger';

jest.mock('../../pipeline/eventNormalizer');
jest.mock('../../analyzer/riskAnalyzer');
jest.mock('../../notifier/notificationRouter');
jest.mock('../../utils/logger');

describe('Pipeline Integration Tests', () => {
  let pipeline: EventPipeline;
  let monitor: PipelineMonitor;
  let normalizer: jest.Mocked<EventNormalizer>;
  let analyzer: jest.Mocked<RiskAnalyzer>;
  let notifier: jest.Mocked<NotificationRouter>;
  let eventGenerator: EventGenerator;
  let profileGenerator: ProfileGenerator;
  let riskAnalysisGenerator: RiskAnalysisGenerator;

  beforeEach(() => {
    // 清理通知存储
    clearMockedNotifications();

    // 初始化生成器
    eventGenerator = new EventGenerator(1); // chainId = 1
    profileGenerator = new ProfileGenerator();
    riskAnalysisGenerator = new RiskAnalysisGenerator();

    // 初始化监控器
    monitor = new PipelineMonitor(defaultConfig);

    // 初始化并配置Mock
    normalizer = new EventNormalizer() as jest.Mocked<EventNormalizer>;
    analyzer = new RiskAnalyzer() as jest.Mocked<RiskAnalyzer>;
    notifier = new NotificationRouter() as jest.Mocked<NotificationRouter>;

    // 创建Pipeline实例
    pipeline = new EventPipeline(defaultConfig, normalizer, analyzer, notifier, monitor);

    // 配置日志Mock
    (logger.info as jest.Mock).mockImplementation(() => {});
    (logger.error as jest.Mock).mockImplementation(() => {});
  });

  describe('Event Processing Flow', () => {
    it('should process transfer event successfully', async () => {
      // 准备测试数据
      const event = createTransferEvent({
        value: '1000000000000000000000', // 1000 ETH
      });

      const fromProfile = createProfile({
        address: event.from,
        type: 'normal',
      });

      const toProfile = createProfile({
        address: event.to,
        type: 'new',
      });

      const riskAnalysis = createRiskAnalysis(event, fromProfile, toProfile);

      // 配置Mock行为
      normalizer.normalizeEvent.mockResolvedValue(event);
      analyzer.analyze.mockResolvedValue(riskAnalysis);
      notifier.route.mockImplementation(async ({ event, riskAnalysis, channels, traceId }) => {
        channels.forEach((channel) => {
          mockSendNotification(channel, event, riskAnalysis, traceId);
        });
      });

      // 执行测试
      await pipeline.processEvent(event.rawEvent);

      // 验证调用
      expect(normalizer.normalizeEvent).toHaveBeenCalledWith(1, event.rawEvent);
      expect(analyzer.analyze).toHaveBeenCalled();
      expect(notifier.route).toHaveBeenCalled();

      // 验证监控指标
      const metrics = await monitor.getMetrics();
      expect(metrics).toContain('pipeline_events_total');
      expect(metrics).toContain('pipeline_processing_time_seconds');

      // 验证通知
      const notifications = getMockedNotifications();
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].metadata.riskScore).toBe(riskAnalysis.score);
    });

    it('should process contract call event successfully', async () => {
      // 准备测试数据
      const event = createContractCallEvent({
        methodName: 'transfer',
        parameters: ['0x1234', '1000000000000000000'],
      });

      const fromProfile = createProfile({
        address: event.from,
        type: 'blacklist',
      });

      const toProfile = createProfile({
        address: event.to,
        type: 'normal',
      });

      const riskAnalysis = createRiskAnalysis(event, fromProfile, toProfile);

      // 配置Mock行为
      normalizer.normalizeEvent.mockResolvedValue(event);
      analyzer.analyze.mockResolvedValue(riskAnalysis);
      notifier.route.mockImplementation(async ({ event, riskAnalysis, channels, traceId }) => {
        channels.forEach((channel) => {
          mockSendNotification(channel, event, riskAnalysis, traceId);
        });
      });

      // 执行测试
      await pipeline.processEvent(event.rawEvent);

      // 验证调用
      expect(normalizer.normalizeEvent).toHaveBeenCalledWith(1, event.rawEvent);
      expect(analyzer.analyze).toHaveBeenCalled();
      expect(notifier.route).toHaveBeenCalled();

      // 验证监控指标
      const metrics = await monitor.getMetrics();
      expect(metrics).toContain('pipeline_events_total');
      expect(metrics).toContain('pipeline_processing_time_seconds');

      // 验证通知
      const notifications = getMockedNotifications();
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].metadata.riskScore).toBe(riskAnalysis.score);
    });

    it('should handle batch events correctly', async () => {
      // 生成测试数据
      const events = eventGenerator.generateTransferBatch(5);
      const profileMap = profileGenerator.generateProfileMap(
        events.map((e) => e.from),
        'normal'
      );

      // 配置Mock行为
      events.forEach((event) => {
        normalizer.normalizeEvent.mockResolvedValueOnce(event);
      });

      const analyses = riskAnalysisGenerator.generateAnalyses(events, profileMap);
      analyses.forEach((analysis) => {
        analyzer.analyze.mockResolvedValueOnce(analysis);
      });

      notifier.route.mockImplementation(async ({ event, riskAnalysis, channels, traceId }) => {
        channels.forEach((channel) => {
          mockSendNotification(channel, event, riskAnalysis, traceId);
        });
      });

      // 执行测试
      await Promise.all(events.map((event) => pipeline.processEvent(event.rawEvent)));

      // 验证处理结果
      expect(normalizer.normalizeEvent).toHaveBeenCalledTimes(events.length);
      expect(analyzer.analyze).toHaveBeenCalledTimes(events.length);

      const notifications = getMockedNotifications();
      const stats = getNotificationStats();

      expect(stats.totalCount).toBeGreaterThan(0);
      expect(Object.keys(stats.channelCounts).length).toBeGreaterThan(0);
      expect(Object.keys(stats.riskLevelCounts).length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      // 准备测试数据
      const event = createTransferEvent();

      // 配置Mock抛出错误
      normalizer.normalizeEvent.mockRejectedValue(new Error('Normalization failed'));

      // 执行测试
      await expect(pipeline.processEvent(event.rawEvent)).rejects.toThrow('Normalization failed');

      // 验证错误处理
      expect(logger.error).toHaveBeenCalled();
      expect(monitor.getErrorCount('Error')).toBe(1);
    });
  });

  describe('Configuration Validation', () => {
    it('should respect risk thresholds for notifications', async () => {
      // 准备测试数据
      const event = createTransferEvent();
      const riskAnalysis = createRiskAnalysis(event, null, null, {
        score: 0.95, // Critical risk
      });

      // 配置Mock行为
      normalizer.normalizeEvent.mockResolvedValue(event);
      analyzer.analyze.mockResolvedValue(riskAnalysis);
      notifier.route.mockImplementation(async ({ event, riskAnalysis, channels, traceId }) => {
        channels.forEach((channel) => {
          mockSendNotification(channel, event, riskAnalysis, traceId);
        });
      });

      // 执行测试
      await pipeline.processEvent(event.rawEvent);

      // 验证通知配置
      const notifications = getMockedNotifications();
      const stats = getNotificationStats();

      expect(stats.riskLevelCounts['CRITICAL']).toBe(1);
      expect(notifications[0].channel).toBe('slack'); // 默认配置中的关键风险通知渠道
    });
  });

  describe('Monitoring and Metrics', () => {
    it('should record all required metrics', async () => {
      // 准备测试数据
      const event = createTransferEvent();
      const riskAnalysis = createRiskAnalysis(event, null, null);

      // 配置Mock行为
      normalizer.normalizeEvent.mockResolvedValue(event);
      analyzer.analyze.mockResolvedValue(riskAnalysis);

      // 执行测试
      await pipeline.processEvent(event.rawEvent);

      // 验证监控指标
      const metrics = await monitor.getMetrics();

      // 验证必要的指标存在
      expect(metrics).toContain('pipeline_events_total');
      expect(metrics).toContain('pipeline_processing_time_seconds');
      expect(metrics).toContain('pipeline_risk_levels_total');
      expect(metrics).toContain('pipeline_errors_total');

      // 验证处理时间
      const processingTime = monitor.getProcessingTime(event.txHash);
      expect(processingTime).toBeGreaterThan(0);
    });
  });
});
