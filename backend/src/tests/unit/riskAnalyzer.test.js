import { jest } from "@jest/globals";
import { ethers } from "ethers";
import { riskAnalyzer } from "../../analyzer/riskAnalyzer.js";
import logger from "../../config/logger.js";

// Mock依赖
jest.mock("../../config/logger.js");

describe("Risk Analyzer Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEvent = {
    chainId: 1,
    from: "0x1234...",
    to: "0x5678...",
    value: ethers.utils.parseEther("150").toString(), // 150 ETH
    txHash: "0xabcd...",
  };

  const mockProfile = {
    address: "0x1234...",
    firstSeen: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30天前
    stats: {
      totalTxCount: 15,
      uniqueAddressCount: 8,
    },
    riskFeatures: {
      blacklistAssociation: {
        score: 0.4,
        relatedAddresses: ["0xdead..."],
      },
    },
  };

  const mockHistoricalEvents = [
    {
      chainId: 1,
      from: "0x1234...",
      to: "0x9999...",
      value: ethers.utils.parseEther("10").toString(),
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
    },
  ];

  test("应该正确分析高风险事件", async () => {
    const report = await riskAnalyzer.analyze(
      mockEvent,
      mockProfile,
      mockHistoricalEvents
    );

    expect(report.riskScore).toBeGreaterThanOrEqual(80);
    expect(report.riskLevel).toBe("HIGH");
    expect(report.riskPoints.length).toBeGreaterThan(0);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("风险分析完成"),
      expect.any(Object)
    );
  });

  test("应该识别大额转账风险", async () => {
    const largeTransferEvent = {
      ...mockEvent,
      value: ethers.utils.parseEther("1000").toString(), // 1000 ETH
    };

    const report = await riskAnalyzer.analyze(
      largeTransferEvent,
      mockProfile,
      mockHistoricalEvents
    );

    const hasLargeTransferRisk = report.riskPoints.some(
      (point) => point.type === "LARGE_TRANSFER"
    );
    expect(hasLargeTransferRisk).toBe(true);
  });

  test("应该识别频繁转账风险", async () => {
    const activeProfile = {
      ...mockProfile,
      stats: {
        totalTxCount: 50, // 频繁交易
        uniqueAddressCount: 20,
      },
    };

    const report = await riskAnalyzer.analyze(
      mockEvent,
      activeProfile,
      mockHistoricalEvents
    );

    const hasFrequentTransferRisk = report.riskPoints.some(
      (point) => point.type === "FREQUENT_TRANSFER"
    );
    expect(hasFrequentTransferRisk).toBe(true);
  });

  test("应该识别黑名单关联风险", async () => {
    const blacklistProfile = {
      ...mockProfile,
      riskFeatures: {
        blacklistAssociation: {
          score: 0.8, // 高度关联
          relatedAddresses: ["0xdead...", "0xbeef..."],
        },
      },
    };

    const report = await riskAnalyzer.analyze(
      mockEvent,
      blacklistProfile,
      mockHistoricalEvents
    );

    const hasBlacklistRisk = report.riskPoints.some(
      (point) => point.type === "BLACKLIST"
    );
    expect(hasBlacklistRisk).toBe(true);
  });

  test("应该识别新账户风险", async () => {
    const newProfile = {
      ...mockProfile,
      firstSeen: Date.now() - 60 * 60 * 1000, // 1小时前
    };

    const report = await riskAnalyzer.analyze(
      mockEvent,
      newProfile,
      mockHistoricalEvents
    );

    const hasNewAccountRisk = report.riskPoints.some(
      (point) => point.type === "NEW_ACCOUNT"
    );
    expect(hasNewAccountRisk).toBe(true);
  });

  test("应该识别组合风险规则", async () => {
    const riskyEvent = {
      ...mockEvent,
      batchOperation: [1, 2, 3], // 批量操作
      method: "transfer", // 合约交互
    };

    const riskyProfile = {
      ...mockProfile,
      riskFeatures: {
        blacklistAssociation: {
          score: 0.9,
          relatedAddresses: ["0xdead..."],
        },
      },
    };

    const report = await riskAnalyzer.analyze(
      riskyEvent,
      riskyProfile,
      mockHistoricalEvents
    );

    expect(report.combinations.length).toBeGreaterThan(0);
    expect(report.riskScore).toBeGreaterThan(80); // 组合规则权重提升
  });

  test("应该包含AI分析结果", async () => {
    const report = await riskAnalyzer.analyze(
      mockEvent,
      mockProfile,
      mockHistoricalEvents
    );

    expect(report.aiAnalysis).toBeDefined();
    expect(report.aiAnalysis.behaviorAnalysis).toBeDefined();
    expect(report.aiAnalysis.graphAnalysis).toBeDefined();
    expect(report.aiAnalysis.summary).toBeDefined();
  });

  test("应该正确处理分析失败", async () => {
    const invalidEvent = {
      chainId: 1,
      from: "invalid_address",
      value: "not_a_number",
    };

    await expect(
      riskAnalyzer.analyze(invalidEvent, mockProfile, [])
    ).rejects.toThrow();

    expect(logger.error).toHaveBeenCalled();
  });
});
