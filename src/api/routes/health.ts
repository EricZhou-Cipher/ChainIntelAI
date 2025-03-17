import { Router, Request, Response } from 'express';
import { Logger } from '../../utils/logger';
import { Database } from '../../database/db';
import { RedisManager } from '../../database/redis';

/**
 * 健康检查路由
 */
export default function healthRoutes({ 
  db, 
  redis, 
  logger 
}: { 
  db: Database; 
  redis: RedisManager; 
  logger: Logger 
}): Router {
  const router = Router();
  
  // 健康检查
  router.get('/', async (req: Request, res: Response) => {
    try {
      // 检查数据库连接
      const dbHealth = await db.checkHealth();
      
      // 检查Redis连接
      const redisHealth = await redis.checkHealth();
      
      // 返回健康状态
      res.status(200).json({
        status: 'ok',
        data: {
          timestamp: new Date().toISOString(),
          services: {
            database: {
              status: dbHealth ? 'healthy' : 'unhealthy',
              details: {
                connectionState: db.getStatus(),
              },
            },
            redis: {
              status: redisHealth ? 'healthy' : 'unhealthy',
              details: {
                connectionState: redis.getStatus(),
              },
            },
          },
        },
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`健康检查失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        traceId: req.traceId,
      });
    }
  });
  
  return router;
} 