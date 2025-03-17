import { NormalizedEvent, EventType } from '../types/events';
import { AddressProfileDAO } from '../database/dao/AddressProfileDAO';
import { EventDAO } from '../database/dao/EventDAO';
import { logger } from '../utils/logger';
import { TimeSeriesAnalyzer } from './TimeSeriesAnalyzer';
import { MEVDetector } from './MEVDetector';

/**
 * 风险模式分析器
 * 负责分析交易模式并识别异常行为
 */
export class RiskPatternAnalyzer {
  /**
   * 评估交易风险模式
   * @param event 规范化的交易事件
   * @returns 风险评分结果
   */
  static async evaluate(
    event: NormalizedEvent
  ): Promise<{ score: number; factors: string[]; confidence: number }> {
    try {
      logger.info('开始交易模式分析', {
        traceId: event.traceId,
        transactionHash: event.transactionHash,
      });

      // 获取发送方最近的交易记录
      const recentEvents = await this.getRecentEvents(event.from, 20);

      // 初始化风险因素和分数
      const factors: string[] = [];
      let patternScore = 0.1; // 基础分数

      // 分析交易频率
      const frequencyScore = await this.analyzeTransactionFrequency(event.from, recentEvents);
      if (frequencyScore > 0.6) {
        factors.push('high_frequency_trading');
        patternScore += frequencyScore * 0.3;
      }

      // 分析交易金额模式
      const valuePatternScore = this.analyzeValuePattern(recentEvents, event);
      if (valuePatternScore > 0.6) {
        factors.push('unusual_value_pattern');
        patternScore += valuePatternScore * 0.25;
      }

      // 分析合约交互模式
      const contractInteractionScore = this.analyzeContractInteractions(recentEvents);
      if (contractInteractionScore > 0.6) {
        factors.push('suspicious_contract_interaction');
        patternScore += contractInteractionScore * 0.2;
      }

      // 检测MEV行为
      const isMEV = await MEVDetector.detect(event, recentEvents);
      if (isMEV) {
        factors.push('mev_activity');
        patternScore += 0.4;
      }

      // 分析时间序列异常
      if (recentEvents.length >= 5) {
        const timeSeriesScore = TimeSeriesAnalyzer.detectAnomalies(recentEvents);
        if (timeSeriesScore > 0.5) {
          factors.push('time_series_anomaly');
          patternScore += timeSeriesScore * 0.25;
        }
      }

      // 归一化分数到 0-1 范围
      const normalizedScore = Math.min(1, patternScore);

      // 计算置信度 (基于样本数量)
      const confidence = Math.min(0.9, 0.5 + recentEvents.length / 40);

      logger.info('交易模式分析完成', {
        traceId: event.traceId,
        score: normalizedScore,
        factorsCount: factors.length,
        confidence,
      });

      return {
        score: normalizedScore,
        factors,
        confidence,
      };
    } catch (error) {
      logger.error('交易模式分析失败', {
        traceId: event.traceId,
        error: error instanceof Error ? error.message : String(error),
      });

      // 发生错误时返回默认低风险评分
      return {
        score: 0.2,
        factors: ['pattern_analysis_failed'],
        confidence: 0.3,
      };
    }
  }

  /**
   * 获取地址最近的交易记录
   * @param address 地址
   * @param limit 限制数量
   * @returns 交易记录数组
   */
  private static async getRecentEvents(address: string, limit: number): Promise<NormalizedEvent[]> {
    try {
      // 这里应该调用数据库查询获取最近交易
      // 为简化实现，我们假设 EventDAO 有一个 findByAddress 方法
      const events = await EventDAO.findByAddress(address, limit);
      // 将 IEventRecord[] 转换为 NormalizedEvent[]
      return events.map((record) => record.event) || [];
    } catch (error) {
      logger.warn('获取历史交易失败', {
        address,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * 分析交易频率
   * @param address 地址
   * @param recentEvents 最近交易
   * @returns 频率异常评分 (0-1)
   */
  private static async analyzeTransactionFrequency(
    address: string,
    recentEvents: NormalizedEvent[]
  ): Promise<number> {
    if (recentEvents.length < 2) return 0.1;

    try {
      // 获取地址画像
      const profile = await AddressProfileDAO.findByAddress(address);

      // 计算最近交易的时间间隔
      const timestamps = recentEvents.map((event) => event.timestamp).sort((a, b) => a - b);

      // 计算平均时间间隔 (秒)
      const intervals: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }

      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

      // 如果平均间隔小于30秒，视为高频交易
      if (avgInterval < 30) {
        return 0.8;
      }

      // 如果平均间隔小于5分钟，视为中频交易
      if (avgInterval < 300) {
        return 0.5;
      }

      // 如果交易总数超过正常水平 (基于历史数据)
      if (profile && profile.transactionCount > 1000 && recentEvents.length > 10) {
        return 0.4;
      }

      return 0.1;
    } catch (error) {
      return 0.2; // 默认低风险
    }
  }

  /**
   * 分析交易金额模式
   * @param recentEvents 最近交易
   * @param currentEvent 当前交易
   * @returns 金额异常评分 (0-1)
   */
  private static analyzeValuePattern(
    recentEvents: NormalizedEvent[],
    currentEvent: NormalizedEvent
  ): number {
    if (!currentEvent.value || recentEvents.length < 3) return 0.1;

    try {
      // 提取有效的金额值
      const values = recentEvents
        .filter((event) => event.value)
        .map((event) => BigInt(event.value || '0'));

      if (values.length < 3) return 0.1;

      // 计算平均值
      const sum = values.reduce((acc, val) => acc + val, BigInt(0));
      const avg = Number(sum / BigInt(values.length));

      // 当前交易金额
      const currentValue = Number(BigInt(currentEvent.value));

      // 如果当前交易金额是平均值的10倍以上
      if (currentValue > avg * 10) {
        return 0.9;
      }

      // 如果当前交易金额是平均值的5倍以上
      if (currentValue > avg * 5) {
        return 0.7;
      }

      // 如果当前交易金额是平均值的2倍以上
      if (currentValue > avg * 2) {
        return 0.4;
      }

      return 0.1;
    } catch (error) {
      return 0.2; // 默认低风险
    }
  }

  /**
   * 分析合约交互模式
   * @param recentEvents 最近交易
   * @returns 合约交互异常评分 (0-1)
   */
  private static analyzeContractInteractions(recentEvents: NormalizedEvent[]): number {
    if (recentEvents.length < 5) return 0.1;

    // 计算合约调用比例
    const contractCalls = recentEvents.filter((event) => event.type === EventType.CONTRACT_CALL);
    const contractCallRatio = contractCalls.length / recentEvents.length;

    // 如果合约调用比例超过80%
    if (contractCallRatio > 0.8) {
      return 0.7;
    }

    // 如果合约调用比例超过50%
    if (contractCallRatio > 0.5) {
      return 0.4;
    }

    // 检查是否有多次调用同一合约
    const contractAddresses = contractCalls.map((event) => event.to);
    const uniqueContracts = new Set(contractAddresses);

    // 如果调用了多个不同合约
    if (uniqueContracts.size > 5) {
      return 0.5;
    }

    // 如果反复调用同一合约
    if (contractCalls.length > 5 && uniqueContracts.size === 1) {
      return 0.6;
    }

    return 0.1;
  }
}
