/**
 * @file 事件类型定义
 * @description 定义区块链事件相关的类型和接口
 */

// 区块链事件类型
export enum EventType {
  TRANSFER = 'transfer',
  CONTRACT_CALL = 'contract_call',
  CONTRACT_CREATION = 'contract_creation',
  TOKEN_TRANSFER = 'token_transfer',
  TOKEN_APPROVE = 'token_approve',
  TOKEN_MINT = 'token_mint',
  TOKEN_BURN = 'token_burn',
  UNKNOWN = 'unknown',
}

// 转账事件接口
export interface TransferEvent {
  type: EventType.TRANSFER;
  from: string;
  to: string;
  value: string;
  chainId: number;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

// 合约调用事件接口
export interface ContractCallEvent {
  type: EventType.CONTRACT_CALL;
  from: string;
  to: string;
  methodName: string;
  methodSignature: string;
  input: string;
  output?: string;
  value: string;
  chainId: number;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

// 规范化的事件接口
export interface NormalizedEvent {
  // 事件基本信息
  traceId: string;
  type: EventType;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;

  // 区块链信息
  chainId: number;
  blockNumber: number;
  transactionHash: string;

  // 来源和目标
  from: string;
  to: string;

  // 事件内容
  value?: string;
  tokenAddress?: string;
  methodName?: string;
  methodSignature?: string;
  input?: string;
  output?: string;
  params?: Record<string, unknown>;

  // 元数据
  metadata?: Record<string, unknown>;
  raw?: unknown;
}

// 风险等级
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 风险分析结果
export interface RiskAnalysis {
  score: number;
  level: RiskLevel;
  factors: string[];
  features: Array<{
    description: string;
    score: number;
  }>;
  details?: Record<string, unknown>;
}

// 事件处理状态
export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// 事件处理结果
export interface EventProcessingResult {
  status: EventStatus;
  error?: string;
  riskAnalysis?: RiskAnalysis;
  processingDuration?: number;
  metadata?: Record<string, unknown>;
}

export interface BlockchainEvent {
  id: string;
  type: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  address: string;
  data: Record<string, unknown>;
  riskLevel?: RiskLevel;
  riskScore?: number;
  metadata?: Record<string, unknown>;
}
