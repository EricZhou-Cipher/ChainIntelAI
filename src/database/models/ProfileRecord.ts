import mongoose, { Document, Schema, Model } from 'mongoose';

// 地址画像接口
export interface IProfileRecord extends Document {
  // 基本信息
  address: string;
  firstSeen: Date;
  lastUpdated: Date;
  lastActivity: Date;
  
  // 标签和分类
  tags: string[];
  category?: string;
  label?: string;
  riskScore: number;
  reputationScore: number;
  
  // 活动统计
  transactionCount: number;
  incomingTransactionCount: number;
  outgoingTransactionCount: number;
  contractInteractionCount: number;
  
  // 资产信息
  totalValueTransferred: string;
  balanceHistory: Array<{
    timestamp: Date;
    tokenAddress: string;
    tokenSymbol?: string;
    tokenDecimals?: number;
    balance: string;
  }>;
  
  // 交互地址
  interactedWith: Array<{
    address: string;
    count: number;
    lastInteraction: Date;
    totalValue?: string;
  }>;
  
  // 自定义属性
  metadata: Record<string, any>;
  
  // 智能分析
  aiAnalysis?: {
    summary?: string;
    riskFactors?: string[];
    lastAnalyzed?: Date;
    confidence?: number;
  };
}

// 地址画像Schema
const ProfileRecordSchema: Schema = new Schema({
  // 基本信息
  address: { type: String, required: true, unique: true, index: true },
  firstSeen: { type: Date, required: true },
  lastUpdated: { type: Date, required: true },
  lastActivity: { type: Date, required: true },
  
  // 标签和分类
  tags: [{ type: String, index: true }],
  category: { type: String, index: true },
  label: { type: String },
  riskScore: { type: Number, required: true, index: true, default: 0 },
  reputationScore: { type: Number, required: true, index: true, default: 50 },
  
  // 活动统计
  transactionCount: { type: Number, default: 0 },
  incomingTransactionCount: { type: Number, default: 0 },
  outgoingTransactionCount: { type: Number, default: 0 },
  contractInteractionCount: { type: Number, default: 0 },
  
  // 资产信息
  totalValueTransferred: { type: String, default: '0' },
  balanceHistory: [{
    timestamp: { type: Date, required: true },
    tokenAddress: { type: String, required: true },
    tokenSymbol: { type: String },
    tokenDecimals: { type: Number },
    balance: { type: String, required: true },
    _id: false
  }],
  
  // 交互地址
  interactedWith: [{
    address: { type: String, required: true },
    count: { type: Number, required: true },
    lastInteraction: { type: Date, required: true },
    totalValue: { type: String },
    _id: false
  }],
  
  // 自定义属性
  metadata: { type: Schema.Types.Mixed, default: {} },
  
  // 智能分析
  aiAnalysis: {
    summary: { type: String },
    riskFactors: [{ type: String }],
    lastAnalyzed: { type: Date },
    confidence: { type: Number }
  }
}, {
  timestamps: true,
  versionKey: false
});

// 添加索引优化查询
ProfileRecordSchema.index({ riskScore: -1 });
ProfileRecordSchema.index({ lastActivity: -1 });
ProfileRecordSchema.index({ 'interactedWith.address': 1 });

// 地址画像Model
export const ProfileRecord: Model<IProfileRecord> = mongoose.model<IProfileRecord>('ProfileRecord', ProfileRecordSchema);

/**
 * 创建或更新地址画像
 */
export async function upsertProfileRecord(address: string, profileData: Partial<IProfileRecord>): Promise<IProfileRecord> {
  const now = new Date();
  
  return await ProfileRecord.findOneAndUpdate(
    { address },
    {
      $set: {
        ...profileData,
        lastUpdated: now,
      },
      $setOnInsert: {
        firstSeen: profileData.firstSeen || now,
        address
      }
    },
    {
      new: true,
      upsert: true
    }
  );
}

/**
 * 根据地址查找画像
 */
export async function findProfileByAddress(address: string): Promise<IProfileRecord | null> {
  return await ProfileRecord.findOne({ address });
}

/**
 * 更新地址交互信息
 */
export async function updateAddressInteraction(
  address: string,
  interactedAddress: string,
  value?: string
): Promise<void> {
  const now = new Date();
  
  await ProfileRecord.updateOne(
    { address },
    {
      $set: {
        lastUpdated: now,
        lastActivity: now
      },
      $inc: {
        transactionCount: 1,
        outgoingTransactionCount: 1
      },
      $push: {
        interactedWith: {
          $each: [{
            address: interactedAddress,
            count: 1,
            lastInteraction: now,
            totalValue: value || '0'
          }],
          $sort: { lastInteraction: -1 },
          $slice: 100 // 保留最近的100个交互地址
        }
      }
    },
    { upsert: true }
  );
}

/**
 * 查询高风险地址
 */
export async function findHighRiskProfiles(
  minRiskScore: number = 75,
  page: number = 1,
  limit: number = 20
): Promise<{
  total: number;
  page: number;
  limit: number;
  profiles: IProfileRecord[];
}> {
  const skip = (page - 1) * limit;
  const [profiles, total] = await Promise.all([
    ProfileRecord.find({ riskScore: { $gte: minRiskScore } })
      .sort({ riskScore: -1, lastActivity: -1 })
      .skip(skip)
      .limit(limit),
    ProfileRecord.countDocuments({ riskScore: { $gte: minRiskScore } })
  ]);
  
  return {
    total,
    page,
    limit,
    profiles
  };
}

/**
 * 更新地址风险分数
 */
export async function updateRiskScore(
  address: string,
  riskScore: number,
  riskFactors?: string[],
  analysis?: string
): Promise<IProfileRecord | null> {
  const now = new Date();
  
  return await ProfileRecord.findOneAndUpdate(
    { address },
    {
      $set: {
        riskScore,
        lastUpdated: now,
        'aiAnalysis.summary': analysis,
        'aiAnalysis.riskFactors': riskFactors || [],
        'aiAnalysis.lastAnalyzed': now
      }
    },
    { new: true, upsert: true }
  );
} 