import mongoose, { Schema, Document } from 'mongoose';
import { RiskLevel } from '../../types/events';

// 地址画像接口
export interface IAddressProfile extends Document {
  // 基本信息
  address: string;
  chainId: number;
  createdAt: Date;
  updatedAt: Date;
  
  // 交易统计
  totalTransactions: number;
  totalVolume: string;
  lastTransactionTime: Date;
  
  // 合约交互
  contractInteractions: {
    contractAddress: string;
    methodName: string;
    count: number;
    lastInteraction: Date;
  }[];
  
  // 代币持有
  tokenBalances: {
    tokenAddress: string;
    balance: string;
    symbol: string;
    decimals: number;
    lastUpdate: Date;
  }[];
  
  // 风险评分
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastRiskUpdate: Date;
  
  // 标签
  tags: string[];
  
  // 元数据
  metadata?: Record<string, any>;
}

// 地址画像Schema
const AddressProfileSchema = new Schema<IAddressProfile>({
  // 基本信息
  address: { type: String, required: true, index: true },
  chainId: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // 交易统计
  totalTransactions: { type: Number, default: 0 },
  totalVolume: { type: String, default: '0' },
  lastTransactionTime: { type: Date },
  
  // 合约交互
  contractInteractions: [{
    contractAddress: { type: String, required: true },
    methodName: { type: String, required: true },
    count: { type: Number, default: 0 },
    lastInteraction: { type: Date },
  }],
  
  // 代币持有
  tokenBalances: [{
    tokenAddress: { type: String, required: true },
    balance: { type: String, required: true },
    symbol: { type: String, required: true },
    decimals: { type: Number, required: true },
    lastUpdate: { type: Date, default: Date.now },
  }],
  
  // 风险评分
  riskScore: { type: Number, default: 0 },
  riskLevel: {
    type: String,
    enum: Object.values(RiskLevel),
    default: RiskLevel.LOW,
  },
  riskFactors: [{ type: String }],
  lastRiskUpdate: { type: Date },
  
  // 标签
  tags: [{ type: String }],
  
  // 元数据
  metadata: { type: Schema.Types.Mixed },
}, {
  timestamps: true,
});

// 创建复合索引
AddressProfileSchema.index({ chainId: 1, address: 1 }, { unique: true });
AddressProfileSchema.index({ riskLevel: 1, lastRiskUpdate: -1 });
AddressProfileSchema.index({ tags: 1 });

// 根据地址查找画像
AddressProfileSchema.statics.findByAddress = async function(
  address: string,
  chainId: number
): Promise<IAddressProfile | null> {
  return this.findOne({ address, chainId });
};

// 更新交易统计
AddressProfileSchema.methods.updateTransactionStats = async function(
  amount: string,
  timestamp: Date
): Promise<void> {
  this.totalTransactions += 1;
  this.totalVolume = (BigInt(this.totalVolume) + BigInt(amount)).toString();
  this.lastTransactionTime = timestamp;
  this.updatedAt = new Date();
  await this.save();
};

// 更新合约交互
AddressProfileSchema.methods.updateContractInteraction = async function(
  contractAddress: string,
  methodName: string
): Promise<void> {
  const interaction = this.contractInteractions.find(
    i => i.contractAddress === contractAddress && i.methodName === methodName
  );
  
  if (interaction) {
    interaction.count += 1;
    interaction.lastInteraction = new Date();
  } else {
    this.contractInteractions.push({
      contractAddress,
      methodName,
      count: 1,
      lastInteraction: new Date(),
    });
  }
  
  this.updatedAt = new Date();
  await this.save();
};

// 更新代币余额
AddressProfileSchema.methods.updateTokenBalance = async function(
  tokenAddress: string,
  balance: string,
  symbol: string,
  decimals: number
): Promise<void> {
  const tokenBalance = this.tokenBalances.find(
    t => t.tokenAddress === tokenAddress
  );
  
  if (tokenBalance) {
    tokenBalance.balance = balance;
    tokenBalance.symbol = symbol;
    tokenBalance.decimals = decimals;
    tokenBalance.lastUpdate = new Date();
  } else {
    this.tokenBalances.push({
      tokenAddress,
      balance,
      symbol,
      decimals,
      lastUpdate: new Date(),
    });
  }
  
  this.updatedAt = new Date();
  await this.save();
};

// 更新风险分析
AddressProfileSchema.methods.updateRiskAnalysis = async function(
  riskScore: number,
  riskLevel: RiskLevel,
  riskFactors: string[]
): Promise<void> {
  this.riskScore = riskScore;
  this.riskLevel = riskLevel;
  this.riskFactors = riskFactors;
  this.lastRiskUpdate = new Date();
  this.updatedAt = new Date();
  await this.save();
};

// 添加标签
AddressProfileSchema.methods.addTags = async function(tags: string[]): Promise<void> {
  this.tags = [...new Set([...this.tags, ...tags])];
  this.updatedAt = new Date();
  await this.save();
};

// 移除标签
AddressProfileSchema.methods.removeTags = async function(tags: string[]): Promise<void> {
  this.tags = this.tags.filter(tag => !tags.includes(tag));
  this.updatedAt = new Date();
  await this.save();
};

// 导出模型
export const AddressProfile = mongoose.model<IAddressProfile>('AddressProfile', AddressProfileSchema); 