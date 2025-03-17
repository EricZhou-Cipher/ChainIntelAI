import { RiskLevel } from './events.js';

// 风险特征
export interface RiskFeature {
  name: string;
  weight: number;
  threshold: number;
  description: string;
}

// 风险分析结果
export interface RiskAnalysis {
  score: number;
  level: RiskLevel;
  factors: string[];
  details?: Record<string, any>;
}

// 风险分析配置
export interface RiskAnalysisConfig {
  features: RiskFeature[];
  thresholds: {
    [key in RiskLevel]: number;
  };
  weights: {
    [key: string]: number;
  };
}

// 风险分析规则
export interface RiskRule {
  id: string;
  name: string;
  description: string;
  condition: (event: any) => boolean;
  action: (event: any) => RiskAnalysis;
  priority: number;
  enabled: boolean;
} 