import { Router, Request, Response } from 'express';
import { Logger } from '../../utils/logger';
import { PipelineMonitor } from '../../pipeline/pipelineMonitor';

/**
 * 指标路由
 */
export default function metricsRoutes({ 
  pipelineMonitor, 
  logger 
}: { 
  pipelineMonitor: PipelineMonitor; 
  logger: Logger 
}): Router {
  const router = Router();
  
  // 获取指标
  router.get('/', async (req: Request, res: Response) => {
    try {
      // 获取管道监控指标
      const metrics = await pipelineMonitor.getMetrics();
      
      // 返回指标数据
      res.status(200).json({
        status: 'ok',
        data: {
          timestamp: new Date().toISOString(),
          metrics: {
            pipeline: {
              // 事件处理统计
              events: {
                total: metrics.totalEvents,
                processed: metrics.processedEvents,
                failed: metrics.failedEvents,
                pending: metrics.pendingEvents,
              },
              // 性能指标
              performance: {
                averageProcessingTime: metrics.averageProcessingTime,
                maxProcessingTime: metrics.maxProcessingTime,
                minProcessingTime: metrics.minProcessingTime,
                throughput: metrics.eventsPerSecond,
              },
              // 错误统计
              errors: {
                total: metrics.totalErrors,
                byType: metrics.errorsByType,
              },
              // 资源使用
              resources: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
              },
            },
          },
        },
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`获取指标失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to get metrics',
        traceId: req.traceId,
      });
    }
  });
  
  // 重置指标
  router.post('/reset', async (req: Request, res: Response) => {
    try {
      // 重置管道监控指标
      await pipelineMonitor.resetMetrics();
      
      res.status(200).json({
        status: 'ok',
        message: 'Metrics reset successfully',
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`重置指标失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset metrics',
        traceId: req.traceId,
      });
    }
  });
  
  return router;
} 