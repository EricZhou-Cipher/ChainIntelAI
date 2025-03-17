import { Logger } from '../utils/logger';
import { EventStatus } from '../types/events';

// 管道指标接口
export interface PipelineMetrics {
  // 事件处理统计
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  pendingEvents: number;
  
  // 性能指标
  averageProcessingTime: number;
  maxProcessingTime: number;
  minProcessingTime: number;
  eventsPerSecond: number;
  
  // 错误统计
  totalErrors: number;
  errorsByType: Record<string, number>;
  
  // 时间戳
  lastUpdate: Date;
}

/**
 * 管道监控类
 */
export class PipelineMonitor {
  private logger: Logger;
  private metrics: PipelineMetrics;
  private processingTimes: number[];
  private lastSecondEvents: number;
  private lastSecondUpdate: Date;
  
  constructor(logger: Logger) {
    this.logger = logger;
    this.processingTimes = [];
    this.lastSecondEvents = 0;
    this.lastSecondUpdate = new Date();
    
    // 初始化指标
    this.metrics = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      pendingEvents: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: 0,
      eventsPerSecond: 0,
      totalErrors: 0,
      errorsByType: {},
      lastUpdate: new Date(),
    };
    
    // 每秒更新吞吐量
    setInterval(() => this.updateThroughput(), 1000);
  }
  
  /**
   * 记录事件处理
   */
  public recordEventProcessing(
    status: EventStatus,
    processingTime: number,
    error?: Error
  ): void {
    // 更新事件计数
    this.metrics.totalEvents++;
    
    switch (status) {
      case EventStatus.COMPLETED:
        this.metrics.processedEvents++;
        break;
      case EventStatus.FAILED:
        this.metrics.failedEvents++;
        break;
      case EventStatus.PENDING:
        this.metrics.pendingEvents++;
        break;
    }
    
    // 更新处理时间
    this.processingTimes.push(processingTime);
    this.updateProcessingTimeMetrics();
    
    // 更新错误统计
    if (error) {
      this.metrics.totalErrors++;
      const errorType = error.name || 'UnknownError';
      this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
    }
    
    // 更新最后更新时间
    this.metrics.lastUpdate = new Date();
    
    // 更新每秒事件数
    this.lastSecondEvents++;
  }
  
  /**
   * 获取指标
   */
  public async getMetrics(): Promise<PipelineMetrics> {
    return this.metrics;
  }
  
  /**
   * 重置指标
   */
  public async resetMetrics(): Promise<void> {
    this.metrics = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      pendingEvents: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: 0,
      eventsPerSecond: 0,
      totalErrors: 0,
      errorsByType: {},
      lastUpdate: new Date(),
    };
    
    this.processingTimes = [];
    this.lastSecondEvents = 0;
    this.lastSecondUpdate = new Date();
    
    this.logger.info('管道指标已重置');
  }
  
  /**
   * 更新处理时间指标
   */
  private updateProcessingTimeMetrics(): void {
    if (this.processingTimes.length === 0) {
      return;
    }
    
    // 计算平均处理时间
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageProcessingTime = sum / this.processingTimes.length;
    
    // 计算最大处理时间
    this.metrics.maxProcessingTime = Math.max(...this.processingTimes);
    
    // 计算最小处理时间
    this.metrics.minProcessingTime = Math.min(...this.processingTimes);
  }
  
  /**
   * 更新吞吐量
   */
  private updateThroughput(): void {
    const now = new Date();
    const seconds = (now.getTime() - this.lastSecondUpdate.getTime()) / 1000;
    
    if (seconds > 0) {
      this.metrics.eventsPerSecond = this.lastSecondEvents / seconds;
    }
    
    this.lastSecondEvents = 0;
    this.lastSecondUpdate = now;
  }
} 