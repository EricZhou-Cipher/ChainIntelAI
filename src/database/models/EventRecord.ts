import mongoose, { Schema, Document } from 'mongoose';
import { EventType } from '../../types/events';

// 事件记录接口
export interface IEventRecord extends Document {
  // 事件基本信息
  traceId: string;
  type: EventType;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;

  // 区块链信息
  chainId: number;
  blockNumber: number;
  transactionHash: string;

  // 来源和目标
  from: string;
  to: string;

  // 事件内容
  value?: string;
  tokenAddress?: string;
  methodName?: string;
  methodSignature?: string;
  input?: string;
  output?: string;

  // 元数据
  metadata?: Record<string, any>;

  // 处理状态
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;

  // 风险分析结果
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  riskFactors?: string[];

  // 索引
  index: number;
}

// 事件记录Schema
const EventRecordSchema = new Schema<IEventRecord>({
  // 事件基本信息
  traceId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: Object.values(EventType) },
  timestamp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // 区块链信息
  chainId: { type: Number, required: true },
  blockNumber: { type: Number, required: true },
  transactionHash: { type: String, required: true, index: true },

  // 来源和目标
  from: { type: String, required: true },
  to: { type: String, required: true },

  // 事件内容
  value: { type: String },
  tokenAddress: { type: String },
  methodName: { type: String },
  methodSignature: { type: String },
  input: { type: String },
  output: { type: String },

  // 元数据
  metadata: { type: Schema.Types.Mixed },

  // 处理状态
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  error: { type: String },

  // 风险分析结果
  riskScore: { type: Number },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
  },
  riskFactors: [{ type: String }],

  // 索引
  index: { type: Number, required: true },
}, {
  timestamps: true,
});

// 创建复合索引
EventRecordSchema.index({ chainId: 1, blockNumber: 1, index: 1 }, { unique: true });
EventRecordSchema.index({ from: 1, timestamp: -1 });
EventRecordSchema.index({ to: 1, timestamp: -1 });
EventRecordSchema.index({ status: 1, timestamp: -1 });
EventRecordSchema.index({ riskLevel: 1, timestamp: -1 });

// 创建事件记录
EventRecordSchema.statics.createEvent = async function (data: Partial<IEventRecord>): Promise<IEventRecord> {
  const event = new this(data);
  return event.save();
};

// 根据traceId查找事件
EventRecordSchema.statics.findByTraceId = async function (traceId: string): Promise<IEventRecord | null> {
  return this.findOne({ traceId });
};

// 根据交易哈希查找事件
EventRecordSchema.statics.findByTransactionHash = async function (transactionHash: string): Promise<IEventRecord | null> {
  return this.findOne({ transactionHash });
};

// 更新事件状态
EventRecordSchema.methods.updateStatus = async function (status: IEventRecord['status'], error?: string): Promise<void> {
  this.status = status;
  if (error) {
    this.error = error;
  }
  this.updatedAt = new Date();
  await this.save();
};

// 更新风险分析结果
EventRecordSchema.methods.updateRiskAnalysis = async function (
  riskScore: number,
  riskLevel: IEventRecord['riskLevel'],
  riskFactors: string[]
): Promise<void> {
  this.riskScore = riskScore;
  this.riskLevel = riskLevel;
  this.riskFactors = riskFactors;
  this.updatedAt = new Date();
  await this.save();
};

// 导出模型
export const EventRecord = mongoose.model<IEventRecord>('EventRecord', EventRecordSchema); 