import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Logger } from '../../utils/logger';
import { AddressProfile } from '../../database/models/AddressProfile';
import { RiskLevel } from '../../types/events';

// 请求验证Schema
const ProfileQuerySchema = z.object({
  chainId: z.number().optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const ProfileUpdateSchema = z.object({
  riskScore: z.number().min(0).max(100).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  riskFactors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * 地址画像路由
 */
export default function profilesRoutes({ logger }: { logger: Logger }): Router {
  const router = Router();
  
  // 查询地址画像列表
  router.get('/', async (req: Request, res: Response) => {
    try {
      // 验证查询参数
      const query = ProfileQuerySchema.parse({
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        chainId: req.query.chainId ? parseInt(req.query.chainId as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      });
      
      // 构建查询条件
      const filter: any = {};
      
      if (query.chainId) {
        filter.chainId = query.chainId;
      }
      
      if (query.riskLevel) {
        filter.riskLevel = query.riskLevel;
      }
      
      if (query.tags && query.tags.length > 0) {
        filter.tags = { $in: query.tags };
      }
      
      // 执行查询
      const [profiles, total] = await Promise.all([
        AddressProfile.find(filter)
          .sort({ lastRiskUpdate: -1 })
          .skip((query.page - 1) * query.limit)
          .limit(query.limit),
        AddressProfile.countDocuments(filter),
      ]);
      
      res.status(200).json({
        status: 'ok',
        data: {
          profiles,
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
      logger.error(`查询地址画像列表失败 [${req.traceId}]`, {
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
  
  // 获取地址画像详情
  router.get('/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const chainId = req.query.chainId ? parseInt(req.query.chainId as string) : 1;
      
      const profile = await AddressProfile.findByAddress(address, chainId);
      
      if (!profile) {
        res.status(404).json({
          status: 'error',
          message: 'Address profile not found',
          traceId: req.traceId,
        });
        return;
      }
      
      res.status(200).json({
        status: 'ok',
        data: profile,
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`获取地址画像详情失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
        address: req.params.address,
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to get address profile',
        traceId: req.traceId,
      });
    }
  });
  
  // 更新地址画像
  router.patch('/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const chainId = req.query.chainId ? parseInt(req.query.chainId as string) : 1;
      
      // 验证更新数据
      const data = ProfileUpdateSchema.parse(req.body);
      
      // 查找并更新画像
      const profile = await AddressProfile.findByAddress(address, chainId);
      
      if (!profile) {
        res.status(404).json({
          status: 'error',
          message: 'Address profile not found',
          traceId: req.traceId,
        });
        return;
      }
      
      // 更新风险分析
      if (data.riskScore !== undefined || data.riskLevel || data.riskFactors) {
        await profile.updateRiskAnalysis(
          data.riskScore ?? profile.riskScore,
          data.riskLevel ?? profile.riskLevel,
          data.riskFactors ?? profile.riskFactors
        );
      }
      
      // 更新标签
      if (data.tags) {
        await profile.addTags(data.tags);
      }
      
      // 更新元数据
      if (data.metadata) {
        profile.metadata = {
          ...profile.metadata,
          ...data.metadata,
        };
        await profile.save();
      }
      
      res.status(200).json({
        status: 'ok',
        data: profile,
        traceId: req.traceId,
      });
    } catch (error) {
      logger.error(`更新地址画像失败 [${req.traceId}]`, {
        error: error instanceof Error ? error.message : String(error),
        address: req.params.address,
        body: req.body,
      });
      
      res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Invalid update data',
        traceId: req.traceId,
      });
    }
  });
  
  return router;
} 