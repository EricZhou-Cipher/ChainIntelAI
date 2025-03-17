import { ethers } from "ethers";
import { analyzeTransfer } from "../../aiAnalysis.js";
import { saveTransferEvent } from "../../db.js";
import { notify, NotificationChannel } from "../../notifier.js";

describe("Event Replay Performance Tests", () => {
  const generateMockEvent = (index) => ({
    chainId: 31337,
    from: `0x${index.toString(16).padStart(40, "0")}`,
    to: `0x${(index + 1).toString(16).padStart(40, "0")}`,
    value: ethers.parseEther((Math.random() * 200).toFixed(2)).toString(),
    amount: (Math.random() * 200).toFixed(2),
    txHash: "0x" + index.toString(16).padStart(64, "0"),
    blockNumber: 1000000 + index,
    timestamp: Date.now() - Math.floor(Math.random() * 86400000),
    aiStatus: "pending",
  });

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

  test("批量事件处理性能", async () => {
    const batchSize = 100;
    const events = Array.from({ length: batchSize }, (_, i) =>
      generateMockEvent(i)
    );

    const startTime = Date.now();
    let processedCount = 0;
    let highRiskCount = 0;

    // 并行处理事件
    await Promise.all(
      events.map(async (event) => {
        try {
          // 保存事件
          await saveTransferEvent(event);

          // 风险分析
          const analysisResult = await analyzeTransfer(event, mockContext);

          if (analysisResult.riskLevel === "HIGH") {
            highRiskCount++;
            // 发送通知
            await notify(NotificationChannel.TELEGRAM, event, analysisResult);
          }

          processedCount++;
        } catch (error) {
          console.error(`处理事件失败: ${event.txHash}`, error);
        }
      })
    );

    const endTime = Date.now();
    const duration = endTime - startTime;
    const eventsPerSecond = (processedCount / duration) * 1000;

    console.log(`
性能测试结果:
• 总处理事件数: ${processedCount}
• 高风险事件数: ${highRiskCount}
• 处理总时间: ${duration}ms
• 平均处理速度: ${eventsPerSecond.toFixed(2)} 事件/秒
    `);

    expect(processedCount).toBe(batchSize);
    expect(duration).toBeLessThan(30000); // 期望30秒内完成
    expect(eventsPerSecond).toBeGreaterThan(1); // 期望每秒至少处理1个事件
  });

  test("连续事件处理性能", async () => {
    const eventCount = 50;
    const events = Array.from({ length: eventCount }, (_, i) =>
      generateMockEvent(i)
    );

    const startTime = Date.now();
    let processedCount = 0;

    // 串行处理事件
    for (const event of events) {
      try {
        await saveTransferEvent(event);
        const analysisResult = await analyzeTransfer(event, mockContext);
        processedCount++;
      } catch (error) {
        console.error(`处理事件失败: ${event.txHash}`, error);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const eventsPerSecond = (processedCount / duration) * 1000;

    console.log(`
连续处理性能:
• 总处理事件数: ${processedCount}
• 处理总时间: ${duration}ms
• 平均处理速度: ${eventsPerSecond.toFixed(2)} 事件/秒
    `);

    expect(processedCount).toBe(eventCount);
  });

  test("内存使用监控", async () => {
    const initialMemory = process.memoryUsage();
    const largeEventCount = 1000;
    const events = Array.from({ length: largeEventCount }, (_, i) =>
      generateMockEvent(i)
    );

    let processedCount = 0;
    for (const event of events) {
      if (processedCount % 100 === 0) {
        const currentMemory = process.memoryUsage();
        console.log(`
处理 ${processedCount} 个事件后的内存使用:
• 堆内存: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
• RSS: ${(currentMemory.rss / 1024 / 1024).toFixed(2)}MB
        `);
      }

      await saveTransferEvent(event);
      await analyzeTransfer(event, mockContext);
      processedCount++;
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    console.log(`
内存使用总结:
• 初始堆内存: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
• 最终堆内存: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
• 内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
    `);

    // 验证内存增长是否在合理范围内（小于500MB）
    expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024);
  });
});
