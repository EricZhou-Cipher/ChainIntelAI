import { jest } from "@jest/globals";
import { eventsQueue } from "../../queue/eventsQueue.js";
import { eventProcessor } from "../../queue/eventProcessor.js";
import { saveTransferEvent, updateTransferEvent } from "../../db.js";
import { analyzeTransfer } from "../../aiAnalysis.js";
import { notify } from "../../notifier.js";

// Mock外部依赖
jest.mock("../../db.js");
jest.mock("../../aiAnalysis.js");
jest.mock("../../notifier.js");

describe("Events Queue Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventsQueue.clear();
  });

  const mockEvent = {
    chainId: 1,
    txHash: "0x123",
    from: "0xabc",
    to: "0xdef",
    value: "1000000000000000000",
  };

  test("应该正确添加事件到队列", async () => {
    const mockProcessor = jest.fn();
    const result = await eventsQueue.addEvent(mockEvent, mockProcessor);

    expect(result).toBe(true);
    await eventsQueue.waitForIdle();
    expect(mockProcessor).toHaveBeenCalledWith(mockEvent);
  });

  test("应该正确处理重复事件", async () => {
    const mockProcessor = jest.fn();

    // 第一次添加
    await eventsQueue.addEvent(mockEvent, mockProcessor);

    // 第二次添加(重复)
    const result = await eventsQueue.addEvent(mockEvent, mockProcessor);
    expect(result).toBe(false);

    await eventsQueue.waitForIdle();
    expect(mockProcessor).toHaveBeenCalledTimes(1);
  });

  test("队列状态应该正确更新", async () => {
    const status = eventsQueue.getStatus();
    expect(status).toEqual({
      size: 0,
      pending: 0,
      isPaused: false,
    });
  });
});

describe("Event Processor Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEvent = {
    chainId: 1,
    txHash: "0x123",
    from: "0xabc",
    to: "0xdef",
    value: "1000000000000000000",
    status: "pending",
  };

  test("应该正确处理正常事件", async () => {
    // Mock返回
    saveTransferEvent.mockResolvedValue(true);
    updateTransferEvent.mockResolvedValue(true);
    analyzeTransfer.mockResolvedValue({
      riskLevel: "LOW",
      score: 0.2,
    });

    await eventProcessor.processEvent(mockEvent);

    expect(saveTransferEvent).toHaveBeenCalled();
    expect(analyzeTransfer).toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled(); // 低风险不触发通知
    expect(updateTransferEvent).toHaveBeenCalledWith(
      mockEvent.txHash,
      expect.objectContaining({
        status: "success",
      })
    );
  });

  test("应该正确处理高风险事件", async () => {
    // Mock返回高风险结果
    analyzeTransfer.mockResolvedValue({
      riskLevel: "HIGH",
      score: 0.8,
    });

    await eventProcessor.processEvent(mockEvent);

    expect(notify).toHaveBeenCalled();
  });

  test("应该正确处理AI分析失败", async () => {
    analyzeTransfer.mockRejectedValue(new Error("AI分析失败"));

    await expect(eventProcessor.processEvent(mockEvent)).rejects.toThrow(
      "AI分析失败"
    );

    expect(updateTransferEvent).toHaveBeenCalledWith(
      mockEvent.txHash,
      expect.objectContaining({
        status: "ai_failed",
      })
    );
  });

  test("应该正确处理重试逻辑", async () => {
    // 首次调用失败
    saveTransferEvent.mockRejectedValueOnce(new Error("存储失败"));

    await expect(eventProcessor.processEvent(mockEvent)).rejects.toThrow(
      "需要重试"
    );

    expect(updateTransferEvent).toHaveBeenCalledWith(
      mockEvent.txHash,
      expect.objectContaining({
        status: "pending",
        retryCount: 1,
      })
    );
  });

  test("超过重试次数应该标记失败", async () => {
    mockEvent.retryCount = 3; // 已达到最大重试次数
    saveTransferEvent.mockRejectedValue(new Error("存储失败"));

    await expect(eventProcessor.processEvent(mockEvent)).rejects.toThrow();

    expect(updateTransferEvent).toHaveBeenCalledWith(
      mockEvent.txHash,
      expect.objectContaining({
        status: "failed",
      })
    );
  });
});
