import mongoose from 'mongoose';
import { Logger } from '../utils/logger';

// 数据库连接状态
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// 数据库配置
export interface DatabaseConfig {
  url: string;
  options?: mongoose.ConnectOptions;
}

/**
 * 数据库连接管理类
 */
export class Database {
  private config: DatabaseConfig;
  private logger: Logger;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private connection: mongoose.Connection | null = null;

  constructor(config: DatabaseConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // 监听连接事件
    mongoose.connection.on('connected', () => {
      this.state = ConnectionState.CONNECTED;
      this.logger.info('数据库连接成功');
    });

    mongoose.connection.on('error', (error) => {
      this.state = ConnectionState.ERROR;
      this.logger.error('数据库连接错误', { error });
    });

    mongoose.connection.on('disconnected', () => {
      this.state = ConnectionState.DISCONNECTED;
      this.logger.warn('数据库连接断开');
    });
  }

  /**
   * 连接数据库
   */
  public async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTING) {
      this.logger.warn('数据库正在连接中');
      return;
    }

    if (this.state === ConnectionState.CONNECTED) {
      this.logger.warn('数据库已连接');
      return;
    }

    try {
      this.state = ConnectionState.CONNECTING;
      this.logger.info('正在连接数据库...');

      await mongoose.connect(this.config.url, this.config.options);
      this.connection = mongoose.connection;

      this.logger.info('数据库连接成功');
    } catch (error) {
      this.state = ConnectionState.ERROR;
      this.logger.error('数据库连接失败', { error });
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    if (this.state === ConnectionState.DISCONNECTED) {
      this.logger.warn('数据库已断开连接');
      return;
    }

    try {
      this.logger.info('正在关闭数据库连接...');
      await mongoose.connection.close();
      this.state = ConnectionState.DISCONNECTED;
      this.connection = null;

      this.logger.info('数据库连接已关闭');
    } catch (error) {
      this.logger.error('关闭数据库连接失败', { error });
      throw error;
    }
  }

  /**
   * 获取连接状态
   */
  public getStatus(): ConnectionState {
    return this.state;
  }

  /**
   * 获取连接实例
   */
  public getConnection(): mongoose.Connection | null {
    return this.connection;
  }

  /**
   * 检查连接是否健康
   */
  public async checkHealth(): Promise<boolean> {
    try {
      if (!this.connection) {
        return false;
      }

      // 执行ping命令检查连接
      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('数据库健康检查失败', { error });
      return false;
    }
  }
} 