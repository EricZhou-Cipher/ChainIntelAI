// 风险分析规则配置

// 风险权重配置
export const riskWeights = {
  // 资金流动维度 (30%)
  FLOW: {
    weight: 0.3,
    factors: {
      LARGE_TRANSFER: 0.4, // 大额转账
      FREQUENT_TRANSFER: 0.3, // 频繁转账
      IRREGULAR_PATTERN: 0.3, // 异常模式
    },
  },

  // 地址行为维度 (30%)
  BEHAVIOR: {
    weight: 0.3,
    factors: {
      CONTRACT_INTERACTION: 0.35, // 合约交互
      BATCH_OPERATION: 0.35, // 批量操作
      ADDRESS_CREATION: 0.3, // 地址创建
    },
  },

  // 关联风险维度 (25%)
  ASSOCIATION: {
    weight: 0.25,
    factors: {
      BLACKLIST: 0.4, // 黑名单关联
      RISK_NEIGHBOR: 0.3, // 风险地址关联
      MIXER_INTERACTION: 0.3, // 混币器交互
    },
  },

  // 历史特征维度 (15%)
  HISTORICAL: {
    weight: 0.15,
    factors: {
      ACCOUNT_AGE: 0.3, // 账户年龄
      ACTIVITY_PATTERN: 0.4, // 活动模式
      BALANCE_CHANGES: 0.3, // 余额变化
    },
  },
};

// 风险阈值配置
export const riskThresholds = {
  // 大额转账阈值(单位: ETH)
  largeTransferThresholds: {
    1: '100', // ETH: 100
    56: '1000', // BSC: 1000
    137: '10000', // Polygon: 10000
  },

  // 频繁转账阈值
  frequentTransferThresholds: {
    txCount: 10, // 10笔/小时
    uniqueAddressCount: 5, // 5个不同地址
  },

  // 批量操作阈值
  batchOperationThresholds: {
    minOperations: 3, // 最少3笔
    timeWindowMs: 300000, // 5分钟内
  },

  // 关联风险阈值
  associationThresholds: {
    blacklistDistance: 2, // 黑名单地址距离
    riskNeighborRatio: 0.3, // 风险邻居比例
  },
};

// 风险标签定义
export const riskTags = {
  // 资金流动相关
  FLOW: {
    LARGE_TRANSFER: '大额转账',
    FREQUENT_TRANSFER: '频繁转账',
    IRREGULAR_PATTERN: '异常模式',
    MIXED_FUNDS: '资金混合',
    LAYERING: '分层转账',
  },

  // 地址行为相关
  BEHAVIOR: {
    BATCH_OPERATION: '批量操作',
    CONTRACT_DEPLOYMENT: '合约部署',
    HONEYPOT_INTERACTION: '蜜罐交互',
    SUSPICIOUS_CONTRACT: '可疑合约',
  },

  // 关联风险相关
  ASSOCIATION: {
    BLACKLIST: '黑名单',
    MIXER: '混币器',
    RISK_NEIGHBOR: '风险关联',
    PHISHING: '钓鱼地址',
  },

  // 历史特征相关
  HISTORICAL: {
    NEW_ACCOUNT: '新账户',
    DORMANT_ACTIVATED: '休眠激活',
    PATTERN_CHANGE: '模式变化',
  },
};

// 组合规则配置
export const combinationRules = [
  {
    // 资金清洗特征
    name: 'MONEY_LAUNDERING',
    conditions: [
      { tag: 'LARGE_TRANSFER', count: 1 },
      { tag: 'FREQUENT_TRANSFER', count: 5 },
      { tag: 'MIXER', count: 1 },
    ],
    weight: 1.5, // 权重提升50%
  },
  {
    // 蜜罐诈骗特征
    name: 'HONEYPOT_SCAM',
    conditions: [
      { tag: 'HONEYPOT_INTERACTION', count: 1 },
      { tag: 'SUSPICIOUS_CONTRACT', count: 1 },
      { tag: 'BATCH_OPERATION', count: 3 },
    ],
    weight: 2.0, // 权重提升100%
  },
];

// AI分析配置
export const aiConfig = {
  // 文本摘要模型配置
  textSummarizer: {
    modelPath: './aiModels/textSummarizer',
    maxLength: 200,
    temperature: 0.7,
  },

  // 行为序列分析模型配置
  behaviorSequence: {
    modelPath: './aiModels/behaviorSequenceModel',
    sequenceLength: 50,
    threshold: 0.8,
  },

  // 交易图谱分析配置
  transactionGraph: {
    modelPath: './aiModels/transactionGraphModel',
    maxNodes: 1000,
    communityDetectionAlgo: 'louvain',
  },
};

// 风险等级定义
export const riskLevels = {
  HIGH: {
    minScore: 80,
    description: '高风险',
    action: '立即通知并人工审核',
  },
  MEDIUM: {
    minScore: 50,
    description: '中风险',
    action: '持续监控',
  },
  LOW: {
    minScore: 0,
    description: '低风险',
    action: '常规监控',
  },
};
