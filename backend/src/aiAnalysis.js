export const RiskLevel = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' };
export const analyzeTransfer = jest.fn().mockImplementation((event, context) => {
  // 如果是黑名单地址，返回高风险
  if (context && context.blacklist) {
    return {
      riskLevel: RiskLevel.HIGH,
      score: 0.9,
      details: {
        blacklistScore: 1,
        contractScore: 0.7,
        behaviorScore: 0.8
      }
    };
  }
  
  return {
    riskLevel: RiskLevel.MEDIUM,
    score: 0.5,
    details: {
      blacklistScore: 0.3,
      contractScore: 0.6,
      behaviorScore: 0.7
    }
  };
});
