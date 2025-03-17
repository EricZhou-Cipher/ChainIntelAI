/**
 * @file AddressProfileDAO单元测试
 * @description 测试AddressProfileDAO的所有核心方法，包括数据库操作与缓存逻辑
 */

import { AddressProfileDAO } from '@/database/dao/AddressProfileDAO';
import { AddressProfileModel, IAddressProfile } from '@/database/models/AddressProfile';
import { cache } from '@/database/redis';
import { AddressProfile, AddressCategory } from '@/types/profile';
import { Document } from 'mongoose';

// Mock AddressProfileModel
jest.mock('@/database/models/AddressProfile', () => ({
  AddressProfileModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

// Mock Redis缓存
jest.mock('@/database/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe('AddressProfileDAO', () => {
  const mockAddress = '0x1234567890abcdef';
  const mockProfile: IAddressProfile = {
    address: mockAddress,
    riskScore: 0.5,
    lastUpdated: new Date().toISOString(),
    tags: ['whale', 'active'],
    category: AddressCategory.WALLET,
    transactionCount: 100,
    totalValue: '1000000000000000000',
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    relatedAddresses: ['0xabcdef1234567890'],
    createdAt: new Date(),
    updatedAt: new Date(),
    // 添加 Document 接口所需的属性
    $assertPopulated: jest.fn(),
    $clone: jest.fn(),
    $getAllSubdocs: jest.fn(),
    $ignore: jest.fn(),
    $isDefault: jest.fn(),
    $isDeleted: jest.fn(),
    $isEmpty: jest.fn(),
    $isValid: jest.fn(),
    $locals: {},
    $markValid: jest.fn(),
    $model: jest.fn(),
    $op: null,
    $session: jest.fn(),
    $set: jest.fn(),
    $where: {},
    collection: {},
    db: {},
    delete: jest.fn(),
    deleteOne: jest.fn(),
    depopulate: jest.fn(),
    directModifiedPaths: jest.fn(),
    equals: jest.fn(),
    errors: {},
    get: jest.fn(),
    getChanges: jest.fn(),
    increment: jest.fn(),
    init: jest.fn(),
    inspect: jest.fn(),
    invalidate: jest.fn(),
    isDirectModified: jest.fn(),
    isDirectSelected: jest.fn(),
    isInit: jest.fn(),
    isModified: jest.fn(),
    isNew: false,
    isSelected: jest.fn(),
    markModified: jest.fn(),
    modifiedPaths: jest.fn(),
    overwrite: jest.fn(),
    populate: jest.fn(),
    populated: jest.fn(),
    remove: jest.fn(),
    replaceOne: jest.fn(),
    save: jest.fn(),
    schema: {},
    set: jest.fn(),
    toJSON: jest.fn(),
    toObject: jest.fn(),
    unmarkModified: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    validate: jest.fn(),
    validateSync: jest.fn(),
  } as unknown as IAddressProfile;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new address profile and cache it', async () => {
      (AddressProfileModel.create as jest.Mock).mockResolvedValue(mockProfile);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.create(mockProfile);

      expect(AddressProfileModel.create).toHaveBeenCalledWith(mockProfile);
      expect(cache.set).toHaveBeenCalledWith(`profile:${mockProfile.address}`, mockProfile, 3600);
      expect(result).toEqual(mockProfile);
    });

    it('should throw error when creation fails', async () => {
      const error = new Error('Creation failed');
      (AddressProfileModel.create as jest.Mock).mockRejectedValue(error);

      await expect(AddressProfileDAO.create(mockProfile)).rejects.toThrow(error);
    });
  });

  describe('findByAddress', () => {
    it('should return cached profile if available', async () => {
      (cache.get as jest.Mock).mockResolvedValue(mockProfile);

      const result = await AddressProfileDAO.findByAddress(mockAddress);

      expect(cache.get).toHaveBeenCalledWith(`profile:${mockAddress}`);
      expect(AddressProfileModel.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should fetch from database and cache if not in cache', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      (AddressProfileModel.findOne as jest.Mock).mockResolvedValue(mockProfile);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.findByAddress(mockAddress);

      expect(cache.get).toHaveBeenCalledWith(`profile:${mockAddress}`);
      expect(AddressProfileModel.findOne).toHaveBeenCalledWith({ address: mockAddress });
      expect(cache.set).toHaveBeenCalledWith(`profile:${mockAddress}`, mockProfile, 3600);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('update', () => {
    it('should update profile and refresh cache', async () => {
      const updates = { riskScore: 0.8, category: AddressCategory.SCAM };
      const updatedProfile = { ...mockProfile, ...updates };
      (AddressProfileModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedProfile);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.update(mockAddress, updates);

      expect(AddressProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
        { address: mockAddress },
        { $set: updates },
        { new: true }
      );
      expect(cache.set).toHaveBeenCalledWith(`profile:${mockAddress}`, updatedProfile, 3600);
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('updateRiskScore', () => {
    it('should update risk score and refresh cache', async () => {
      const newRiskScore = 0.8;
      const updatedProfile = { ...mockProfile, riskScore: newRiskScore };
      (AddressProfileModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedProfile);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.updateRiskScore(mockAddress, newRiskScore);

      expect(AddressProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
        { address: mockAddress },
        { $set: { riskScore: newRiskScore, lastUpdated: expect.any(Date) } },
        { new: true }
      );
      expect(cache.set).toHaveBeenCalledWith(`profile:${mockAddress}`, updatedProfile, 3600);
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('addTag', () => {
    it('should add new tag and refresh cache', async () => {
      const newTag = 'suspicious';
      const updatedProfile = { ...mockProfile, tags: [...mockProfile.tags, newTag] };
      (AddressProfileModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedProfile);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.addTag(mockAddress, newTag);

      expect(AddressProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
        { address: mockAddress },
        { $addToSet: { tags: newTag } },
        { new: true }
      );
      expect(cache.set).toHaveBeenCalledWith(`profile:${mockAddress}`, updatedProfile, 3600);
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('removeTag', () => {
    it('should remove tag and refresh cache', async () => {
      const tagToRemove = 'whale';
      const updatedProfile = {
        ...mockProfile,
        tags: mockProfile.tags.filter((t) => t !== tagToRemove),
      };
      (AddressProfileModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedProfile);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.removeTag(mockAddress, tagToRemove);

      expect(AddressProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
        { address: mockAddress },
        { $pull: { tags: tagToRemove } },
        { new: true }
      );
      expect(cache.set).toHaveBeenCalledWith(`profile:${mockAddress}`, updatedProfile, 3600);
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('delete', () => {
    it('should delete profile and clear cache', async () => {
      (AddressProfileModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (cache.del as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.delete(mockAddress);

      expect(AddressProfileModel.deleteOne).toHaveBeenCalledWith({ address: mockAddress });
      expect(cache.del).toHaveBeenCalledWith(`profile:${mockAddress}`);
      expect(result).toBe(true);
    });

    it('should return false when no profile is deleted', async () => {
      (AddressProfileModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      (cache.del as jest.Mock).mockResolvedValue(undefined);

      const result = await AddressProfileDAO.delete(mockAddress);

      expect(result).toBe(false);
    });
  });
});
