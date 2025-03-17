import { Counter, Histogram, Registry, Gauge, register } from 'prom-client';
import { WebClient as SlackClient } from '@slack/web-api';
import axios from 'axios';
import { PipelineConfig, getRiskLevel } from './pipelineConfig';
import { Logger } from '../utils/logger';
import { NormalizedEvent } from '../types/events';
import { RiskAnalysis, RiskLevel } from '../types/events';
import { SlackClient as CustomSlackClient } from '../notifier/slack';
import { DingTalkClient } from '../notifier/dingtalk';
import { FeishuClient } from '../notifier/feishu';

export class PipelineMonitor {
  private config: PipelineConfig;
  private logger: Logger;
  private registry: Registry;
  private eventCounter: Counter;
  private errorCounter: Counter;
  private latencyHistogram: Histogram;
  private riskLevelCounter: Counter;

  // 处理时间指标
  private profileLatencyHistogram: Histogram<string>;
  private riskAnalysisLatencyHistogram: Histogram<string>;
  private notificationLatencyHistogram: Histogram<string>;
  private totalLatencyHistogram: Histogram<string>;

  // 缓存指标
  private profileCacheHits: Counter<string>;
  private profileCacheMisses: Counter<string>;
  private profileCacheHitRatio: Gauge<string>;

  // Webhook clients
  private slackClient?: CustomSlackClient;
  private dingTalkUrl?: string;
  private feishuUrl?: string;

  // 内部状态
  private eventCounts: Map<string, number>;
  private errorCounts: Map<string, number>;
  private riskLevelCounts: Map<string, number>;
  private processingTimes: Map<string, number>;
  private processingStartTimes: Map<string, number>;

  // 添加静态方法来清理指标
  public static clearMetrics(): void {
    register.clear();
  }

