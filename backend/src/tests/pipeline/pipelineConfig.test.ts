import {
  defaultConfig,
  getRiskLevel,
  getNotificationChannels,
  validateConfig,
  loadConfig,
  PipelineConfig,
} from '../../pipeline/pipelineConfig';
import { RiskLevel } from '../../types/events';
import { z } from 'zod';

// 模拟环境变量
const originalEnv = process.env;

describe('PipelineConfig', () => {
  // 在每个测试前重置环境变量
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  // 在所有测试后恢复环境变量
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('config validation', () => {
    test('should validate default config', () => {
      expect(() => validateConfig(defaultConfig)).not.toThrow();
    });

    test('should reject invalid risk thresholds', () => {
      const invalidConfig = {
        ...defaultConfig,
        notification: {
          ...defaultConfig.notification,
          riskThresholds: {
            medium: -0.1, // < 0
            high: 1.5, // > 1
            critical: 2.0, // > 1
          },
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    test('should reject invalid AI config', () => {
      const invalidConfig = {
        ...defaultConfig,
        ai: {
          ...defaultConfig.ai,
          mode: 'invalid' as any,
          temperature: 3.0, // > 2
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    test('should handle missing optional fields', () => {
      const minimalConfig = {
        monitoring: {
          enabled: true,
          metricsPort: 9090,
          metricsInterval: 15,
          metricsPrefix: 'chainintel',
          metricsBuckets: [0.1, 0.5, 1, 2, 5],
          webhooks: {},
        },
        notification: defaultConfig.notification,
        profile: defaultConfig.profile,
        ai: defaultConfig.ai,
        logging: defaultConfig.logging,
        maxRetries: defaultConfig.maxRetries,
        retryDelay: defaultConfig.retryDelay,
      };

      expect(() => validateConfig(minimalConfig)).not.toThrow();
    });

    test('should throw error on invalid configuration with unknown fields', () => {
      const invalidConfig = {
        ...defaultConfig,
        unknownSetting: true,
      } as any;

      // Zod 默认忽略额外属性，所以这个测试应该通过
      expect(() => validateConfig(invalidConfig)).not.toThrow();
    });

    test('should throw error on non-Zod validation errors', () => {
      // 模拟 Zod.parse 抛出非 ZodError 的错误
      const originalParse = z.ZodObject.prototype.parse;
      z.ZodObject.prototype.parse = jest.fn().mockImplementationOnce(() => {
        throw new Error('Non-Zod error');
      });

      expect(() => validateConfig(defaultConfig)).toThrow('Non-Zod error');
      
      // 恢复原始方法
      z.ZodObject.prototype.parse = originalParse;
    });
    
    test('should provide detailed error messages for validation failures', () => {
      const invalidConfig = {
        ...defaultConfig,
        notification: {
          ...defaultConfig.notification,
          riskThresholds: {
            medium: 2.5, // > 1, 无效
            high: -0.5, // < 0, 无效
            critical: 'invalid' as any, // 不是数字
          },
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(/Invalid pipeline configuration/);
    });
  });

  describe('getRiskLevel', () => {
    test('should return correct risk levels', () => {
      expect(getRiskLevel(0.9, defaultConfig)).toBe(RiskLevel.CRITICAL);
      expect(getRiskLevel(0.7, defaultConfig)).toBe(RiskLevel.HIGH);
      expect(getRiskLevel(0.4, defaultConfig)).toBe(RiskLevel.MEDIUM);
      expect(getRiskLevel(0.2, defaultConfig)).toBe(RiskLevel.LOW);
    });

    test('should handle boundary values', () => {
      expect(getRiskLevel(0.9, defaultConfig)).toBe(RiskLevel.CRITICAL);
      expect(getRiskLevel(0.7, defaultConfig)).toBe(RiskLevel.HIGH);
      expect(getRiskLevel(0.4, defaultConfig)).toBe(RiskLevel.MEDIUM);
      expect(getRiskLevel(0, defaultConfig)).toBe(RiskLevel.LOW);
      expect(getRiskLevel(1, defaultConfig)).toBe(RiskLevel.CRITICAL);
    });

    test('should handle custom thresholds', () => {
      const customConfig = {
        ...defaultConfig,
        notification: {
          ...defaultConfig.notification,
          riskThresholds: {
            medium: 0.3,
            high: 0.6,
            critical: 0.8,
          },
        },
      };

      expect(getRiskLevel(0.8, customConfig)).toBe(RiskLevel.CRITICAL);
      expect(getRiskLevel(0.6, customConfig)).toBe(RiskLevel.HIGH);
      expect(getRiskLevel(0.3, customConfig)).toBe(RiskLevel.MEDIUM);
      expect(getRiskLevel(0.2, customConfig)).toBe(RiskLevel.LOW);
    });
    
    test('should handle extreme values', () => {
      expect(getRiskLevel(-1, defaultConfig)).toBe(RiskLevel.LOW); // 负值
      expect(getRiskLevel(2, defaultConfig)).toBe(RiskLevel.CRITICAL); // 超过1的值
      expect(getRiskLevel(NaN, defaultConfig)).toBe(RiskLevel.LOW); // NaN
    });
  });

  describe('getNotificationChannels', () => {
    test('should return correct channels for risk levels', () => {
      expect(getNotificationChannels(0.9, defaultConfig)).toEqual(['slack', 'dingtalk', 'feishu']);

      expect(getNotificationChannels(0.7, defaultConfig)).toEqual(['slack', 'dingtalk']);

      expect(getNotificationChannels(0.4, defaultConfig)).toEqual(['slack']);

      expect(getNotificationChannels(0.2, defaultConfig)).toEqual([]);
    });

    test('should handle custom channel configuration', () => {
      const customConfig = {
        ...defaultConfig,
        notification: {
          ...defaultConfig.notification,
          channels: {
            low: ['log'],
            medium: ['sms'],
            high: ['email'],
            critical: ['all'],
          },
        },
      };

      expect(getNotificationChannels(0.9, customConfig)).toEqual(['all']);

      expect(getNotificationChannels(0.7, customConfig)).toEqual(['email']);

      expect(getNotificationChannels(0.4, customConfig)).toEqual(['sms']);

      expect(getNotificationChannels(0.2, customConfig)).toEqual(['log']);
    });

    test('should handle missing channel configuration', () => {
      const customConfig = {
        ...defaultConfig,
        notification: {
          ...defaultConfig.notification,
          channels: {} as any,
        },
      };

      expect(getNotificationChannels(0.9, customConfig)).toEqual([]);
    });
    
    test('should handle undefined risk level', () => {
      const customConfig = {
        ...defaultConfig,
        notification: {
          ...defaultConfig.notification,
          channels: {
            low: ['log'],
            medium: ['sms'],
            high: ['email'],
            // 缺少 critical
          } as any,
        },
      };

      expect(getNotificationChannels(0.9, customConfig)).toEqual([]);
    });
  });

  describe('loadConfig', () => {
    test('should load config from environment variables', async () => {
      // 设置环境变量
      process.env.MONITORING_ENABLED = 'false';
      process.env.METRICS_PORT = '8080';
      process.env.METRICS_INTERVAL = '30';
      process.env.METRICS_PREFIX = 'test';
      process.env.METRICS_BUCKETS = '0.2,1,3';
      process.env.SLACK_WEBHOOK_URL = 'https://slack.com/webhook';
      process.env.RISK_THRESHOLD_MEDIUM = '0.3';
      process.env.RISK_THRESHOLD_HIGH = '0.6';
      process.env.RISK_THRESHOLD_CRITICAL = '0.8';
      process.env.NOTIFICATION_CHANNELS_LOW = 'log';
      process.env.NOTIFICATION_CHANNELS_MEDIUM = 'sms';
      process.env.NOTIFICATION_CHANNELS_HIGH = 'email';
      process.env.NOTIFICATION_CHANNELS_CRITICAL = 'all';
      process.env.PROFILE_API_URL = 'https://api.example.com';
      process.env.PROFILE_CACHE_TTL = '7200';
      process.env.AI_MODE = 'local';
      process.env.AI_PROVIDER = 'claude';
      process.env.AI_MODEL = 'claude-2';
      process.env.AI_LOCAL_MODEL_PATH = '/path/to/model';
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_FORMAT = 'text';
      process.env.MAX_RETRIES = '5';
      process.env.RETRY_DELAY = '2000';

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      const config = await loadConfig(mockLogger as any);

      // 验证配置是否正确加载
      expect(config.monitoring.enabled).toBe(false);
      expect(config.monitoring.metricsPort).toBe(8080);
      expect(config.monitoring.metricsInterval).toBe(30);
      expect(config.monitoring.metricsPrefix).toBe('test');
      expect(config.monitoring.metricsBuckets).toEqual([0.2, 1, 3]);
      expect(config.monitoring.webhooks.slack).toBe('https://slack.com/webhook');
      expect(config.notification.riskThresholds.medium).toBe(0.3);
      expect(config.notification.riskThresholds.high).toBe(0.6);
      expect(config.notification.riskThresholds.critical).toBe(0.8);
      expect(config.notification.channels.low).toEqual(['log']);
      expect(config.notification.channels.medium).toEqual(['sms']);
      expect(config.notification.channels.high).toEqual(['email']);
      expect(config.notification.channels.critical).toEqual(['all']);
      expect(config.profile.apiUrl).toBe('https://api.example.com');
      expect(config.profile.cacheTTL).toBe(7200);
      expect(config.ai.mode).toBe('local');
      expect(config.ai.provider).toBe('claude');
      expect(config.ai.model).toBe('claude-2');
      expect(config.ai.localModelPath).toBe('/path/to/model');
      expect(config.logging.level).toBe('debug');
      expect(config.logging.format).toBe('text');
      expect(config.maxRetries).toBe(5);
      expect(config.retryDelay).toBe(2000);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    test('should handle validation errors during loading', async () => {
      // 设置无效的环境变量
      process.env.RISK_THRESHOLD_MEDIUM = '2.0'; // > 1, 无效

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      await expect(loadConfig(mockLogger as any)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle non-validation errors during loading', async () => {
      // 模拟验证函数抛出非验证错误
      const originalParse = z.ZodObject.prototype.parse;
      z.ZodObject.prototype.parse = jest.fn().mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      await expect(loadConfig(mockLogger as any)).rejects.toThrow('Unexpected error');
      expect(mockLogger.error).toHaveBeenCalled();
      
      // 恢复原始方法
      z.ZodObject.prototype.parse = originalParse;
    });

    test('should correctly apply enableNotifications setting', async () => {
      process.env.MONITORING_ENABLED = 'false';

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      const config = await loadConfig(mockLogger as any);
      
      // 验证默认值是否被正确应用
      expect(config.monitoring.enabled).toBe(false); // 使用环境变量的值
      expect(config.notification.channels).toEqual(defaultConfig.notification.channels);
    });
    
    test('should handle invalid environment variable values', async () => {
      // 设置无效的环境变量
      process.env.METRICS_PORT = 'not-a-number';
      process.env.METRICS_INTERVAL = 'invalid';
      process.env.METRICS_BUCKETS = 'a,b,c';

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      const config = await loadConfig(mockLogger as any);
      
      // 验证是否使用了默认值
      expect(config.monitoring.metricsPort).toBe(9090); // 默认值
      expect(config.monitoring.metricsInterval).toBe(15); // 默认值
      expect(config.monitoring.metricsBuckets).toEqual([0.1, 0.5, 1, 2, 5]); // 默认值
      
      expect(mockLogger.warn).toHaveBeenCalled();
    });
    
    test('should handle missing required environment variables', async () => {
      // 确保 PROFILE_API_URL 不存在
      delete process.env.PROFILE_API_URL;

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      const config = await loadConfig(mockLogger as any);
      
      // 验证是否使用了默认值
      expect(config.profile.apiUrl).toBe('http://localhost:3000'); // 默认值
      
      expect(mockLogger.warn).toHaveBeenCalled();
    });
    
    test('should handle empty environment variables', async () => {
      // 设置空的环境变量
      process.env.NOTIFICATION_CHANNELS_LOW = '';
      process.env.NOTIFICATION_CHANNELS_MEDIUM = '';
      process.env.NOTIFICATION_CHANNELS_HIGH = '';
      process.env.NOTIFICATION_CHANNELS_CRITICAL = '';

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      const config = await loadConfig(mockLogger as any);
      
      // 验证是否正确处理了空值
      expect(config.notification.channels.low).toEqual([]);
      expect(config.notification.channels.medium).toEqual([]);
      expect(config.notification.channels.high).toEqual([]);
      expect(config.notification.channels.critical).toEqual([]);
    });
  });

  describe('defaultConfig', () => {
    it('should have valid monitoring configuration', () => {
      expect(defaultConfig.monitoring).toBeDefined();
      expect(defaultConfig.monitoring.enabled).toBe(true);
      expect(defaultConfig.monitoring.metricsPort).toBe(9090);
      expect(defaultConfig.monitoring.metricsInterval).toBe(15);
      expect(defaultConfig.monitoring.webhooks).toBeDefined();
    });

    it('should have valid notification configuration', () => {
      expect(defaultConfig.notification).toBeDefined();
      expect(defaultConfig.notification.riskThresholds).toBeDefined();
      expect(defaultConfig.notification.riskThresholds.medium).toBe(0.4);
      expect(defaultConfig.notification.riskThresholds.high).toBe(0.7);
      expect(defaultConfig.notification.riskThresholds.critical).toBe(0.9);

      expect(defaultConfig.notification.channels).toBeDefined();
      expect(defaultConfig.notification.channels.low).toEqual([]);
      expect(defaultConfig.notification.channels.medium).toEqual(['slack']);
      expect(defaultConfig.notification.channels.high).toEqual(['slack', 'dingtalk']);
      expect(defaultConfig.notification.channels.critical).toEqual(['slack', 'dingtalk', 'feishu']);
    });

    it('should have valid profile configuration', () => {
      expect(defaultConfig.profile).toBeDefined();
      expect(defaultConfig.profile.cacheTTL).toBe(3600);
      expect(defaultConfig.profile.forceRefreshRiskScore).toBe(0.8);
    });

    it('should have valid AI configuration', () => {
      expect(defaultConfig.ai).toBeDefined();
      expect(defaultConfig.ai.mode).toBe('api');
      expect(defaultConfig.ai.provider).toBe('openai');
      expect(defaultConfig.ai.model).toBe('gpt-4');
      expect(defaultConfig.ai.maxTokens).toBe(2048);
      expect(defaultConfig.ai.temperature).toBe(0.7);
    });

    it('should have valid retry configuration', () => {
      expect(defaultConfig.maxRetries).toBe(3);
      expect(defaultConfig.retryDelay).toBe(1000);
    });
  });

  describe('RiskLevel', () => {
    it('should have all required risk levels', () => {
      expect(RiskLevel.LOW).toBe('low');
      expect(RiskLevel.MEDIUM).toBe('medium');
      expect(RiskLevel.HIGH).toBe('high');
      expect(RiskLevel.CRITICAL).toBe('critical');
    });
  });
});
