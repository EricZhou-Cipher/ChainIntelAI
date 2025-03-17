import { RiskLevel } from './events.js';

// 地址画像接口
export interface AddressProfile {
  // 基本信息
  address: string;
  chainId: number;
  createdAt: Date;
  updatedAt: Date;
  
  // 交易统计
  totalTransactions: number;
  totalVolume: string;
  lastTransactionTime: Date;
  
  // 合约交互
  contractInteractions: {
    contractAddress: string;
    methodName: string;
    count: number;
    lastInteraction: Date;
  }[];
  
  // 代币持有
  tokenBalances: {
    tokenAddress: string;
    balance: string;
    symbol: string;
    decimals: number;
    lastUpdate: Date;
  }[];
  
  // 风险评分
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastRiskUpdate: Date;
  
  // 标签
  tags: string[];
  
  // 元数据
  metadata?: Record<string, any>;
}

// 地址画像配置
export interface ProfilerConfig {
  // 链配置
  chains: {
    id: number;
    name: string;
    rpcUrl: string;
    wsUrl?: string;
    blockTime: number;
    confirmations: number;
  }[];
  
  // 缓存配置
  cache: {
    ttl: number;
    maxSize: number;
  };
  
  // 风险分析配置
  riskAnalysis: {
    enabled: boolean;
    updateInterval: number;
    minScore: number;
    maxScore: number;
  };
  
  // 标签配置
  tags: {
    enabled: boolean;
    updateInterval: number;
    maxTags: number;
  };
} 