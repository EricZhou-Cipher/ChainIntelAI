import { RiskLevel } from '../types/events.js';

export interface PipelineConfig {
  // 风险分析配置
  riskAnalysis: {
    minScore: number;
    maxScore: number;
    thresholds: {
      [key in RiskLevel]: number;
    };
  };
  
  // 事件处理配置
  eventProcessing: {
    batchSize: number;
    maxConcurrent: number;
    timeout: number;
    retryCount: number;
    retryDelay: number;
  };
  
  // 通知配置
  notification: {
    enabled: boolean;
    channels: string[];
    minRiskLevel: RiskLevel;
  };
  
  // 监控配置
  monitoring: {
    enabled: boolean;
    metrics: string[];
    alertThresholds: Record<string, number>;
  };
} 