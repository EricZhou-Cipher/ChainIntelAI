import { z } from 'zod';

// 应用配置Schema
const AppConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  env: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// 数据库配置Schema
const DatabaseConfigSchema = z.object({
  url: z.string().url(),
  options: z.object({
    maxPoolSize: z.number().min(1).default(10),
    minPoolSize: z.number().min(1).default(5),
    serverSelectionTimeoutMS: z.number().min(1).default(5000),
    socketTimeoutMS: z.number().min(1).default(45000),
  }).optional(),
});

// Redis配置Schema
const RedisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().min(1).max(65535).default(6379),
  password: z.string().optional(),
  db: z.number().min(0).default(0),
});

// 区块链配置Schema
const BlockchainConfigSchema = z.object({
  chains: z.array(z.object({
    id: z.number(),
    name: z.string(),
    rpcUrl: z.string().url(),
    wsUrl: z.string().url().optional(),
    blockTime: z.number().min(1).default(12),
    confirmations: z.number().min(1).default(12),
  })),
});

// 通知配置Schema
const NotificationConfigSchema = z.object({
  slack: z.object({
    webhookUrl: z.string().url(),
    channel: z.string(),
  }).optional(),
  telegram: z.object({
    botToken: z.string(),
    chatId: z.string(),
  }).optional(),
  email: z.object({
    smtp: z.object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean(),
      auth: z.object({
        user: z.string(),
        pass: z.string(),
      }),
    }),
    from: z.string().email(),
    to: z.array(z.string().email()),
  }).optional(),
});

// 完整配置Schema
const ConfigSchema = z.object({
  app: AppConfigSchema,
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  blockchain: BlockchainConfigSchema,
  notification: NotificationConfigSchema,
});

// 配置类型
export type Config = z.infer<typeof ConfigSchema>;

/**
 * 配置类
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  
  private constructor() {
    // 从环境变量加载配置
    const envConfig = {
      app: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
        env: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
      },
      database: {
        url: process.env.MONGODB_URI || 'mongodb://localhost:27017/chainintel',
        options: {
          maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE ? parseInt(process.env.MONGODB_MAX_POOL_SIZE) : 10,
          minPoolSize: process.env.MONGODB_MIN_POOL_SIZE ? parseInt(process.env.MONGODB_MIN_POOL_SIZE) : 5,
          serverSelectionTimeoutMS: process.env.MONGODB_SERVER_SELECTION_TIMEOUT ? parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) : 5000,
          socketTimeoutMS: process.env.MONGODB_SOCKET_TIMEOUT ? parseInt(process.env.MONGODB_SOCKET_TIMEOUT) : 45000,
        },
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
      },
      blockchain: {
        chains: [
          {
            id: 1,
            name: 'Ethereum Mainnet',
            rpcUrl: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
            wsUrl: process.env.ETH_WS_URL,
            blockTime: 12,
            confirmations: 12,
          },
          {
            id: 56,
            name: 'BSC Mainnet',
            rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
            wsUrl: process.env.BSC_WS_URL,
            blockTime: 3,
            confirmations: 15,
          },
        ],
      },
      notification: {
        slack: process.env.SLACK_WEBHOOK_URL ? {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
        } : undefined,
        telegram: process.env.TELEGRAM_BOT_TOKEN ? {
          botToken: process.env.TELEGRAM_BOT_TOKEN,
          chatId: process.env.TELEGRAM_CHAT_ID || '',
        } : undefined,
        email: process.env.SMTP_HOST ? {
          smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || '',
            },
          },
          from: process.env.EMAIL_FROM || 'noreply@chainintel.ai',
          to: (process.env.EMAIL_TO || '').split(',').map(email => email.trim()),
        } : undefined,
      },
    };
    
    // 验证配置
    this.config = ConfigSchema.parse(envConfig);
  }
  
  /**
   * 获取配置实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  /**
   * 获取配置
   */
  public getConfig(): Config {
    return this.config;
  }
  
  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<Config>): void {
    this.config = ConfigSchema.parse({
      ...this.config,
      ...newConfig,
    });
  }
} 