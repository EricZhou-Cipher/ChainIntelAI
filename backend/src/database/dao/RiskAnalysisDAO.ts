import { IRiskAnalysis } from '../models/RiskAnalysis';
import { RiskAnalysisModel } from '../models/RiskAnalysis';
import { cache } from '../redis';
import { createLogger } from '../../utils/logger';

const logger = createLogger({
  level: 'info',
  format: 'json',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss',
});
const CACHE_TTL = 3600; // 1小时缓存

export class RiskAnalysisDAO {
  static async create(analysis: IRiskAnalysis): Promise<IRiskAnalysis> {
    try {
      const record = await RiskAnalysisModel.create(analysis);
      await cache.set(`risk:${record.address}`, record, CACHE_TTL);
      return record;
    } catch (error) {
      logger.error('Create risk analysis error', { error });
      throw error;
    }
  }

  static async findByAddress(address: string): Promise<IRiskAnalysis | null> {
    try {
      // 先查缓存
      const cached = await cache.get<IRiskAnalysis>(`risk:${address}`);
      if (cached) {
        return cached;
      }

      // 缓存未命中，查数据库
      const record = await RiskAnalysisModel.findOne({ address });
      if (record) {
        await cache.set(`risk:${address}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Find risk analysis error', { address, error });
      throw error;
    }
  }

  static async update(
    address: string,
    analysis: IRiskAnalysis['analysis']
  ): Promise<IRiskAnalysis | null> {
    try {
      const record = await RiskAnalysisModel.findOneAndUpdate(
        { address },
        { $set: { analysis } },
        { new: true }
      );
      if (record) {
        await cache.set(`risk:${address}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Update risk analysis error', { address, error });
      throw error;
    }
  }

  static async delete(address: string): Promise<boolean> {
    try {
      const result = await RiskAnalysisModel.deleteOne({ address });
      await cache.del(`risk:${address}`);
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Delete risk analysis error', { address, error });
      throw error;
    }
  }

  static async findHighRiskAddresses(threshold: number = 0.7): Promise<IRiskAnalysis[]> {
    try {
      return await RiskAnalysisModel.find({
        'analysis.score': { $gte: threshold },
      }).sort({ 'analysis.score': -1 });
    } catch (error) {
      logger.error('Find high risk addresses error', { threshold, error });
      throw error;
    }
  }
}
