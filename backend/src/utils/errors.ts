/**
 * 自定义错误类
 * 提供更详细的错误信息和类型
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  NETWORK = 'NETWORK_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  code?: string;
  field?: string;
  resource?: string;
  details?: Record<string, any>;
  cause?: Error;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details: ErrorDetails;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    details: ErrorDetails = {},
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.isOperational = isOperational; // 是否为可预期的操作错误

    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 创建验证错误
   */
  static validation(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.VALIDATION, 400, details);
  }

  /**
   * 创建数据库错误
   */
  static database(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.DATABASE, 500, details, false);
  }

  /**
   * 创建网络错误
   */
  static network(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.NETWORK, 503, details);
  }

  /**
   * 创建认证错误
   */
  static authentication(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.AUTHENTICATION, 401, details);
  }

  /**
   * 创建授权错误
   */
  static authorization(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.AUTHORIZATION, 403, details);
  }

  /**
   * 创建资源未找到错误
   */
  static notFound(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.NOT_FOUND, 404, details);
  }

  /**
   * 创建速率限制错误
   */
  static rateLimit(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.RATE_LIMIT, 429, details);
  }

  /**
   * 创建外部服务错误
   */
  static externalService(message: string, details: ErrorDetails = {}): AppError {
    return new AppError(message, ErrorType.EXTERNAL_SERVICE, 502, details);
  }

  /**
   * 将普通 Error 转换为 AppError
   */
  static fromError(error: Error, type: ErrorType = ErrorType.UNKNOWN): AppError {
    return new AppError(
      error.message,
      type,
      500,
      { cause: error },
      false
    );
  }

  /**
   * 序列化错误为 JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
} 