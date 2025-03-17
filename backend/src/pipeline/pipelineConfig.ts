import { z } from 'zod';
import { Logger } from '../utils/logger';
import { RiskLevel } from '../types/events';

const PipelineConfigSchema = z.object({
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsPort: z.number().positive().default(9090),
    metricsInterval: z.number().positive().default(15), // seconds
    metricsPrefix: z.string().default('chainintel'),
    metricsBuckets: z.array(z.number()).default([0.1, 0.5, 1, 2, 5]),
    webhooks: z.object({
      slack: z.string().optional(),
      dingtalk: z.string().optional(),
      feishu: z.string().optional(),
    }),
  }),
  notification: z.object({
    riskThresholds: z.object({
      medium: z.number().min(0).max(1).default(0.4),
      high: z.number().min(0).max(1).default(0.7),
      critical: z.number().min(0).max(1).default(0.9),
    }),
    channels: z.record(z.array(z.string())).default({
      low: [],
      medium: ['slack'],
      high: ['slack', 'dingtalk'],
      critical: ['slack', 'dingtalk', 'feishu'],
    }),
  }),
  profile: z.object({
    apiUrl: z.string().url(),
    cacheTTL: z.number().positive().default(3600), // seconds
    fetchTimeout: z.number().positive().default(15000), // milliseconds
    fetchRetries: z.number().nonnegative().default(3),
    minRetryDelay: z.number().positive().default(1000), // milliseconds
    maxRetryDelay: z.number().positive().default(5000), // milliseconds
    batchSize: z.number().positive().default(10),
    forceRefreshRiskScore: z.number().min(0).max(1).default(0.8),
  }),
  ai: z.object({
    mode: z.enum(['local', 'api']).default('api'),
    provider: z.enum(['openai', 'gemini', 'claude']).default('openai'),
    model: z.string().default('gpt-4'),
    maxTokens: z.number().positive().default(2048),
    temperature: z.number().min(0).max(2).default(0.7),
    localModelPath: z.string().optional(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'text']).default('json'),
    timestampFormat: z.string().default('YYYY-MM-DD HH:mm:ss.SSS'),
  }),
  maxRetries: z.number().nonnegative().default(3),
  retryDelay: z.number().nonnegative().default(1000), // milliseconds
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

export const defaultConfig: PipelineConfig = {
  monitoring: {
    enabled: true,
    metricsPort: 9090,
    metricsInterval: 15,
    metricsPrefix: 'chainintel',
    metricsBuckets: [0.1, 0.5, 1, 2, 5],
    webhooks: {},
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
    apiUrl: process.env.PROFILE_API_URL || 'http://localhost:3000',
    cacheTTL: 3600,
    fetchTimeout: 15000,
    fetchRetries: 3,
    minRetryDelay: 1000,
    maxRetryDelay: 5000,
    batchSize: 10,
    forceRefreshRiskScore: 0.8,
  },
  ai: {
    mode: 'api',
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 2048,
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

export function getRiskLevel(score: number, config: PipelineConfig): RiskLevel {
  if (score >= config.notification.riskThresholds.critical) {
    return RiskLevel.CRITICAL;
  }
  if (score >= config.notification.riskThresholds.high) {
    return RiskLevel.HIGH;
  }
  if (score >= config.notification.riskThresholds.medium) {
    return RiskLevel.MEDIUM;
  }
  return RiskLevel.LOW;
}

export function getNotificationChannels(score: number, config: PipelineConfig): string[] {
  const level = getRiskLevel(score, config);
  return config.notification.channels[level] || [];
}

export function validateConfig(config: PipelineConfig): void {
  try {
    PipelineConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Invalid pipeline configuration:\n${errors}`);
    }
    throw error;
  }
}

export async function loadConfig(logger: Logger): Promise<PipelineConfig> {
  try {
    // 从环境变量加载配置
    const config: Partial<PipelineConfig> = {
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
        metricsInterval: parseInt(process.env.METRICS_INTERVAL || '15', 10),
        metricsPrefix: process.env.METRICS_PREFIX || 'chainintel',
        metricsBuckets: (process.env.METRICS_BUCKETS || '0.1,0.5,1,2,5')
          .split(',')
          .map((n) => parseFloat(n)),
        webhooks: {
          slack: process.env.SLACK_WEBHOOK_URL,
          dingtalk: process.env.DINGTALK_WEBHOOK_URL,
          feishu: process.env.FEISHU_WEBHOOK_URL,
        },
      },
      notification: {
        riskThresholds: {
          medium: parseFloat(process.env.RISK_THRESHOLD_MEDIUM || '0.4'),
          high: parseFloat(process.env.RISK_THRESHOLD_HIGH || '0.7'),
          critical: parseFloat(process.env.RISK_THRESHOLD_CRITICAL || '0.9'),
        },
        channels: {
          low: (process.env.NOTIFICATION_CHANNELS_LOW || '').split(',').filter(Boolean),
          medium: (process.env.NOTIFICATION_CHANNELS_MEDIUM || 'slack').split(',').filter(Boolean),
          high: (process.env.NOTIFICATION_CHANNELS_HIGH || 'slack,dingtalk')
            .split(',')
            .filter(Boolean),
          critical: (process.env.NOTIFICATION_CHANNELS_CRITICAL || 'slack,dingtalk,feishu')
            .split(',')
            .filter(Boolean),
        },
      },
      profile: {
        apiUrl: process.env.PROFILE_API_URL || 'http://localhost:3000',
        cacheTTL: parseInt(process.env.PROFILE_CACHE_TTL || '3600', 10),
        fetchTimeout: parseInt(process.env.PROFILE_FETCH_TIMEOUT || '15000', 10),
        fetchRetries: parseInt(process.env.PROFILE_FETCH_RETRIES || '3', 10),
        minRetryDelay: parseInt(process.env.PROFILE_MIN_RETRY_DELAY || '1000', 10),
        maxRetryDelay: parseInt(process.env.PROFILE_MAX_RETRY_DELAY || '5000', 10),
        batchSize: parseInt(process.env.PROFILE_BATCH_SIZE || '10', 10),
        forceRefreshRiskScore: parseFloat(process.env.PROFILE_FORCE_REFRESH_RISK_SCORE || '0.8'),
      },
      ai: {
        mode: (process.env.AI_MODE || 'api') as 'local' | 'api',
        provider: (process.env.AI_PROVIDER || 'openai') as 'openai' | 'gemini' | 'claude',
        model: process.env.AI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        localModelPath: process.env.AI_LOCAL_MODEL_PATH,
      },
      logging: {
        level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
        format: (process.env.LOG_FORMAT || 'json') as 'json' | 'text',
        timestampFormat: process.env.LOG_TIMESTAMP_FORMAT || 'YYYY-MM-DD HH:mm:ss.SSS',
      },
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
    };

    // 合并默认配置
    const finalConfig = {
      ...defaultConfig,
      ...config,
    };

    // 验证配置
    validateConfig(finalConfig);

    logger.info('Pipeline configuration loaded successfully', {
      config: finalConfig,
    });
    return finalConfig;
  } catch (error) {
    logger.error('Failed to load pipeline configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
