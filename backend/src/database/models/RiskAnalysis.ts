import { Schema, model, Document } from 'mongoose';
import { EnhancedRiskAnalysis } from '../../types/riskAnalysis';

export interface IRiskAnalysis extends Document {
  address: string;
  analysis: EnhancedRiskAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const RiskAnalysisSchema = new Schema<IRiskAnalysis>({
  address: { type: String, required: true, index: true },
  analysis: {
    type: Schema.Types.Mixed,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 创建索引
RiskAnalysisSchema.index({ 'analysis.score': 1 });
RiskAnalysisSchema.index({ 'analysis.level': 1 });
RiskAnalysisSchema.index({ createdAt: -1 });

// 更新时间中间件
RiskAnalysisSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const RiskAnalysisModel = model<IRiskAnalysis>('RiskAnalysis', RiskAnalysisSchema);
