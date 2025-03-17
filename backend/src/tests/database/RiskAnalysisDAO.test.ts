/**
 * @file RiskAnalysisDAO单元测试
 * @description 测试RiskAnalysisDAO的所有核心方法，包括数据库操作与缓存逻辑
 */

import { RiskAnalysisDAO } from '@/database/dao/RiskAnalysisDAO';
import { RiskAnalysisModel, IRiskAnalysis } from '@/database/models/RiskAnalysis';
import { cache } from '@/database/redis';
import { RiskAnalysis, EnhancedRiskAnalysis, RiskLevel } from '@/types/riskAnalysis';
import { Document } from 'mongoose';

// Mock RiskAnalysisModel
jest.mock('@/database/models/RiskAnalysis', () => ({
  RiskAnalysisModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn()
  }
}));

// Mock Redis缓存
jest.mock('@/database/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

describe('RiskAnalysisDAO', () => {
  const mockAddress = '0x1234567890abcdef';
  const mockAnalysis: IRiskAnalysis = {
    address: mockAddress,
    analysis: {
      score: 0.8,
      level: 'high' as RiskLevel,
      factors: ['suspicious_pattern', 'high_value_transfer'],
      details: {
        transactionPattern: 'unusual',
        valueDistribution: 'concentrated',
        timePattern: 'irregular'
      }
    },
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
    validateSync: jest.fn()
  } as unknown as IRiskAnalysis;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new risk analysis and cache it', async () => {
      (RiskAnalysisModel.create as jest.Mock).mockResolvedValue(mockAnalysis);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await RiskAnalysisDAO.create(mockAnalysis);

      expect(RiskAnalysisModel.create).toHaveBeenCalledWith(mockAnalysis);
      expect(cache.set).toHaveBeenCalledWith(
        `risk:${mockAnalysis.address}`,
        mockAnalysis,
        3600
      );
      expect(result).toEqual(mockAnalysis);
    });

    it('should throw error when creation fails', async () => {
      const error = new Error('Creation failed');
      (RiskAnalysisModel.create as jest.Mock).mockRejectedValue(error);

      await expect(RiskAnalysisDAO.create(mockAnalysis)).rejects.toThrow(error);
    });
  });

  describe('findByAddress', () => {
    it('should return cached analysis if available', async () => {
      (cache.get as jest.Mock).mockResolvedValue(mockAnalysis);

      const result = await RiskAnalysisDAO.findByAddress(mockAddress);

      expect(cache.get).toHaveBeenCalledWith(`risk:${mockAddress}`);
      expect(RiskAnalysisModel.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockAnalysis);
    });

    it('should fetch from database and cache if not in cache', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      (RiskAnalysisModel.findOne as jest.Mock).mockResolvedValue(mockAnalysis);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await RiskAnalysisDAO.findByAddress(mockAddress);

      expect(cache.get).toHaveBeenCalledWith(`risk:${mockAddress}`);
      expect(RiskAnalysisModel.findOne).toHaveBeenCalledWith({ address: mockAddress });
      expect(cache.set).toHaveBeenCalledWith(
        `risk:${mockAddress}`,
        mockAnalysis,
        3600
      );
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe('update', () => {
    it('should update analysis and refresh cache', async () => {
      const updatedAnalysis = {
        ...mockAnalysis,
        analysis: {
          ...mockAnalysis.analysis,
          score: 0.9,
          level: 'critical' as RiskLevel
        }
      };
      (RiskAnalysisModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedAnalysis);
      (cache.set as jest.Mock).mockResolvedValue(undefined);

      const result = await RiskAnalysisDAO.update(mockAddress, updatedAnalysis.analysis);

      expect(RiskAnalysisModel.findOneAndUpdate).toHaveBeenCalledWith(
        { address: mockAddress },
        { $set: { analysis: updatedAnalysis.analysis } },
        { new: true }
      );
      expect(cache.set).toHaveBeenCalledWith(
        `risk:${mockAddress}`,
        updatedAnalysis,
        3600
      );
      expect(result).toEqual(updatedAnalysis);
    });
  });

  describe('delete', () => {
    it('should delete analysis and clear cache', async () => {
      (RiskAnalysisModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (cache.del as jest.Mock).mockResolvedValue(undefined);

      const result = await RiskAnalysisDAO.delete(mockAddress);

      expect(RiskAnalysisModel.deleteOne).toHaveBeenCalledWith({ address: mockAddress });
      expect(cache.del).toHaveBeenCalledWith(`risk:${mockAddress}`);
      expect(result).toBe(true);
    });

    it('should return false when no analysis is deleted', async () => {
      (RiskAnalysisModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      (cache.del as jest.Mock).mockResolvedValue(undefined);

      const result = await RiskAnalysisDAO.delete(mockAddress);

      expect(result).toBe(false);
    });
  });

  describe('findHighRiskAddresses', () => {
    it('should return addresses with risk score above threshold', async () => {
      const highRiskAddresses = [
        { ...mockAnalysis, analysis: { ...mockAnalysis.analysis, score: 0.9 } },
        { ...mockAnalysis, address: '0xabcdef1234567890', analysis: { ...mockAnalysis.analysis, score: 0.85 } }
      ];
      
      // 模拟 find 方法返回带有 sort 方法的对象
      const mockFindResult = {
        sort: jest.fn().mockReturnValue(highRiskAddresses)
      };
      (RiskAnalysisModel.find as jest.Mock).mockReturnValue(mockFindResult);

      const result = await RiskAnalysisDAO.findHighRiskAddresses(0.8);

      expect(RiskAnalysisModel.find).toHaveBeenCalledWith({
        'analysis.score': { $gte: 0.8 }
      });
      expect(mockFindResult.sort).toHaveBeenCalledWith({ 'analysis.score': -1 });
      expect(result).toEqual(highRiskAddresses);
    });

    it('should return empty array when no high risk addresses found', async () => {
      // 模拟 find 方法返回带有 sort 方法的对象
      const mockFindResult = {
        sort: jest.fn().mockReturnValue([])
      };
      (RiskAnalysisModel.find as jest.Mock).mockReturnValue(mockFindResult);

      const result = await RiskAnalysisDAO.findHighRiskAddresses(0.9);

      expect(mockFindResult.sort).toHaveBeenCalledWith({ 'analysis.score': -1 });
      expect(result).toEqual([]);
    });
  });
}); 