  constructor(config: PipelineConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.registry = new Registry();

    // 重置所有指标
    register.clear();
    this.registry.clear();

    // 初始化内部状态
    this.eventCounts = new Map();
    this.errorCounts = new Map();
    this.riskLevelCounts = new Map();
    this.processingTimes = new Map();
    this.processingStartTimes = new Map();

    // 初始化指标
    const metricsPrefix = this.config.monitoring.metricsPrefix;
    this.eventCounter = new Counter({
      name: `${metricsPrefix}_events_total`,
      help: 'Total number of events processed',
      labelNames: ['type', 'trace_id'],
      registers: [this.registry],
    });

    this.errorCounter = new Counter({
      name: `${metricsPrefix}_errors_total`,
      help: 'Total number of errors',
      labelNames: ['error', 'trace_id'],
      registers: [this.registry],
    });

    this.latencyHistogram = new Histogram({
      name: `${metricsPrefix}_latency_seconds`,
      help: 'Latency of event processing',
      labelNames: ['stage', 'trace_id'],
      buckets: this.config.monitoring.metricsBuckets,
      registers: [this.registry],
    });

    this.riskLevelCounter = new Counter({
      name: `${metricsPrefix}_risk_levels_total`,
      help: 'Total number of risk levels',
      labelNames: ['level', 'trace_id'],
      registers: [this.registry],
    });

    // 初始化处理时间指标
    this.profileLatencyHistogram = new Histogram({
      name: `${metricsPrefix}_profile_latency_seconds`,
      help: 'Time taken to fetch address profiles',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.riskAnalysisLatencyHistogram = new Histogram({
      name: `${metricsPrefix}_risk_analysis_latency_seconds`,
      help: 'Time taken for risk analysis',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.notificationLatencyHistogram = new Histogram({
      name: `${metricsPrefix}_notification_latency_seconds`,
      help: 'Time taken to send notifications',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.totalLatencyHistogram = new Histogram({
      name: `${metricsPrefix}_total_latency_seconds`,
      help: 'Total event processing time',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // 初始化缓存指标
    this.profileCacheHits = new Counter({
      name: `${metricsPrefix}_profile_cache_hits_total`,
      help: 'Total number of profile cache hits',
      registers: [this.registry],
    });

    this.profileCacheMisses = new Counter({
      name: `${metricsPrefix}_profile_cache_misses_total`,
      help: 'Total number of profile cache misses',
      registers: [this.registry],
    });

    this.profileCacheHitRatio = new Gauge({
      name: `${metricsPrefix}_profile_cache_hit_ratio`,
      help: 'Profile cache hit ratio',
      registers: [this.registry],
      collect: () => {
        const hits = Number(this.profileCacheHits.get());
        const misses = Number(this.profileCacheMisses.get());
        const total = hits + misses;

        if (total > 0) {
          this.profileCacheHitRatio.set(hits / total);
        }
      },
    });

    // Initialize webhook clients
    if (config.monitoring.webhooks.slack) {
      this.slackClient = new CustomSlackClient(config.monitoring.webhooks.slack);
    }
    this.dingTalkUrl = config.monitoring.webhooks.dingtalk;
    this.feishuUrl = config.monitoring.webhooks.feishu;
  }

  recordEvent(type: string, traceId: string): void {
    this.eventCounter.inc({ type, trace_id: traceId });
    this.eventCounts.set(type, (this.eventCounts.get(type) || 0) + 1);
  }

  recordError(error: string, traceId: string): void {
    this.errorCounter.inc({ error, trace_id: traceId });
    this.errorCounts.set(error, (this.errorCounts.get(error) || 0) + 1);
  }

  recordProfileLatency(seconds: number, traceId: string): void {
    if (seconds < 0 || isNaN(seconds)) {
      throw new Error('Invalid latency value');
    }
    this.latencyHistogram.observe({ stage: 'profile', trace_id: traceId }, seconds);
  }

  recordRiskAnalysisLatency(seconds: number, traceId: string): void {
    if (seconds < 0 || isNaN(seconds)) {
      throw new Error('Invalid latency value');
    }
    this.latencyHistogram.observe({ stage: 'risk_analysis', trace_id: traceId }, seconds);
  }

  recordNotificationLatency(seconds: number, traceId: string): void {
    if (seconds < 0 || isNaN(seconds)) {
      throw new Error('Invalid latency value');
    }
    this.latencyHistogram.observe({ stage: 'notification', trace_id: traceId }, seconds);
  }

  recordTotalLatency(seconds: number, traceId: string): void {
    if (seconds < 0 || isNaN(seconds)) {
      throw new Error('Invalid latency value');
    }
    this.latencyHistogram.observe({ stage: 'total', trace_id: traceId }, seconds);
  }

  recordRiskLevel(level: string, traceId: string): void {
    this.riskLevelCounter.inc({ level, trace_id: traceId });
    this.riskLevelCounts.set(level, (this.riskLevelCounts.get(level) || 0) + 1);
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  // Webhook notification methods
  async notifyHighRisk(event: NormalizedEvent, riskAnalysis: RiskAnalysis): Promise<void> {
    const message = this.formatAlertMessage(event, riskAnalysis);

    this.logger.info('Sending high risk notification', {
      transactionHash: event.transactionHash,
      riskLevel: riskAnalysis.level,
      riskScore: riskAnalysis.score,
    });

    try {
      await Promise.all([
        this.notifySlack(event, riskAnalysis),
        this.notifyDingTalk(message),
        this.notifyFeishu(message),
      ]);
    } catch (error) {
      this.logger.error('Failed to send webhook notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async notifySlack(event: NormalizedEvent, riskAnalysis: RiskAnalysis): Promise<void> {
    if (!this.config.monitoring.webhooks.slack) {
      this.logger.warn('Slack webhook not configured');
      return;
    }

    try {
      const message = {
        channel: '#risk-alerts',
        text:
          `High Risk Event Detected\n` +
          `Transaction: ${event.transactionHash}\n` +
          `From: ${event.from}\n` +
          `To: ${event.to}\n` +
          `Risk Score: ${riskAnalysis.score}\n` +
          `Risk Level: ${riskAnalysis.level}\n` +
          `Timestamp: ${new Date(event.timestamp * 1000).toISOString()}`,
      };

      if (this.slackClient) {
        await this.slackClient.chat.postMessage(message);
        this.logger.info('Slack notification sent successfully');
      }
    } catch (error) {
      this.logger.error('Failed to send Slack notification', { error });
      throw error;
    }
  }

  private async notifyDingTalk(message: string): Promise<void> {
    if (this.dingTalkUrl) {
      await axios.post(this.dingTalkUrl, {
        msgtype: 'text',
        text: { content: message },
      });
    }
  }

  private async notifyFeishu(message: string): Promise<void> {
    if (this.feishuUrl) {
      await axios.post(this.feishuUrl, {
        msg_type: 'text',
        content: { text: message },
      });
    }
  }

  private formatAlertMessage(event: NormalizedEvent, riskAnalysis: RiskAnalysis): string {
    return (
      `🚨 High Risk Event Detected!\n\n` +
      `Chain: ${event.chainId}\n` +
      `Transaction: ${event.transactionHash}\n` +
      `From: ${event.from}\n` +
      `To: ${event.to}\n` +
      `Value: ${event.value}\n` +
      `Risk Level: ${riskAnalysis.level}\n` +
      `Risk Score: ${(riskAnalysis.score * 100).toFixed(1)}%\n` +
      `Time: ${new Date(event.timestamp * 1000).toISOString()}\n\n` +
      `Features:\n${riskAnalysis.features.map((f) => `- ${f.description}: ${f.score}`).join('\n')}`
    );
  }

  // 新增方法
  getEventCount(type: string): number {
    return this.eventCounts.get(type) || 0;
  }

  getErrorCount(error: string): number {
    return this.errorCounts.get(error) || 0;
  }

  getRiskLevelCounts(): Record<string, number> {
    const counts: Record<string, number> = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    };
    this.riskLevelCounts.forEach((count, level) => {
      counts[level] = count;
    });
    return counts;
  }

  startProcessing(traceId: string): void {
    this.processingStartTimes.set(traceId, Date.now());
  }

  endProcessing(traceId: string): void {
    const startTime = this.processingStartTimes.get(traceId);
    if (startTime) {
      const processingTime = (Date.now() - startTime) / 1000; // 转换为秒
      this.processingTimes.set(traceId, processingTime);
      this.processingStartTimes.delete(traceId);
    }
  }

  getProcessingTime(traceId: string): number {
    return this.processingTimes.get(traceId) || 0;
  }

  getAverageProcessingTime(): number {
    const times = Array.from(this.processingTimes.values());
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  reset(): void {
    this.eventCounts.clear();
    this.errorCounts.clear();
    this.riskLevelCounts.clear();
    this.processingTimes.clear();
    this.processingStartTimes.clear();
  }
}
