import { analyzeTransfer, RiskLevel } from "../../aiAnalysis.js";
import { ethers } from "ethers";

describe("AI Risk Analysis Tests", () => {
  const mockEvent = {
    chainId: 31337,
    from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    value: ethers.parseEther("150").toString(),
    amount: "150.0",
    txHash: "0x123...",
    blockNumber: 123456,
    timestamp: Date.now(),
  };

  const mockContext = {
    fromHistory: {
      totalTransactions: 1,
      uniqueAddresses: 1,
    },
    toHistory: {
      totalTransactions: 1,
      uniqueAddresses: 1,
    },
    blacklist: [],
    contractData: {
      isContract: false,
      hasComplexLogic: false,
      hasHighRiskFunctions: false,
      isVerified: true,
      hasAudit: true,
    },
    behaviorData: {
      isFirstTimeSender: true,
      isFirstTimeReceiver: true,
      hasRecentHighValueTransfers: false,
      hasMultipleContractsInvolved: false,
    },
  };

  test("应该正确分析高额转账风险", async () => {
    const result = await analyzeTransfer(mockEvent, mockContext);

    expect(result).toBeDefined();
    expect(result.riskLevel).toBeDefined();
    expect(Object.values(RiskLevel)).toContain(result.riskLevel);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  test("应该正确处理黑名单地址", async () => {
    const contextWithBlacklist = {
      ...mockContext,
      blacklist: [mockEvent.from.toLowerCase()],
    };

    const result = await analyzeTransfer(mockEvent, contextWithBlacklist);
    expect(result.riskLevel).toBe(RiskLevel.HIGH);
    expect(result.details.blacklistScore).toBe(1);
  });

  test("应该正确评估合约风险", async () => {
    const contextWithContract = {
      ...mockContext,
      contractData: {
        isContract: true,
        hasComplexLogic: true,
        hasHighRiskFunctions: true,
        isVerified: false,
        hasAudit: false,
      },
    };

    const result = await analyzeTransfer(mockEvent, contextWithContract);
    expect(result.details.contractScore).toBeGreaterThan(0.5);
  });

  test("应该正确评估行为模式风险", async () => {
    const contextWithRiskyBehavior = {
      ...mockContext,
      behaviorData: {
        isFirstTimeSender: true,
        isFirstTimeReceiver: true,
        hasRecentHighValueTransfers: true,
        hasMultipleContractsInvolved: true,
      },
    };

    const result = await analyzeTransfer(mockEvent, contextWithRiskyBehavior);
    expect(result.details.behaviorScore).toBeGreaterThan(0.5);
  });
});
