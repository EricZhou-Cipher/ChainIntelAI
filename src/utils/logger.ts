import { format } from 'winston';
import winston from 'winston';

// 日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// 日志接口
export interface Logger {
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

// 日志配置
export interface LoggerConfig {
  level: LogLevel;
  format?: 'json' | 'text';
  transports?: winston.transport[];
}

/**
 * 日志类
 */
export class WinstonLogger implements Logger {
  private logger: winston.Logger;
  
  constructor(config: LoggerConfig) {
    // 创建日志格式
    const logFormat = config.format === 'json'
      ? format.combine(
          format.timestamp(),
          format.json()
        )
      : format.combine(
          format.timestamp(),
          format.colorize(),
          format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length > 0
              ? ` ${JSON.stringify(meta)}`
              : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        );
    
    // 创建日志记录器
    this.logger = winston.createLogger({
      level: config.level,
      format: logFormat,
      transports: config.transports || [
        new winston.transports.Console(),
      ],
    });
  }
  
  error(message: string, meta?: Record<string, any>): void {
    this.logger.error(message, meta);
  }
  
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, meta);
  }
  
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, meta);
  }
  
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, meta);
  }
}

// 创建默认日志记录器
export const createLogger = (config: LoggerConfig = { level: LogLevel.INFO }): Logger => {
  return new WinstonLogger(config);
}; 