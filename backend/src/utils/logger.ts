/**
 * @file 日志工具
 * @description 定义日志记录器接口和实现
 */

import winston from 'winston';
import { format } from 'winston';
import { v4 as uuidv4 } from 'uuid';

export interface LoggerContext {
  traceId?: string;
  [key: string]: any;
}

export interface LoggerConfig {
  level?: string;
  format?: 'json' | 'text';
  timestampFormat?: string;
}

export interface ILogger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  getTraceId(): string;
  setTraceId(traceId: string): void;
  setDefaultContext(context: Record<string, unknown>): void;
}

export class Logger implements ILogger {
  protected traceId: string;
  private defaultContext: Record<string, unknown>;

  constructor() {
    this.traceId = '';
    this.defaultContext = {};
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.log(`[INFO] ${this.formatMessage(message)}`, { ...this.defaultContext, ...context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${this.formatMessage(message)}`, { ...this.defaultContext, ...context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${this.formatMessage(message)}`, { ...this.defaultContext, ...context });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${this.formatMessage(message)}`, { ...this.defaultContext, ...context });
  }

  getTraceId(): string {
    return this.traceId;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  setDefaultContext(context: Record<string, unknown>): void {
    this.defaultContext = context;
  }

  private formatMessage(message: string): string {
    return this.traceId ? `[${this.traceId}] ${message}` : message;
  }
}

export const logger = new Logger();

export class WinstonLogger implements ILogger {
  private logger: any;
  private traceId: string;
  private defaultContext: Record<string, unknown>;

  constructor() {
    this.logger = console;
    this.traceId = '';
    this.defaultContext = {};
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(this.formatMessage(message), { ...this.defaultContext, ...context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(this.formatMessage(message), { ...this.defaultContext, ...context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(this.formatMessage(message), { ...this.defaultContext, ...context });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(this.formatMessage(message), { ...this.defaultContext, ...context });
  }

  getTraceId(): string {
    return this.traceId;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  setDefaultContext(context: Record<string, unknown>): void {
    this.defaultContext = context;
  }

  private formatMessage(message: string): string {
    return this.traceId ? `[${this.traceId}] ${message}` : message;
  }
}

export const createLogger = (config: LoggerConfig): ILogger => {
  return new Logger();
};
