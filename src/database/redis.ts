import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { Config } from '../config';

// Redis连接状态
export enum RedisConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Redis连接管理类
 */
export class RedisManager {
  private client: RedisClientType;
  private logger: Logger;
  private config: Config;
  private state: RedisConnectionState = RedisConnectionState.DISCONNECTED;
  
  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    // 创建Redis客户端
    this.client = createClient({
      socket: {
        host: this.config.redis.host,
        port: this.config.redis.port,
      },
      password: this.config.redis.password,
      database: this.config.redis.db,
    });
    
    // 监听连接事件
    this.client.on('connect', () => {
      this.state = RedisConnectionState.CONNECTED;
      this.logger.info('Redis连接成功');
    });
    
    this.client.on('error', (error) => {
      this.state = RedisConnectionState.ERROR;
      this.logger.error('Redis连接错误', { error });
    });
    
    this.client.on('end', () => {
      this.state = RedisConnectionState.DISCONNECTED;
      this.logger.warn('Redis连接断开');
    });
  }
  
  /**
   * 连接Redis
   */
  public async connect(): Promise<void> {
    if (this.state === RedisConnectionState.CONNECTING) {
      this.logger.warn('Redis正在连接中');
      return;
    }
    
    if (this.state === RedisConnectionState.CONNECTED) {
      this.logger.warn('Redis已连接');
      return;
    }
    
    try {
      this.state = RedisConnectionState.CONNECTING;
      this.logger.info('正在连接Redis...');
      
      await this.client.connect();
      
      this.logger.info('Redis连接成功');
    } catch (error) {
      this.state = RedisConnectionState.ERROR;
      this.logger.error('Redis连接失败', { error });
      throw error;
    }
  }
  
  /**
   * 关闭Redis连接
   */
  public async close(): Promise<void> {
    if (this.state === RedisConnectionState.DISCONNECTED) {
      this.logger.warn('Redis已断开连接');
      return;
    }
    
    try {
      this.logger.info('正在关闭Redis连接...');
      await this.client.quit();
      this.state = RedisConnectionState.DISCONNECTED;
      
      this.logger.info('Redis连接已关闭');
    } catch (error) {
      this.logger.error('关闭Redis连接失败', { error });
      throw error;
    }
  }
  
  /**
   * 获取连接状态
   */
  public getStatus(): RedisConnectionState {
    return this.state;
  }
  
  /**
   * 获取Redis客户端
   */
  public getClient(): RedisClientType {
    return this.client;
  }
  
  /**
   * 检查连接是否健康
   */
  public async checkHealth(): Promise<boolean> {
    try {
      if (this.state !== RedisConnectionState.CONNECTED) {
        return false;
      }
      
      // 执行ping命令检查连接
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis健康检查失败', { error });
      return false;
    }
  }
} 