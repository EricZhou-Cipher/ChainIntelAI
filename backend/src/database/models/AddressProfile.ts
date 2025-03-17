import { Schema, model, Document } from 'mongoose';
import { AddressProfile } from '../../types/profile';

export interface IAddressProfile extends Document, AddressProfile {
  createdAt: Date;
  updatedAt: Date;
}

const AddressProfileSchema = new Schema<IAddressProfile>({
  address: { type: String, required: true, unique: true, index: true },
  riskScore: { type: Number, required: true, default: 0.5 },
  lastUpdated: { type: String, required: true },
  tags: [{ type: String }],
  category: { type: String, required: true },
  transactionCount: { type: Number, required: true, default: 0 },
  totalValue: { type: String, required: true, default: '0' },
  firstSeen: { type: String, required: true },
  lastSeen: { type: String, required: true },
  relatedAddresses: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 创建索引
AddressProfileSchema.index({ riskScore: 1 });
AddressProfileSchema.index({ category: 1 });
AddressProfileSchema.index({ tags: 1 });
AddressProfileSchema.index({ lastUpdated: -1 });

// 更新时间中间件
AddressProfileSchema.pre('save', function (next) {
  this.set('updatedAt', new Date());
  next();
});

export const AddressProfileModel = model<IAddressProfile>('AddressProfile', AddressProfileSchema);
