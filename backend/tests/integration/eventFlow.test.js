import { ethers } from "ethers";
import { getChainConfig } from "../../config/chains.js";
import { analyzeTransfer } from "../../aiAnalysis.js";
import { notify, NotificationChannel } from "../../notifier.js";
import { saveTransferEvent, getTransferEvent } from "../../db.js";

describe("Event Flow Integration Tests", () => {
  const mockTransferEvent = {
    chainId: 31337,
    from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    value: ethers.parseEther("150").toString(),
    amount: "150.0",
    txHash: "0x" + "1".repeat(64),
    blockNumber: 123456,
    timestamp: Date.now(),
    aiStatus: "pending",
  };

  const mockContext = {
    fromHistory: { totalTransactions: 1, uniqueAddresses: 1 },
    toHistory: { totalTransactions: 1, uniqueAddresses: 1 },
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

  test("完整事件处理流程", async () => {
    // 1. 保存事件
    await saveTransferEvent(mockTransferEvent);

    // 2. 验证事件已保存
    const savedEvent = await getTransferEvent(mockTransferEvent.txHash);
    expect(savedEvent).toBeDefined();
    expect(savedEvent.txHash).toBe(mockTransferEvent.txHash);

    // 3. 获取链配置
    const chainConfig = getChainConfig(mockTransferEvent.chainId);
    expect(chainConfig).toBeDefined();
    expect(chainConfig.chainId).toBe(mockTransferEvent.chainId);

    // 4. 执行风险分析
    const analysisResult = await analyzeTransfer(
      mockTransferEvent,
      mockContext
    );
    expect(analysisResult).toBeDefined();
    expect(analysisResult.riskLevel).toBeDefined();
    expect(analysisResult.score).toBeDefined();

    // 5. 发送通知
    await expect(
      notify(NotificationChannel.TELEGRAM, mockTransferEvent, analysisResult)
    ).resolves.not.toThrow();

    // 6. 更新事件状态
    mockTransferEvent.aiStatus = "done";
    await saveTransferEvent(mockTransferEvent);

    // 7. 验证最终状态
    const finalEvent = await getTransferEvent(mockTransferEvent.txHash);
    expect(finalEvent.aiStatus).toBe("done");
  });

  test("处理高风险事件", async () => {
    const highRiskContext = {
      ...mockContext,
      blacklist: [mockTransferEvent.from.toLowerCase()],
      behaviorData: {
        ...mockContext.behaviorData,
        hasRecentHighValueTransfers: true,
      },
    };

    // 执行风险分析
    const analysisResult = await analyzeTransfer(
      mockTransferEvent,
      highRiskContext
    );
    expect(analysisResult.riskLevel).toBe("HIGH");

    // 验证通知发送
    const notifyPromise = notify(
      NotificationChannel.TELEGRAM,
      mockTransferEvent,
      analysisResult
    );
    await expect(notifyPromise).resolves.not.toThrow();
  });

  test("处理无效事件", async () => {
    const invalidEvent = {
      ...mockTransferEvent,
      value: "invalid_value",
    };

    await expect(analyzeTransfer(invalidEvent, mockContext)).rejects.toThrow();
  });
});
