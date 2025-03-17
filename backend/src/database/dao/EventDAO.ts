import { IEventRecord } from '../models/EventRecord';
import { EventRecord } from '../models/EventRecord';
import { cache } from '../redis';
import { createLogger } from '../../utils/logger';

const logger = createLogger({
  level: 'info',
  format: 'json',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss',
});
const CACHE_TTL = 3600; // 1小时缓存

export class EventDAO {
  static async create(event: IEventRecord): Promise<IEventRecord> {
    try {
      const record = await EventRecord.create(event);
      await cache.set(`event:${record.traceId}`, record, CACHE_TTL);
      return record;
    } catch (error) {
      logger.error('Create event record error', { error });
      throw error;
    }
  }

  static async findByTraceId(traceId: string): Promise<IEventRecord | null> {
    try {
      // 先查缓存
      const cached = await cache.get<IEventRecord>(`event:${traceId}`);
      if (cached) {
        return cached;
      }

      // 缓存未命中，查数据库
      const record = await EventRecord.findOne({ traceId });
      if (record) {
        await cache.set(`event:${traceId}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Find event by traceId error', { traceId, error });
      throw error;
    }
  }

  static async findByTransactionHash(hash: string): Promise<IEventRecord | null> {
    try {
      return await EventRecord.findOne({ 'event.transactionHash': hash });
    } catch (error) {
      logger.error('Find event by transaction hash error', { hash, error });
      throw error;
    }
  }

  static async updateStatus(
    traceId: string,
    status: IEventRecord['status']
  ): Promise<IEventRecord | null> {
    try {
      const record = await EventRecord.findOneAndUpdate(
        { traceId },
        { $set: { status } },
        { new: true }
      );
      if (record) {
        await cache.set(`event:${traceId}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Update event status error', { traceId, status, error });
      throw error;
    }
  }

  static async updateRiskAnalysis(
    traceId: string,
    riskAnalysis: IEventRecord['riskAnalysis']
  ): Promise<IEventRecord | null> {
    try {
      const record = await EventRecord.findOneAndUpdate(
        { traceId },
        { $set: { riskAnalysis } },
        { new: true }
      );
      if (record) {
        await cache.set(`event:${traceId}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Update event risk analysis error', { traceId, error });
      throw error;
    }
  }

  static async delete(traceId: string): Promise<boolean> {
    try {
      const result = await EventRecord.deleteOne({ traceId });
      await cache.del(`event:${traceId}`);
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Delete event error', { traceId, error });
      throw error;
    }
  }

  static async deleteMany(filter: Record<string, any> = {}): Promise<number> {
    try {
      const result = await EventRecord.deleteMany(filter);
      return result.deletedCount;
    } catch (error) {
      logger.error('Delete many events error', { filter, error });
      throw error;
    }
  }

  /**
   * 查找地址的最近交易记录
   * @param address 地址
   * @param limit 限制数量
   * @returns 交易记录数组
   */
  static async findByAddress(address: string, limit: number = 20): Promise<IEventRecord[]> {
    try {
      // 查询发送方或接收方为指定地址的交易
      const records = await EventRecord.find({
        $or: [{ 'event.from': address.toLowerCase() }, { 'event.to': address.toLowerCase() }],
      })
        .sort({ 'event.timestamp': -1 }) // 按时间倒序
        .limit(limit);

      return records;
    } catch (error) {
      logger.error('Find events by address error', { address, limit, error });
      throw error;
    }
  }
}
