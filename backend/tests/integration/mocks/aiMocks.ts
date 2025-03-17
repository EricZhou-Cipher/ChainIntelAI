import { NormalizedEvent } from '../../../types/events';
import { AddressProfile } from './profileMocks';

export interface RiskAnalysisResult {
  score: number;
  factors: string[];
  details: string;
  confidence: number;
  timestamp: number;
  metadata: {
    modelVersion: string;
    executionTime: number;
    inputFeatures: string[];
  };
}

export interface RiskAnalysisOptions {
  score?: number;
  factors?: string[];
  details?: string;
  confidence?: number;
  timestamp?: number;
  metadata?: {
    modelVersion?: string;
    executionTime?: number;
    inputFeatures?: string[];
  };
}

export function createRiskAnalysis(
  event: NormalizedEvent,
  fromProfile: AddressProfile | null,
  toProfile: AddressProfile | null,
  options: RiskAnalysisOptions = {}
): RiskAnalysisResult {
  const now = Math.floor(Date.now() / 1000);

  // 根据画像类型确定基础风险分数
  let baseScore = 0.2; // 默认低风险
  const baseFactors: string[] = [];

  // 发送方画像分析
  if (fromProfile) {
    if (fromProfile.type === 'blacklist') {
      baseScore = Math.max(baseScore, 0.9);
      baseFactors.push('sender_blacklisted');
    } else if (fromProfile.type === 'new') {
      baseScore = Math.max(baseScore, 0.5);
      baseFactors.push('sender_new_account');
    }
  }

  // 接收方画像分析
  if (toProfile) {
    if (toProfile.type === 'blacklist') {
      baseScore = Math.max(baseScore, 0.8);
      baseFactors.push('receiver_blacklisted');
    } else if (toProfile.type === 'new') {
      baseScore = Math.max(baseScore, 0.4);
      baseFactors.push('receiver_new_account');
    }
  }

  // 交易金额分析
  if (event.value) {
    const value = BigInt(event.value);
    if (value > BigInt('1000000000000000000000')) {
      // > 1000 ETH
      baseScore = Math.max(baseScore, 0.7);
      baseFactors.push('large_transfer');
    }
  }

  // 合约调用分析
  if (event.methodName) {
    baseFactors.push('contract_interaction');
    if (event.methodName === 'transfer' || event.methodName === 'transferFrom') {
      baseFactors.push('token_transfer');
    }
  }

  const analysis: RiskAnalysisResult = {
    score: options.score ?? baseScore,
    factors: options.factors || baseFactors,
    details: options.details || generateRiskDetails(baseScore, baseFactors),
    confidence: options.confidence || 0.85,
    timestamp: options.timestamp || now,
    metadata: {
      modelVersion: options.metadata?.modelVersion || 'v1.0.0',
      executionTime: options.metadata?.executionTime || Math.random() * 100 + 50, // 50-150ms
      inputFeatures: options.metadata?.inputFeatures || [
        'transaction_value',
        'sender_profile',
        'receiver_profile',
        'method_signature',
        'gas_price',
      ],
    },
  };

  return analysis;
}

function generateRiskDetails(score: number, factors: string[]): string {
  const riskLevel =
    score >= 0.9 ? 'Critical' : score >= 0.7 ? 'High' : score >= 0.4 ? 'Medium' : 'Low';

  return (
    `Risk Level: ${riskLevel}\n` +
    `Risk Score: ${score.toFixed(2)}\n` +
    `Risk Factors:\n${factors.map((f) => `- ${formatFactor(f)}`).join('\n')}`
  );
}

function formatFactor(factor: string): string {
  return factor
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// AI分析结果生成器
export class RiskAnalysisGenerator {
  generateAnalyses(
    events: NormalizedEvent[],
    profileMap: Map<string, AddressProfile>
  ): RiskAnalysisResult[] {
    return events.map((event) => {
      const fromProfile = profileMap.get(event.from.toLowerCase()) || null;
      const toProfile = profileMap.get(event.to.toLowerCase()) || null;

      return createRiskAnalysis(event, fromProfile, toProfile);
    });
  }

  generateBatchAnalyses(
    count: number,
    baseScore: number,
    baseFactors: string[]
  ): RiskAnalysisResult[] {
    return Array.from({ length: count }, () => ({
      score: baseScore + (Math.random() * 0.2 - 0.1), // 在基础分数上下浮动0.1
      factors: [...baseFactors],
      details: 'Batch generated risk analysis',
      confidence: 0.85,
      timestamp: Math.floor(Date.now() / 1000),
      metadata: {
        modelVersion: 'v1.0.0',
        executionTime: Math.random() * 100 + 50,
        inputFeatures: ['batch_analysis'],
      },
    }));
  }
}
