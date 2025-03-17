import { NormalizedEvent } from '../types/events';
import { logger } from '../utils/logger';

/**
 * 时间序列分析器
 * 负责分析交易时间序列并检测异常模式
 */
export class TimeSeriesAnalyzer {
  /**
   * 检测时间序列中的异常
   * @param events 交易事件数组
   * @returns 异常评分 (0-1)
   */
  static detectAnomalies(events: NormalizedEvent[]): number {
    // 对空数组或单个事件返回0
    if (events.length === 0) return 0;
    if (events.length === 1) return 0;
    if (events.length < 5) return 0.1;

    try {
      // 提取时间戳并排序
      const timestamps = events.map((event) => event.timestamp).sort((a, b) => a - b);

      // 计算时间间隔
      const intervals: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }

      // 计算平均间隔和标准差
      const avgInterval = this.calculateMean(intervals);
      const stdDeviation = this.calculateStandardDeviation(intervals, avgInterval);

      // 计算变异系数 (标准差/平均值)
      const coefficientOfVariation = stdDeviation / avgInterval;

      // 检测异常模式
      let anomalyScore = 0.1;

      // 1. 检测极度规律的交易 (机器人特征)
      if (coefficientOfVariation < 0.1 && intervals.length > 5) {
        anomalyScore = 0.8; // 高度规律的交易模式
      }

      // 2. 检测突发交易 (短时间内大量交易)
      const burstThreshold = avgInterval * 0.2;
      const burstCount = intervals.filter((interval) => interval < burstThreshold).length;
      const burstRatio = burstCount / intervals.length;

      if (burstRatio > 0.7 && intervals.length > 5) {
        anomalyScore = Math.max(anomalyScore, 0.7);
      }

      // 3. 检测周期性模式 (可能是自动化脚本)
      const periodicityScore = this.detectPeriodicity(intervals);
      anomalyScore = Math.max(anomalyScore, periodicityScore);

      // 4. 检测异常的交易时间分布
      const timeDistributionScore = this.analyzeTimeDistribution(events);
      anomalyScore = Math.max(anomalyScore, timeDistributionScore);

      // 5. 检测循环交易模式
      const cyclicScore = this.detectCyclicPattern(events);
      anomalyScore = Math.max(anomalyScore, cyclicScore);

      // 6. 检测洗盘交易模式
      const washTradingScore = this.detectWashTrading(events);
      anomalyScore = Math.max(anomalyScore, washTradingScore);

      // 7. 检测交易金额异常
      const valueAnomalyScore = this.detectValueAnomalies(events);
      anomalyScore = Math.max(anomalyScore, valueAnomalyScore);

      // 8. 检测不均匀时间间隔
      const irregularIntervalScore = this.detectIrregularIntervals(intervals);
      anomalyScore = Math.max(anomalyScore, irregularIntervalScore);

      // 9. 检测混合交易模式
      if (events.length >= 10) {
        const mixedPatternScore = this.detectMixedPatterns(events);
        // 限制混合模式评分不超过 0.75
        const adjustedMixedScore = Math.min(0.75, mixedPatternScore);
        anomalyScore = Math.max(anomalyScore, adjustedMixedScore);
      }

      return anomalyScore;
    } catch (error) {
      logger.warn('时间序列分析失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0.2; // 默认低风险
    }
  }

