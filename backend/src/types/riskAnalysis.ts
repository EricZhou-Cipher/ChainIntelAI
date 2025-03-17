import { RiskLevel, RiskAnalysis } from './events';

export { RiskLevel, RiskAnalysis };

export interface BehaviorAnalysis {
  pattern: string;
  confidence: number;
  details: Record<string, any>;
}

export interface GraphAnalysis {
  centrality: number;
  degree: number;
  clustering: number;
  paths: Array<{
    from: string;
    to: string;
    weight: number;
  }>;
}

export interface AIAnalysis {
  behaviorAnalysis: BehaviorAnalysis;
  graphAnalysis: GraphAnalysis;
  summary: string;
}

/**
 * 增强的风险分析结果
 * 包含基础风险分析结果，以及AI分析和组合分析结果
 */
export interface EnhancedRiskAnalysis extends RiskAnalysis {
  /**
   * 分析时间戳
   */
  timestamp: number;

  /**
   * AI分析结果
   */
  aiAnalysis: {
    /**
     * 行为分析
     */
    behaviorAnalysis: {
      /**
       * 行为模式
       */
      pattern: string;
      /**
       * 置信度
       */
      confidence: number;
      /**
       * 详细信息
       */
      details: Record<string, unknown>;
    };
    /**
     * 图分析
     */
    graphAnalysis: {
      /**
       * 中心度
       */
      centrality: number;
      /**
       * 度
       */
      degree: number;
      /**
       * 聚类系数
       */
      clustering: number;
      /**
       * 路径
       */
      paths: Array<{
        from: string;
        to: string;
        weight: number;
      }>;
    };
    /**
     * 摘要
     */
    summary: string;
  };

  /**
   * 组合分析结果
   */
  combinations: Array<{
    /**
     * 风险因素
     */
    factors: string[];
    /**
     * 风险分数
     */
    score: number;
    /**
     * 描述
     */
    description: string;
  }>;

  /**
   * 处理动作
   */
  action: 'block' | 'alert' | 'monitor' | 'none';
}
