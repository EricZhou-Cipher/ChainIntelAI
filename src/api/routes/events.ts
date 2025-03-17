import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Logger } from '../../utils/logger';
import { EventRecord } from '../../database/models/EventRecord';
import { EventType, EventStatus } from '../../types/events';

// 请求验证Schema
const EventQuerySchema = z.object({
  chainId: z.number().optional(),
  type: z.nativeEnum(EventType).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const EventCreateSchema = z.object({
  type: z.nativeEnum(EventType),
  timestamp: z.number(),
  chainId: z.number(),
  blockNumber: z.number(),
  transactionHash: z.string(),
  from: z.string(),
  to: z.string(),
  value: z.string().optional(),
  tokenAddress: z.string().optional(),
  methodName: z.string().optional(),
  methodSignature: z.string().optional(),
  input: z.string().optional(),
  output: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * 事件路由
 */
export default function eventsRoutes({ logger }: { logger: Logger }): Router {
  const router = Router();
  
  // 查询事件列表
  router.get('/', async (req: Request, res: Response) => {
    try {
      // 验证查询参数
      const query = EventQuerySchema.parse({
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        chainId: req.query.chainId ? parseInt(req.query.chainId as string) : undefined,
        startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
      });
      
      // 构建查询条件
      const filter: any = {};
      
      if (query.chainId) {
        filter.chainId = query.chainId;
      }
      
      if (query.type) {
        filter.type = query.type;
      }
      
      if (query.from) {
        filter.from = query.from;
      }
      
      if (query.to) {
        filter.to = query.to;
      }
      
      if (query.status) {
        filter.status = query.status;
      }
      
      if (query.startTime || query.endTime) {
        filter.timestamp = {};
        if (query.startTime) {
          filter.timestamp.$gte = query.startTime;
        }
        if (query.endTime) {
          filter.timestamp.$lte = query.endTime;
        }
      }
      
      // 执行查询
      const [events, total] = await Promise.all([
        EventRecord.find(filter)
          .sort({ timestamp: -1 })
          .skip((query.page - 1) * query.limit)
          .limit(query.limit),
        EventRecord.countDocuments(filter),
      ]);
      
      res.status(200).json({
        status: 'ok',
        data: {
          events,
          pagination: {
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
          },
        },
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`查询事件列表失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
        query: req.query,
      });
      
      res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Invalid query parameters',
        traceId: req.traceId,
      });
    }
  });
  
  // 创建事件
  router.post('/', async (req: Request, res: Response) => {
    try {
      // 验证请求数据
      const data = EventCreateSchema.parse(req.body);
      
      // 创建事件记录
      const event = await EventRecord.createEvent({
        ...data,
        traceId: req.traceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: EventStatus.PENDING,
      });
      
      res.status(201).json({
        status: 'ok',
        data: event,
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`创建事件失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
        body: req.body,
      });
      
      res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Invalid request data',
        traceId: req.traceId,
      });
    }
  });
  
  // 获取事件详情
  router.get('/:traceId', async (req: Request, res: Response) => {
    try {
      const { traceId } = req.params;
      
      const event = await EventRecord.findByTraceId(traceId);
      
      if (!event) {
        res.status(404).json({
          status: 'error',
          message: 'Event not found',
          traceId: req.traceId,
        });
        return;
      }
      
      res.status(200).json({
        status: 'ok',
        data: event,
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`获取事件详情失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
        traceId: req.params.traceId,
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to get event details',
        traceId: req.traceId,
      });
    }
  });
  
  return router;
} 