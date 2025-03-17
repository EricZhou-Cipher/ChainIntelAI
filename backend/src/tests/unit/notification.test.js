import { jest } from "@jest/globals";
import { notificationRouter } from "../../notifier/notificationRouter.js";
import { rateLimiter } from "../../notifier/rateLimiter.js";
import logger from "../../config/logger.js";

// Mock依赖
jest.mock("../../config/logger.js");

describe("Notification Router Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEvent = {
    chainId: 1,
    from: "0x1234...",
    to: "0x5678...",
    value: "1000000000000000000",
    txHash: "0xabcd...",
  };

  const mockProfile = {
    address: "0x1234...",
    riskScore: 75,
  };

  const mockRiskAnalysis = {
    score: 85,
    summary: "高风险转账",
  };

  test("应该正确路由高风险事件", async () => {
    await notificationRouter.route(mockEvent, mockProfile, mockRiskAnalysis);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("通知发送成功"),
      expect.any(Object)
    );
  });

  test("应该过滤低风险事件", async () => {
    const lowRiskAnalysis = {
      score: 20,
      summary: "低风险转账",
    };

    await notificationRouter.route(mockEvent, mockProfile, lowRiskAnalysis);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("没有匹配的接收人"),
      expect.any(Object)
    );
  });

  test("应该正确处理批量操作", async () => {
    const batchEvent = {
      ...mockEvent,
      batchOperation: true,
    };

    await notificationRouter.route(batchEvent, mockProfile, mockRiskAnalysis);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("批量操作已缓存"),
      expect.any(Object)
    );
  });

  test("应该触发紧急提醒", async () => {
    const emergencyEvent = {
      ...mockEvent,
      value: "1000000000000000000000", // 1000 ETH
    };

    await notificationRouter.route(
      emergencyEvent,
      mockProfile,
      mockRiskAnalysis
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("通知发送成功"),
      expect.objectContaining({
        isEmergency: true,
      })
    );
  });
});

describe("Rate Limiter Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("应该正确限制高频通知", () => {
    const receiver = "test_user";
    const channel = "telegram";
    const riskLevel = "HIGH";

    // 第一次应该允许
    expect(rateLimiter.canSendNotification(receiver, channel, riskLevel)).toBe(
      true
    );

    // 同一分钟内第二次应该被限制
    expect(rateLimiter.canSendNotification(receiver, channel, riskLevel)).toBe(
      false
    );
  });

  test("应该允许不同渠道的通知", () => {
    const receiver = "test_user";
    const riskLevel = "HIGH";

    // Telegram渠道
    expect(
      rateLimiter.canSendNotification(receiver, "telegram", riskLevel)
    ).toBe(true);

    // Discord渠道
    expect(
      rateLimiter.canSendNotification(receiver, "discord", riskLevel)
    ).toBe(true);
  });

  test("应该允许不同接收人的通知", () => {
    const channel = "telegram";
    const riskLevel = "HIGH";

    // 用户1
    expect(rateLimiter.canSendNotification("user1", channel, riskLevel)).toBe(
      true
    );

    // 用户2
    expect(rateLimiter.canSendNotification("user2", channel, riskLevel)).toBe(
      true
    );
  });

  test("应该正确清理过期记录", () => {
    const receiver = "test_user";
    const channel = "telegram";
    const riskLevel = "HIGH";

    // 添加一条记录
    rateLimiter.canSendNotification(receiver, channel, riskLevel);

    // 清理
    rateLimiter.cleanup();

    // 应该可以再次发送
    expect(rateLimiter.canSendNotification(receiver, channel, riskLevel)).toBe(
      true
    );
  });
});
