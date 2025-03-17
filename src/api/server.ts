import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { Database } from '../database/db';
import { EventPipeline } from '../pipeline/eventPipeline';
import { PipelineMonitor } from '../pipeline/pipelineMonitor';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';
import eventsRoutes from './routes/events';
import profilesRoutes from './routes/profiles';
import { Config } from '../config';
import { generateTraceId } from '../utils/traceId';

// API服务器配置接口
export interface ApiServerConfig {
  port: number;
  logger: Logger;
  pipeline: EventPipeline;
  pipelineMonitor: PipelineMonitor;
  db: Database;
}

/**
 * API服务器类
 */
export class ApiServer {
  private app: express.Application;
  private logger: Logger;
  private config: Config;
  private db: Database;
  
  constructor(config: Config, logger: Logger, db: Database) {
    this.app = express();
    this.logger = logger;
    this.config = config;
    this.db = db;
    
    // 中间件
    this.setupMiddleware();
    
    // 路由
    this.setupRoutes();
    
    // 错误处理
    this.setupErrorHandling();
  }
  
  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 安全头
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors());
    
    // 压缩
    this.app.use(compression());
    
    // JSON解析
    this.app.use(express.json());
    
    // 请求追踪
    this.app.use((req, res, next) => {
      const traceId = generateTraceId();
      req.traceId = traceId;
      res.setHeader('X-Trace-ID', traceId);
      next();
    });
  }
  
  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.use('/health', healthRoutes({ db: this.db, logger: this.logger }));
    
    // 指标
    this.app.use('/metrics', metricsRoutes({ pipelineMonitor: null, logger: this.logger }));
    
    // 事件
    this.app.use('/events', eventsRoutes({ logger: this.logger }));
    
    // 地址画像
    this.app.use('/profiles', profilesRoutes({ logger: this.logger }));
  }
  
  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Not Found',
        traceId: req.traceId,
      });
    });
    
    // 错误处理
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error(`请求处理失败 [${req.traceId}]`, {
        error: err.message,
        stack: err.stack,
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        traceId: req.traceId,
      });
    });
  }
  
  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    try {
      const port = this.config.app.port;
      
      this.app.listen(port, () => {
        this.logger.info(`API服务器已启动，监听端口 ${port}`);
      });
    } catch (error) {
      this.logger.error('启动API服务器失败', { error });
      throw error;
    }
  }
  
  /**
   * 关闭服务器
   */
  public async stop(): Promise<void> {
    try {
      // 关闭数据库连接
      await this.db.close();
      
      this.logger.info('API服务器已关闭');
    } catch (error) {
      this.logger.error('关闭API服务器失败', { error });
      throw error;
    }
  }
}

// 扩展Express Request接口以包含traceId
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
} 