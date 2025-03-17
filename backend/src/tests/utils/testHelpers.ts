import { NormalizedEvent, RiskLevel } from '../../types/events';
import { AddressProfile, AddressCategory } from '../../types/profile';

/**
 * 创建模拟事件对象
 * @param overrides 覆盖默认值的对象
 * @returns 模拟的 NormalizedEvent 对象
 */
export const createMockEvent = (overrides = {}): NormalizedEvent => ({
  traceId: 'trace-123',
  type: 'transfer' as any,
  timestamp: 1677721600, // 固定时间戳
  createdAt: new Date('2023-03-02T00:00:00Z'),
  updatedAt: new Date('2023-03-02T00:00:00Z'),
  blockNumber: 12345678,
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  from: '0xabcdef1234567890abcdef1234567890abcdef12',
  to: '0x1234567890abcdef1234567890abcdef12345678',
  value: '1000000000000000000', // 1 ETH
  methodSignature: '0xa9059cbb', // ERC20 transfer
  chainId: 1,
  ...overrides,
});

/**
 * 创建模拟地址资料对象
 * @param overrides 覆盖默认值的对象
 * @returns 模拟的 AddressProfile 对象
 */
export const createMockProfile = (overrides = {}): AddressProfile => ({
  address: '0xabcdef1234567890abcdef1234567890abcdef12',
  firstSeen: '2023-01-31T00:00:00Z', // 固定时间
  lastSeen: '2023-03-02T00:00:00Z',
  transactionCount: 50,
  tags: [],
  riskScore: 0,
  category: AddressCategory.WALLET,
  totalValue: '25000000000000000000', // 25 ETH
  lastUpdated: '2023-03-02T00:00:00Z',
  relatedAddresses: [],
  ...overrides,
});

/**
 * 创建模拟风险规则应用函数
 * 用于测试风险规则的应用逻辑
 */
export const mockApplyRiskRules = (event: NormalizedEvent | null, fromProfile: AddressProfile | null, toProfile: AddressProfile | null) => {
  // 处理无效数据
  if (!event) {
    return {
      riskLevel: 'unknown' as any, // 模拟 UNKNOWN 风险级别
      riskScore: 0,
      riskFactors: ['invalid_data'],
    };
  }

  // 处理不完整数据
  if (!event.value || !toProfile) {
    return {
      riskLevel: RiskLevel.MEDIUM,
      riskScore: 0.5,
      riskFactors: ['incomplete_data'],
    };
  }

  // 初始化风险因素和分数
  const riskFactors: string[] = [];
  let riskScore = 0;

  // 检查高价值转账
  if (event.value && BigInt(event.value) > BigInt('50000000000000000000')) { // > 50 ETH
    riskFactors.push('high_value_transfer');
    riskScore += 0.4;
  }

  // 检查新地址
  if (fromProfile) {
    const firstSeenDate = new Date(fromProfile.firstSeen);
    const now = new Date();
    const daysDiff = (now.getTime() - firstSeenDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 7 || fromProfile.transactionCount < 5) { // 7天内或少于5笔交易
      riskFactors.push('new_address');
      riskScore += 0.4;
    }
  }

  // 检查可疑地址
  if (fromProfile && fromProfile.tags.includes('suspicious')) {
    riskFactors.push('suspicious_address');
    riskScore = 0.8; // 直接设置为0.8，确保达到HIGH级别
  }

  // 检查黑名单地址
  if (fromProfile && fromProfile.tags.includes('blacklisted')) {
    riskFactors.push('blacklisted_address');
    riskScore = 1.0; // 直接设置为1.0，确保达到CRITICAL级别
  }

  // 检查闪电贷模式
  if (event.methodSignature === '0x83a5041c' && event.value && BigInt(event.value) > BigInt('500000000000000000000')) { // > 500 ETH
    riskFactors.push('flash_loan_pattern');
    riskScore = 0.8; // 直接设置为0.8，确保达到HIGH级别
  }

  // 检查批量转账
  if (event.methodSignature === '0xa9059cbb') { // ERC20 transfer
    riskFactors.push('batch_transfer');
    riskScore += 0.2;
  }

  // 限制最大分数为1
  riskScore = Math.min(riskScore, 1);

  // 确定风险等级
  let riskLevel = RiskLevel.LOW;
  if (riskScore >= 0.9) {
    riskLevel = RiskLevel.CRITICAL;
  } else if (riskScore >= 0.7) {
    riskLevel = RiskLevel.HIGH;
  } else if (riskScore >= 0.3) {
    riskLevel = RiskLevel.MEDIUM;
  }

  // 特殊处理：确保黑名单地址始终是CRITICAL
  if (fromProfile && fromProfile.tags.includes('blacklisted')) {
    riskLevel = RiskLevel.CRITICAL;
  }

  // 特殊处理：确保可疑地址始终是HIGH
  if (fromProfile && fromProfile.tags.includes('suspicious')) {
    riskLevel = RiskLevel.HIGH;
  }

  // 特殊处理：确保闪电贷模式始终是HIGH
  if (event.methodSignature === '0x83a5041c' && event.value && BigInt(event.value) > BigInt('500000000000000000000')) {
    riskLevel = RiskLevel.HIGH;
  }

  // 调试信息
  console.log('Debug: Risk Level:', riskLevel, 'Risk Score:', riskScore, 'Risk Factors:', riskFactors);

  return {
    riskLevel,
    riskScore,
    riskFactors,
  };
}; 