  /**
   * 计算数组平均值
   * @param values 数值数组
   * @returns 平均值
   */
  private static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * 计算标准差
   * @param values 数值数组
   * @param mean 平均值
   * @returns 标准差
   */
  private static calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length < 2) return 0;

    const squaredDifferences = values.map((value) => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 检测时间间隔的周期性
   * @param intervals 时间间隔数组
   * @returns 周期性评分 (0-1)
   */
  private static detectPeriodicity(intervals: number[]): number {
    if (intervals.length < 10) return 0.1;

    // 简化的周期性检测：检查是否有重复的间隔模式
    const patternSize = 3; // 寻找3个间隔的重复模式
    let patternCount = 0;

    for (let i = 0; i <= intervals.length - patternSize * 2; i++) {
      const pattern = intervals.slice(i, i + patternSize);
      const nextPattern = intervals.slice(i + patternSize, i + patternSize * 2);

      // 检查两个模式是否相似
      const isPatternSimilar = this.arePatternsSimilar(pattern, nextPattern);
      if (isPatternSimilar) {
        patternCount++;
      }
    }

    // 计算周期性评分
    const maxPossiblePatterns = intervals.length - patternSize * 2 + 1;
    const periodicityRatio = patternCount / maxPossiblePatterns;

    if (periodicityRatio > 0.7) return 0.9;
    if (periodicityRatio > 0.5) return 0.7;
    if (periodicityRatio > 0.3) return 0.5;

    return 0.1;
  }

  /**
   * 检查两个模式是否相似
   * @param pattern1 模式1
   * @param pattern2 模式2
   * @returns 是否相似
   */
  private static arePatternsSimilar(pattern1: number[], pattern2: number[]): boolean {
    if (pattern1.length !== pattern2.length) return false;

    const tolerance = 0.2; // 允许20%的误差

    for (let i = 0; i < pattern1.length; i++) {
      const ratio = pattern1[i] / pattern2[i];
      if (ratio < 1 - tolerance || ratio > 1 + tolerance) {
        return false;
      }
    }

    return true;
  }

  /**
   * 分析交易时间分布
   * @param events 交易事件数组
   * @returns 时间分布异常评分 (0-1)
   */
  private static analyzeTimeDistribution(events: NormalizedEvent[]): number {
    if (events.length < 5) return 0.1;

    // 统计每个小时的交易数量
    const hourCounts = new Array(24).fill(0);

    events.forEach((event) => {
      const hour = new Date(event.timestamp * 1000).getHours();
      hourCounts[hour]++;
    });

    // 计算活跃小时数 (有交易的小时)
    const activeHours = hourCounts.filter((count) => count > 0).length;

    // 如果交易集中在少数几个小时，可能是异常
    if (activeHours <= 3 && events.length > 10) {
      return 0.7;
    }

    // 检查是否在深夜时段 (0-5点) 有大量交易
    const nightHoursTotal = hourCounts.slice(0, 5).reduce((sum, count) => sum + count, 0);
    const nightRatio = nightHoursTotal / events.length;

    if (nightRatio > 0.5 && events.length > 5) {
      return 0.8; // 深夜交易比例高
    }

    return 0.1;
  }

  /**
   * 检测循环交易模式
   * @param events 交易事件数组
   * @returns 循环交易评分 (0-1)
   */
  private static detectCyclicPattern(events: NormalizedEvent[]): number {
    if (events.length < 4) return 0.1;

    // 统计地址对之间的交易次数
    const addressPairCounts: Record<string, number> = {};

    for (const event of events) {
      const addressPair = `${event.from.toLowerCase()}-${event.to.toLowerCase()}`;
      addressPairCounts[addressPair] = (addressPairCounts[addressPair] || 0) + 1;
    }

    // 检查是否有地址对之间的交易次数超过阈值
    const maxPairCount = Math.max(...Object.values(addressPairCounts));
    const pairCountRatio = maxPairCount / events.length;

    // 检查是否有循环交易模式 (A->B->A->B)
    const addressSequence = events.map(event => `${event.from.toLowerCase()}-${event.to.toLowerCase()}`);
    let cyclicPatternCount = 0;

    for (let i = 0; i < addressSequence.length - 2; i++) {
      const pair1 = addressSequence[i];
      const pair2 = addressSequence[i + 1];
      
      // 检查是否形成循环 (A->B, B->A)
      const [from1, to1] = pair1.split('-');
      const [from2, to2] = pair2.split('-');
      
      if (from1 === to2 && to1 === from2) {
        cyclicPatternCount++;
      }
    }

    const cyclicRatio = cyclicPatternCount / (events.length - 1);

    // 如果是用户1和用户2之间反复交易的模式，评分更高
    if (pairCountRatio > 0.4 && events.length > 4) {
      return 0.7;
    }

    // 如果检测到明显的循环交易模式
    if (cyclicRatio > 0.5) {
      return 0.8;
    }

    return 0.1;
  }

  /**
   * 检测洗盘交易模式
   * @param events 交易事件数组
   * @returns 洗盘交易评分 (0-1)
   */
  private static detectWashTrading(events: NormalizedEvent[]): number {
    if (events.length < 6) return 0.1;

    // 统计每个地址的交易次数
    const addressCounts: Record<string, { sent: number; received: number }> = {};

    for (const event of events) {
      const from = event.from.toLowerCase();
      const to = event.to.toLowerCase();

      if (!addressCounts[from]) {
        addressCounts[from] = { sent: 0, received: 0 };
      }
      if (!addressCounts[to]) {
        addressCounts[to] = { sent: 0, received: 0 };
      }

      addressCounts[from].sent++;
      addressCounts[to].received++;
    }

    // 检查是否有地址既有大量发送又有大量接收
    let washTradingScore = 0.1;
    
    for (const [address, counts] of Object.entries(addressCounts)) {
      const totalActivity = counts.sent + counts.received;
      const activityRatio = totalActivity / (events.length * 2); // 每个交易有两个地址参与
      
      // 如果一个地址既有发送又有接收，且活动占比高
      if (counts.sent > 0 && counts.received > 0 && activityRatio > 0.3) {
        // 计算发送和接收的平衡度 (越接近1越可疑)
        const balanceRatio = Math.min(counts.sent, counts.received) / Math.max(counts.sent, counts.received);
        
        if (balanceRatio > 0.7 && totalActivity > 5) {
          washTradingScore = 0.9; // 高度可疑的洗盘交易
        } else if (balanceRatio > 0.5 && totalActivity > 3) {
          washTradingScore = Math.max(washTradingScore, 0.7);
        } else if (balanceRatio > 0.3) {
          washTradingScore = Math.max(washTradingScore, 0.5);
        }
      }
    }

    return washTradingScore;
  }

  /**
   * 检测交易金额异常
   * @param events 交易事件数组
   * @returns 金额异常评分 (0-1)
   */
  private static detectValueAnomalies(events: NormalizedEvent[]): number {
    if (events.length < 3) return 0.1;

    // 提取交易金额并转换为数字
    const values = events
      .filter(event => event.value)
      .map(event => {
        try {
          return parseFloat(event.value || '0');
        } catch {
          return 0;
        }
      })
      .filter(value => !isNaN(value) && value > 0);

    if (values.length < 3) return 0.1;

    // 计算平均值和标准差
    const avgValue = this.calculateMean(values);
    const stdDeviation = this.calculateStandardDeviation(values, avgValue);
    
    // 计算变异系数
    const coefficientOfVariation = stdDeviation / avgValue;
    
    // 检查是否有异常大额交易
    const largeThreshold = avgValue + 3 * stdDeviation;
    const largeTransactions = values.filter(value => value > largeThreshold);
    const largeRatio = largeTransactions.length / values.length;
    
    // 检查是否有异常小额交易
    const smallThreshold = Math.max(0.1, avgValue - stdDeviation);
    const smallTransactions = values.filter(value => value < smallThreshold);
    const smallRatio = smallTransactions.length / values.length;
    
    // 如果交易金额变化很大
    if (coefficientOfVariation > 2) {
      return 0.7;
    }
    
    // 如果有明显的大额交易
    if (largeRatio > 0.2 && values.length > 4) {
      return 0.6;
    }
    
    // 如果大小交易混合，可能是洗盘
    if (largeRatio > 0.1 && smallRatio > 0.3 && values.length > 5) {
      return 0.7;
    }
    
    return 0.1;
  }

  /**
   * 检测不均匀时间间隔
   * @param intervals 时间间隔数组
   * @returns 不均匀时间间隔评分 (0-1)
   */
  private static detectIrregularIntervals(intervals: number[]): number {
    if (intervals.length < 5) return 0.1;

    // 计算平均间隔和标准差
    const avgInterval = this.calculateMean(intervals);
    const stdDeviation = this.calculateStandardDeviation(intervals, avgInterval);
    
    // 计算变异系数 (标准差/平均值)
    const coefficientOfVariation = stdDeviation / avgInterval;
    
    // 检查是否有极端间隔
    const maxInterval = Math.max(...intervals);
    const minInterval = Math.min(...intervals);
    const intervalRange = maxInterval / minInterval;
    
    // 如果时间间隔变化很大
    if (coefficientOfVariation > 1.5) {
      return 0.6;
    }
    
    // 如果最大和最小间隔差异很大
    if (intervalRange > 10) {
      return 0.5;
    }
    
    // 检查是否有突然的间隔变化
    let suddenChangeCount = 0;
    for (let i = 1; i < intervals.length; i++) {
      const ratio = intervals[i] / intervals[i-1];
      if (ratio > 5 || ratio < 0.2) {
        suddenChangeCount++;
      }
    }
    
    const suddenChangeRatio = suddenChangeCount / (intervals.length - 1);
    if (suddenChangeRatio > 0.3) {
      return 0.7;
    }
    
    return 0.4; // 默认返回中等分数，因为不均匀时间间隔本身就有一定异常性
  }

  /**
   * 检测混合交易模式
   * @param events 交易事件数组
   * @returns 混合模式评分 (0-1)
   */
  private static detectMixedPatterns(events: NormalizedEvent[]): number {
    if (events.length < 5) return 0.1;

    // 统计地址参与频率
    const addressFrequency: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.from) {
        addressFrequency[event.from] = (addressFrequency[event.from] || 0) + 1;
      }
      if (event.to) {
        addressFrequency[event.to] = (addressFrequency[event.to] || 0) + 1;
      }
    });
    
    // 计算地址参与分布
    const frequencies = Object.values(addressFrequency);
    const maxFrequency = Math.max(...frequencies);
    const avgFrequency = this.calculateMean(frequencies);
    
    // 计算地址参与的标准差
    const stdDeviation = this.calculateStandardDeviation(frequencies, avgFrequency);
    const coefficientOfVariation = stdDeviation / avgFrequency;
    
    // 检查重复交易对
    const pairs = new Set<string>();
    const repeatedPairs = new Set<string>();
    
    events.forEach(event => {
      if (event.from && event.to) {
        const pair = `${event.from}-${event.to}`;
        if (pairs.has(pair)) {
          repeatedPairs.add(pair);
        } else {
          pairs.add(pair);
        }
      }
    });
    
    const repeatedRatio = repeatedPairs.size / Math.max(1, pairs.size);
    
    // 计算最终评分 - 降低评分上限为 0.7
    let mixedScore = 0.1;
    
    // 如果有高频参与者
    if (maxFrequency > events.length * 0.35) {
      mixedScore = Math.max(mixedScore, 0.4);
    }
    
    // 如果地址参与分布不均匀
    if (coefficientOfVariation > 1.2) {
      mixedScore = Math.max(mixedScore, 0.5);
    }
    
    // 如果有大量重复交易对
    if (repeatedRatio > 0.25) {
      mixedScore = Math.max(mixedScore, 0.6);
    }
    
    // 进一步限制评分
    mixedScore = Math.min(0.7, mixedScore);
    
    return mixedScore;
  }
}
