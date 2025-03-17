import { RiskAnalysis, RiskLevel, NormalizedEvent } from '../types/events';
import { EnhancedRiskAnalysis } from '../types/riskAnalysis';
import { AddressProfile } from '../types/profile';
import { MLModel } from './MLModel';
import { RiskPatternAnalyzer } from './RiskPatternAnalyzer';
import { MEVDetector } from './MEVDetector';
import { logger } from '../utils/logger';

export const riskAnalyzer = {
  /**
   * 分析交易风险，结合基础规则和AI评分
   * @param event 规范化的交易事件
   * @param profile 地址画像
   * @returns 增强的风险分析结果
   */
  async analyze(event: NormalizedEvent, profile: AddressProfile): Promise<EnhancedRiskAnalysis> {
    try {
      logger.info('开始风险分析', {
        traceId: event.traceId,
        transactionHash: event.transactionHash,
      });

      // 初始化风险因素和特征
      const factors: string[] = [];
      const features: Array<{ description: string; score: number }> = [];

      // 1. 基础风险评分 (来自地址画像)
      const baseScore = profile.riskScore;

      // 2. 分析交易金额
      const amountScore = this.analyzeTransactionAmount(event);
      if (amountScore > 0.3) {
        factors.push('大额交易');
        features.push({
          description: '交易金额异常',
          score: amountScore,
        });
      }

      // 3. 分析合约调用
      const contractScore = this.analyzeContractCall(event);
      if (contractScore > 0) {
        factors.push('合约调用');
        features.push({
          description: '涉及合约调用',
          score: contractScore,
        });
      }

      // 4. 检测 MEV 行为
      const isMEV = await MEVDetector.detect(event, []);
      if (isMEV) {
        factors.push('MEV行为');
        features.push({
          description: 'MEV行为检测',
          score: 0.7,
        });
      }

      // 5. 获取 AI 模型评分
      const aiScore = await MLModel.analyzeRisk(event);

      // 合并 AI 模型检测到的风险因素
      aiScore.factors.forEach((factor) => {
        if (!factors.includes(factor)) {
          factors.push(factor);
        }
      });

      // 6. 获取交易模式分析
      const patternScore = await RiskPatternAnalyzer.evaluate(event);

      // 合并交易模式分析检测到的风险因素
      patternScore.factors.forEach((factor) => {
        if (!factors.includes(factor)) {
          factors.push(factor);
        }
      });

      // 7. 计算综合风险分数 (加权平均)
      const score =
        baseScore * 0.2 + // 基础分数 (20%)
        amountScore * 0.15 + // 金额分数 (15%)
        contractScore * 0.15 + // 合约分数 (15%)
        aiScore.score * 0.3 + // AI分数 (30%)
        patternScore.score * 0.2; // 模式分数 (20%)

      // 8. 确定风险等级
      const level =
        score >= 0.9
          ? RiskLevel.CRITICAL
          : score >= 0.7
            ? RiskLevel.HIGH
            : score >= 0.4
              ? RiskLevel.MEDIUM
              : RiskLevel.LOW;

      // 9. 确定处理动作
      const action =
        score >= 0.9 ? 'block' : score >= 0.7 ? 'alert' : score >= 0.4 ? 'monitor' : 'none';

      // 10. 构建增强的风险分析结果
      const result: EnhancedRiskAnalysis = {
        score,
        level,
        factors,
        features,
        aiAnalysis: {
          behaviorAnalysis: {
            pattern: factors.includes('high_frequency_trading')
              ? 'high_frequency'
              : factors.includes('mev_activity')
                ? 'mev'
                : 'normal',
            confidence: aiScore.confidence,
            details: {},
          },
          graphAnalysis: {
            centrality: 0.5,
            degree: 2,
            clustering: 0.3,
            paths: [],
          },
          summary: `地址 ${event.from} 的风险评分为 ${score.toFixed(2)}，风险等级为 ${level}`,
        },
        combinations: [
          {
            factors: ['基础风险'],
            score: baseScore,
            description: `基于地址画像的基础风险分析`,
          },
          {
            factors: aiScore.factors,
            score: aiScore.score,
            description: `基于AI模型的风险分析`,
          },
          {
            factors: patternScore.factors,
            score: patternScore.score,
            description: `基于交易模式的风险分析`,
          },
        ],
        timestamp: Date.now(),
        action,
      };

      logger.info('风险分析完成', {
        traceId: event.traceId,
        score,
        level,
        factorsCount: factors.length,
      });

      return result;
    } catch (error) {
      logger.error('风险分析失败', {
        traceId: event.traceId,
        error: error instanceof Error ? error.message : String(error),
      });

      // 发生错误时返回默认低风险评分
      return {
        score: 0.2,
        level: RiskLevel.LOW,
        factors: ['analysis_failed'],
        features: [
          {
            description: '分析过程发生错误',
            score: 0.2,
          },
        ],
        aiAnalysis: {
          behaviorAnalysis: {
            pattern: 'unknown',
            confidence: 0.3,
            details: {},
          },
          graphAnalysis: {
            centrality: 0,
            degree: 0,
            clustering: 0,
            paths: [],
          },
          summary: `风险分析失败`,
        },
        combinations: [
          {
            factors: ['analysis_failed'],
            score: 0.2,
            description: `风险分析过程发生错误`,
          },
        ],
        timestamp: Date.now(),
        action: 'monitor',
      };
    }
  },

  /**
   * 分析交易金额
   * @param event 交易事件
   * @returns 金额风险评分 (0-1)
   */
  analyzeTransactionAmount(event: NormalizedEvent): number {
    if (!event.value) return 0;

    try {
      const value = BigInt(event.value);

      // 超大额交易 (>10000 ETH)
      if (value > BigInt('10000000000000000000000')) {
        return 0.9;
      }

      // 大额交易 (>1000 ETH)
      if (value > BigInt('1000000000000000000000')) {
        return 0.7;
      }

      // 中等金额 (>100 ETH)
      if (value > BigInt('100000000000000000000')) {
        return 0.5;
      }

      // 小额交易 (>10 ETH)
      if (value > BigInt('10000000000000000000')) {
        return 0.3;
      }

      // 微小交易
      return 0.1;
    } catch (error) {
      // 解析失败，返回默认分数
      return 0.2;
    }
  },

  /**
   * 分析合约调用
   * @param event 交易事件
   * @returns 合约调用风险评分 (0-1)
   */
  analyzeContractCall(event: NormalizedEvent): number {
    // 检查是否为合约调用
    if (event.type !== 'contract_call') {
      return 0;
    }

    // 检查是否有方法名
    if (!event.methodName) {
      return 0.3; // 未知方法的合约调用
    }

    // 高风险方法列表
    const highRiskMethods = [
      'transfer',
      'transferFrom',
      'approve',
      'swap',
      'exchange',
      'execute',
      'delegateCall',
      'flashLoan',
    ];

    // 检查是否为高风险方法
    const methodName = event.methodName.toLowerCase();
    if (highRiskMethods.some((method) => methodName.includes(method))) {
      return 0.6; // 高风险方法
    }

    return 0.3; // 普通合约调用
  },
};
