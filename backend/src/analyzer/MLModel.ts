import { NormalizedEvent, RiskLevel } from '../types/events';
import { AddressProfileDAO } from '../database/dao/AddressProfileDAO';
import { RiskPatternAnalyzer } from './RiskPatternAnalyzer';
import { logger } from '../utils/logger';

export interface RiskScore {
  score: number;
  level: RiskLevel;
  factors: string[];
  confidence: number;
}

/**
 * 机器学习风险评分模型
 * 负责分析交易模式并提供智能风险评分
 */
export class MLModel {
  /**
   * 分析交易风险，结合历史交易模式和AI评分
   * @param event 规范化的交易事件
   * @returns 风险评分结果
   */
  static async analyzeRisk(event: NormalizedEvent): Promise<RiskScore> {
    try {
      logger.info('开始AI风险分析', {
        traceId: event.traceId,
        transactionHash: event.transactionHash,
      });

      // 获取历史交易模式评分
      const patternScore = await RiskPatternAnalyzer.evaluate(event);

      // 获取地址关联风险评分
      const addressRiskScore = await this.evaluateAddressRisk(event);

      // 获取交易时间异常评分
      const timeAnomalyScore = this.evaluateTimeAnomaly(event);

      // 获取交易金额异常评分
      const valueAnomalyScore = this.evaluateValueAnomaly(event);

      // 综合评分 (加权平均)
      const finalScore =
        patternScore.score * 0.4 +
        addressRiskScore.score * 0.3 +
        timeAnomalyScore * 0.15 +
        valueAnomalyScore * 0.15;

      // 确定风险等级
      const level = this.determineRiskLevel(finalScore);

      // 汇总风险因素
      const factors = [...patternScore.factors, ...addressRiskScore.factors];

      // 添加时间异常因素
      if (timeAnomalyScore > 0.6) {
        factors.push('unusual_time_activity');
      }

      // 添加金额异常因素
      if (valueAnomalyScore > 0.6) {
        factors.push('unusual_value_pattern');
      }

      // 计算置信度 (基于样本数量和模式匹配度)
      const confidence = Math.min(
        0.95,
        patternScore.confidence * 0.7 + addressRiskScore.confidence * 0.3
      );

      logger.info('AI风险分析完成', {
        traceId: event.traceId,
        score: finalScore,
        level,
        factorsCount: factors.length,
        confidence,
      });

      return {
        score: finalScore,
        level,
        factors,
        confidence,
      };
    } catch (error) {
      logger.error('AI风险分析失败', {
        traceId: event.traceId,
        error: error instanceof Error ? error.message : String(error),
      });

      // 发生错误时返回默认低风险评分
      return {
        score: 0.2,
        level: RiskLevel.LOW,
        factors: ['ai_analysis_failed'],
        confidence: 0.3,
      };
    }
  }

  /**
   * 评估地址关联风险
   * @param event 交易事件
   * @returns 地址风险评分
   */
  private static async evaluateAddressRisk(
    event: NormalizedEvent
  ): Promise<{ score: number; factors: string[]; confidence: number }> {
    try {
      // 获取发送方地址画像
      const fromProfile = await AddressProfileDAO.findByAddress(event.from);

      // 获取接收方地址画像
      const toProfile = await AddressProfileDAO.findByAddress(event.to);

      const factors: string[] = [];
      let score = 0.1; // 基础分

      // 评估发送方风险
      if (fromProfile) {
        // 使用地址画像中的风险分数
        score += fromProfile.riskScore * 0.4;

        // 检查是否为新地址
        const firstSeenDate = new Date(fromProfile.firstSeen);
        const now = new Date();
        const addressAgeDays = (now.getTime() - firstSeenDate.getTime()) / (1000 * 60 * 60 * 24);

        if (addressAgeDays < 7) {
          score += 0.2;
          factors.push('new_address');
        }

        // 检查地址标签
        if (fromProfile.tags.some((tag) => tag.includes('blacklist') || tag.includes('scam'))) {
          score += 0.8; // 增加黑名单地址的风险分数
          factors.push('blacklisted_address');
        }
      } else {
        // 未知地址，增加风险分数
        score += 0.3;
        factors.push('unknown_sender');
      }

      // 评估接收方风险
      if (toProfile) {
        // 使用地址画像中的风险分数
        score += toProfile.riskScore * 0.3;

        // 检查地址标签
        if (toProfile.tags.some((tag) => tag.includes('blacklist') || tag.includes('scam'))) {
          score += 0.3;
          factors.push('blacklisted_recipient');
        }

        // 检查是否为混币器
        if (toProfile.tags.some((tag) => tag.includes('mixer'))) {
          score += 0.5;
          factors.push('mixer_interaction');
        }
      } else {
        // 未知地址，增加风险分数
        score += 0.2;
        factors.push('unknown_recipient');
      }

      // 归一化分数到 0-1 范围
      const normalizedScore = Math.min(1, score);

      return {
        score: normalizedScore,
        factors,
        confidence: fromProfile && toProfile ? 0.8 : 0.5,
      };
    } catch (error) {
      logger.warn('地址风险评估失败', {
        traceId: event.traceId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        score: 0.3,
        factors: ['address_risk_evaluation_failed'],
        confidence: 0.4,
      };
    }
  }

  /**
   * 评估交易时间异常性
   * @param event 交易事件
   * @returns 时间异常评分 (0-1)
   */
  private static evaluateTimeAnomaly(event: NormalizedEvent): number {
    const transactionTime = new Date(event.timestamp * 1000);
    const hour = transactionTime.getHours();

    // 深夜交易 (0-5点) 增加风险
    if (hour >= 0 && hour < 5) {
      return 0.7;
    }

    // 其他时间段正常
    return 0.1;
  }

  /**
   * 评估交易金额异常性
   * @param event 交易事件
   * @returns 金额异常评分 (0-1)
   */
  private static evaluateValueAnomaly(event: NormalizedEvent): number {
    if (!event.value) return 0.1;

    try {
      const value = BigInt(event.value);

      // 大额交易 (>1000 ETH)
      if (value > BigInt('1000000000000000000000')) {
        return 0.9; // 增加大额交易的风险分数
      }

      // 中等金额 (>100 ETH)
      if (value > BigInt('100000000000000000000')) {
        return 0.6;
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
  }

  /**
   * 根据分数确定风险等级
   * @param score 风险分数 (0-1)
   * @returns 风险等级
   */
  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= 0.9) return RiskLevel.CRITICAL;
    if (score >= 0.7) return RiskLevel.HIGH;
    if (score >= 0.4) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
}
