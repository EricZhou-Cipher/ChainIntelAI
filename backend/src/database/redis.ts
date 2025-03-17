import Redis from 'ioredis';
import { databaseConfig } from './config/database.config';
import { createLogger } from '../utils/logger';

// 创建日志记录器
const logger = createLogger({
  level: 'info',
  format: 'json',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss',
});

export const redis = new Redis({
  host: databaseConfig.redis.host,
  port: databaseConfig.redis.port,
  password: databaseConfig.redis.password,
  db: databaseConfig.redis.db,
  keyPrefix: databaseConfig.redis.keyPrefix,
});

// 监听连接事件
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('close', () => {
  console.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting');
});

// 缓存工具函数
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get error', { key, error });
      return null;
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value));
      } else {
        await redis.set(key, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Redis set error', { key, error });
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Redis delete error', { key, error });
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      logger.error('Redis exists error', { key, error });
      return false;
    }
  },
};
