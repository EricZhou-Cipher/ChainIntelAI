import { IAddressProfile } from '../models/AddressProfile';
import { AddressProfileModel } from '../models/AddressProfile';
import { cache } from '../redis';
import { createLogger } from '../../utils/logger';

const logger = createLogger({
  level: 'info',
  format: 'json',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss',
});
const CACHE_TTL = 3600; // 1小时缓存

export class AddressProfileDAO {
  static async create(profile: IAddressProfile): Promise<IAddressProfile> {
    try {
      const record = await AddressProfileModel.create(profile);
      await cache.set(`profile:${record.address}`, record, CACHE_TTL);
      return record;
    } catch (error) {
      logger.error('Create address profile error', { error });
      throw error;
    }
  }

  static async findByAddress(address: string): Promise<IAddressProfile | null> {
    try {
      // 先查缓存
      const cached = await cache.get<IAddressProfile>(`profile:${address}`);
      if (cached) {
        return cached;
      }

      // 缓存未命中，查数据库
      const record = await AddressProfileModel.findOne({ address });
      if (record) {
        await cache.set(`profile:${address}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Find address profile error', { address, error });
      throw error;
    }
  }

  static async update(
    address: string,
    updates: Partial<IAddressProfile>
  ): Promise<IAddressProfile | null> {
    try {
      const record = await AddressProfileModel.findOneAndUpdate(
        { address },
        { $set: updates },
        { new: true }
      );
      if (record) {
        await cache.set(`profile:${address}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Update address profile error', { address, error });
      throw error;
    }
  }

  static async updateRiskScore(
    address: string,
    riskScore: number
  ): Promise<IAddressProfile | null> {
    try {
      const record = await AddressProfileModel.findOneAndUpdate(
        { address },
        { $set: { riskScore, lastUpdated: new Date() } },
        { new: true }
      );
      if (record) {
        await cache.set(`profile:${address}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Update address risk score error', { address, riskScore, error });
      throw error;
    }
  }

  static async addTag(address: string, tag: string): Promise<IAddressProfile | null> {
    try {
      const record = await AddressProfileModel.findOneAndUpdate(
        { address },
        { $addToSet: { tags: tag } },
        { new: true }
      );
      if (record) {
        await cache.set(`profile:${address}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Add tag to address profile error', { address, tag, error });
      throw error;
    }
  }

  static async removeTag(address: string, tag: string): Promise<IAddressProfile | null> {
    try {
      const record = await AddressProfileModel.findOneAndUpdate(
        { address },
        { $pull: { tags: tag } },
        { new: true }
      );
      if (record) {
        await cache.set(`profile:${address}`, record, CACHE_TTL);
      }
      return record;
    } catch (error) {
      logger.error('Remove tag from address profile error', { address, tag, error });
      throw error;
    }
  }

  static async delete(address: string): Promise<boolean> {
    try {
      const result = await AddressProfileModel.deleteOne({ address });
      await cache.del(`profile:${address}`);
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Delete address profile error', { address, error });
      throw error;
    }
  }
}
