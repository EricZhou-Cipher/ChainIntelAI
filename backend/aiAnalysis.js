import { ethers } from "ethers";
import logger from "./config/logger.js";
import { getChainConfig } from "./config/chains.js";

// 风险等级定义
export const RiskLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
};

// 风险评分权重
const WEIGHTS = {
  amount: 0.25,
  addressHistory: 0.2,
  blacklist: 0.15,
  timePattern: 0.1,
  contractInteraction: 0.15,
  behaviorPattern: 0.15,
};

// 风险阈值
const THRESHOLDS = {
  amount: {
    low: ethers.parseEther("0.1"),
    medium: ethers.parseEther("1"),
    high: ethers.parseEther("10"),
  },
  addressHistory: {
    low: 5,
    medium: 20,
    high: 50,
  },
};

/**
 * 分析转账金额风险
 * @param {string} amount - 转账金额（Wei）
 * @param {number} chainId - 链 ID
 * @returns {number} 风险分数 (0-1)
 */
function analyzeAmount(amount, chainId) {
  const chain = getChainConfig(chainId);
  const value = BigInt(amount);
  const { low, medium, high } = chain.riskConfig.amountThresholds;

  if (value <= low) return 0;
  if (value <= medium) return 0.5;
  if (value <= high) return 0.8;
  return 1;
}

/**
 * 分析地址历史风险
 * @param {Object} history - 地址交互历史
 * @param {number} chainId - 链 ID
 * @returns {number} 风险分数 (0-1)
 */
function analyzeAddressHistory(history, chainId) {
  const chain = getChainConfig(chainId);
  const { totalTransactions, uniqueAddresses } = history;
  const { maxTransactionsPerWindow } = chain.riskConfig;

  // 计算交易频率得分
  const frequencyScore = Math.min(
    totalTransactions / maxTransactionsPerWindow,
    1
  );

  // 计算地址多样性得分
  const diversityScore = Math.min(uniqueAddresses / 20, 1); // 假设20个不同地址为高风险

  return (frequencyScore + diversityScore) / 2;
}

/**
 * 检查地址是否在黑名单中
 * @param {string} address - 要检查的地址
 * @param {Array} blacklist - 黑名单地址列表
 * @returns {number} 风险分数 (0-1)
 */
function checkBlacklist(address, blacklist) {
  return blacklist.includes(address.toLowerCase()) ? 1 : 0;
}

/**
 * 分析时间模式风险
 * @param {number} timestamp - 交易时间戳
 * @returns {number} 风险分数 (0-1)
 */
function analyzeTimePattern(timestamp) {
  const date = new Date(timestamp * 1000);
  const hour = date.getHours();
  const day = date.getDay();

  // 凌晨2-4点的交易风险较高
  const nightScore = hour >= 2 && hour < 4 ? 0.8 : 0;

  // 周末交易风险较高
  const weekendScore = day === 0 || day === 6 ? 0.6 : 0;

  return Math.max(nightScore, weekendScore);
}

/**
 * 分析合约交互风险
 * @param {Object} contractData - 合约交互数据
 * @returns {number} 风险分数 (0-1)
 */
function analyzeContractInteraction(contractData) {
  const {
    isContract,
    hasComplexLogic,
    hasHighRiskFunctions,
    isVerified,
    hasAudit,
  } = contractData;

  if (!isContract) return 0;

  let score = 0.5; // 基础风险分数

  if (hasComplexLogic) score += 0.2;
  if (hasHighRiskFunctions) score += 0.2;
  if (!isVerified) score += 0.1;
  if (!hasAudit) score += 0.1;

  return Math.min(score, 1);
}

/**
 * 分析行为模式风险
 * @param {Object} behaviorData - 行为数据
 * @returns {number} 风险分数 (0-1)
 */
function analyzeBehaviorPattern(behaviorData) {
  const {
    isFirstTimeSender,
    isFirstTimeReceiver,
    hasRecentHighValueTransfers,
    hasMultipleContractsInvolved,
  } = behaviorData;

  let score = 0;

  if (isFirstTimeSender) score += 0.3;
  if (isFirstTimeReceiver) score += 0.3;
  if (hasRecentHighValueTransfers) score += 0.2;
  if (hasMultipleContractsInvolved) score += 0.2;

  return Math.min(score, 1);
}

/**
 * 综合分析转账风险
 * @param {Object} event - 转账事件数据
 * @param {Object} context - 上下文数据
 * @returns {Object} 风险分析结果
 */
export async function analyzeTransfer(event, context) {
  try {
    const { from, to, value, timestamp, chainId } = event;

    // 获取链配置
    const chain = getChainConfig(chainId);

    // 计算各维度风险分数
    const amountScore = analyzeAmount(value, chainId);
    const fromHistoryScore = analyzeAddressHistory(
      context.fromHistory,
      chainId
    );
    const toHistoryScore = analyzeAddressHistory(context.toHistory, chainId);
    const blacklistScore = Math.max(
      checkBlacklist(from, context.blacklist),
      checkBlacklist(to, context.blacklist)
    );
    const timeScore = analyzeTimePattern(timestamp);
    const contractScore = analyzeContractInteraction(context.contractData);
    const behaviorScore = analyzeBehaviorPattern(context.behaviorData);

    // 计算加权总分
    const totalScore =
      amountScore * WEIGHTS.amount +
      ((fromHistoryScore + toHistoryScore) / 2) * WEIGHTS.addressHistory +
      blacklistScore * WEIGHTS.blacklist +
      timeScore * WEIGHTS.timePattern +
      contractScore * WEIGHTS.contractInteraction +
      behaviorScore * WEIGHTS.behaviorPattern;

    // 确定风险等级
    let riskLevel;
    if (totalScore < 0.3) {
      riskLevel = RiskLevel.LOW;
    } else if (totalScore < 0.7) {
      riskLevel = RiskLevel.MEDIUM;
    } else {
      riskLevel = RiskLevel.HIGH;
    }

    // 记录分析结果
    logger.info("转账风险分析完成", {
      chainId,
      chainName: chain.name,
      txHash: event.txHash,
      from,
      to,
      amount: ethers.formatEther(value),
      riskLevel,
      scores: {
        amount: amountScore,
        history: (fromHistoryScore + toHistoryScore) / 2,
        blacklist: blacklistScore,
        time: timeScore,
        contract: contractScore,
        behavior: behaviorScore,
        total: totalScore,
      },
    });

    return {
      riskLevel,
      score: totalScore,
      details: {
        amountScore,
        historyScore: (fromHistoryScore + toHistoryScore) / 2,
        blacklistScore,
        timeScore,
        contractScore,
        behaviorScore,
      },
    };
  } catch (error) {
    logger.error("风险分析失败:", {
      error: error.message,
      event,
    });
    throw error;
  }
}
