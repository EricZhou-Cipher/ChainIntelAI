import { Schema, model, Document } from 'mongoose';
import { NormalizedEvent } from '../../types/events';

export interface IEventRecord extends Document {
  traceId: string;
  event: NormalizedEvent;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  riskAnalysis?: {
    score: number;
    level: string;
    factors: string[];
    timestamp: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EventRecordSchema = new Schema<IEventRecord>({
  traceId: { type: String, required: true, index: true },
  event: {
    type: Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  riskAnalysis: {
    score: Number,
    level: String,
    factors: [String],
    timestamp: Number,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 创建索引
EventRecordSchema.index({ 'event.transactionHash': 1 });
EventRecordSchema.index({ 'event.from': 1 });
EventRecordSchema.index({ 'event.to': 1 });
EventRecordSchema.index({ createdAt: -1 });

// 更新时间中间件
EventRecordSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const EventRecord = model<IEventRecord>('EventRecord', EventRecordSchema);
