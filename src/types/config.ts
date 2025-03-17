import { ProfilerConfig } from './profile.js';

// 应用配置
export interface AppConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// 数据库配置
export interface DatabaseConfig {
  url: string;
  options?: {
    maxPoolSize: number;
    minPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
  };
}

// Redis配置
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

// 区块链配置
export interface BlockchainConfig {
  chains: {
    id: number;
    name: string;
    rpcUrl: string;
    wsUrl?: string;
    blockTime: number;
    confirmations: number;
  }[];
}

// 通知配置
export interface NotificationConfig {
  slack?: {
    webhookUrl: string;
    channel: string;
  };
  telegram?: {
    botToken: string;
    chatId: string;
  };
  email?: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
    to: string[];
  };
}

// 完整配置
export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  blockchain: BlockchainConfig;
  notification: NotificationConfig;
  profiler: ProfilerConfig;
} 