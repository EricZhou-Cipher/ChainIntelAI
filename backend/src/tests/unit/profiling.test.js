import { jest } from "@jest/globals";
import { ethers } from "ethers";
import { addressProfiler } from "../../profiling/addressProfiler.js";
import { profileUpdater } from "../../profiling/profileUpdater.js";
import { AddressProfile } from "../../profiling/profileSchema.js";

// Mock外部依赖
jest.mock("ethers");
jest.mock("../../profiling/profileSchema.js");

describe("Address Profiler Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAddress = "0x1234567890123456789012345678901234567890";
  const mockProvider = {
    getCode: jest.fn(),
    getTransaction: jest.fn(),
  };

  test("应该正确获取现有画像", async () => {
    const mockProfile = {
      address: mockAddress,
      type: "eoa",
      isExpired: false,
    };

    AddressProfile.findOne.mockResolvedValue(mockProfile);

    const profile = await addressProfiler.getProfile(mockAddress);

    expect(profile).toBeDefined();
    expect(profile.address).toBe(mockAddress);
    expect(AddressProfile.findOne).toHaveBeenCalled();
  });

  test("应该为新地址生成画像", async () => {
    // Mock: 地址不存在
    AddressProfile.findOne.mockResolvedValue(null);

    // Mock: 基础信息
    mockProvider.getCode.mockResolvedValue("0x");
    addressProfiler.provider = mockProvider;

    // Mock: 创建新画像
    const mockNewProfile = {
      address: mockAddress,
      type: "eoa",
      metadata: { updateCount: 1 },
    };
    AddressProfile.findOneAndUpdate.mockResolvedValue(mockNewProfile);

    const profile = await addressProfiler.getProfile(mockAddress);

    expect(profile).toBeDefined();
    expect(profile.address).toBe(mockAddress);
    expect(profile.type).toBe("eoa");
  });

  test("应该更新过期画像", async () => {
    const mockExpiredProfile = {
      address: mockAddress,
      isExpired: true,
    };

    AddressProfile.findOne.mockResolvedValue(mockExpiredProfile);

    const mockUpdatedProfile = {
      ...mockExpiredProfile,
      metadata: { updateCount: 2 },
    };
    AddressProfile.findOneAndUpdate.mockResolvedValue(mockUpdatedProfile);

    const profile = await addressProfiler.getProfile(mockAddress);

    expect(profile.metadata.updateCount).toBe(2);
  });

  test("应该正确处理无效地址", async () => {
    const invalidAddress = "0xinvalid";

    await expect(addressProfiler.getProfile(invalidAddress)).rejects.toThrow();
  });
});

describe("Profile Updater Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("应该找到需要更新的地址", async () => {
    const mockProfiles = [{ address: "0x111..." }, { address: "0x222..." }];

    AddressProfile.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockProfiles),
        }),
      }),
    });

    const addresses = await profileUpdater.findAddressesToUpdate();
    expect(addresses).toHaveLength(2);
  });

  test("应该正确执行批量更新", async () => {
    const mockAddresses = ["0x111...", "0x222..."];

    // Mock查找地址
    AddressProfile.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest
            .fn()
            .mockResolvedValue(
              mockAddresses.map((addr) => ({ address: addr }))
            ),
        }),
      }),
    });

    // Mock更新操作
    AddressProfile.findOneAndUpdate.mockImplementation((query, update) =>
      Promise.resolve({ address: query.address })
    );

    const results = await profileUpdater.runUpdate();
    expect(results).toBeDefined();
  });

  test("应该处理空结果", async () => {
    // Mock: 没有需要更新的地址
    AddressProfile.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const results = await profileUpdater.runUpdate();
    expect(results).toBeUndefined();
  });
});

describe("Risk Score Tests", () => {
  test("应该正确计算风险评分", async () => {
    const mockStats = {
      totalTxCount: 100,
      uniqueAddressCount: 50,
    };

    const mockFlows = {
      last24h: {
        inflow: "1000000000000000000",
        outflow: "500000000000000000",
      },
    };

    const mockRiskFeatures = {
      blacklistAssociation: 0.3,
      hasBatchOperations: true,
    };

    const score = addressProfiler.calculateRiskScore(
      mockStats,
      mockFlows,
      mockRiskFeatures
    );

    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(score.components).toBeDefined();
  });
});
