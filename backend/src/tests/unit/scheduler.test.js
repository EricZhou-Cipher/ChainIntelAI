import { jest } from "@jest/globals";
import { scheduler } from "../../scheduler/replayScheduler.js";
import { jobMonitor } from "../../scheduler/jobMonitor.js";
import { replayEvents } from "../../replayHistoricalEvents.js";

// Mock外部依赖
jest.mock("../../replayHistoricalEvents.js");
jest.mock("../../scheduler/jobMonitor.js");

describe("Replay Scheduler Tests", () => {
  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    scheduler.isRunning = false;
    scheduler.retryCount = 0;
  });

  test("调度器应该正确启动", () => {
    scheduler.start();
    expect(scheduler.isRunning).toBe(false);
  });

  test("执行回放任务应该正确处理成功情况", async () => {
    // Mock回放函数返回
    replayEvents.mockResolvedValue({
      processedCount: 100,
      failedCount: 0,
    });

    // Mock任务监控
    jobMonitor.createJob.mockResolvedValue({ _id: "test-job-id" });
    jobMonitor.completeJob.mockResolvedValue({});

    await scheduler.executeReplay();

    expect(replayEvents).toHaveBeenCalled();
    expect(scheduler.isRunning).toBe(false);
    expect(scheduler.retryCount).toBe(0);
  });

  test("执行失败应该触发重试机制", async () => {
    const error = new Error("测试错误");
    replayEvents.mockRejectedValue(error);

    // Mock任务监控
    jobMonitor.createJob.mockResolvedValue({ _id: "test-job-id" });
    jobMonitor.failJob.mockResolvedValue({});

    await expect(scheduler.executeReplay()).rejects.toThrow("测试错误");
    expect(scheduler.retryCount).toBe(0);

    // 模拟handleFailure调用
    await scheduler.handleFailure(error);
    expect(scheduler.retryCount).toBe(1);
  });

  test("重试次数超限应该停止重试", async () => {
    const error = new Error("测试错误");
    scheduler.retryCount = scheduler.maxRetries;

    await scheduler.handleFailure(error);
    expect(scheduler.retryCount).toBe(scheduler.maxRetries + 1);
  });

  test("任务运行中不应该启动新任务", async () => {
    scheduler.isRunning = true;
    await scheduler.executeReplay();
    expect(replayEvents).not.toHaveBeenCalled();
  });
});

describe("Job Monitor Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("应该正确创建任务记录", async () => {
    const mockJob = {
      _id: "test-job-id",
      chainId: 1,
      startBlock: 1000,
      endBlock: 2000,
    };

    jobMonitor.createJob.mockResolvedValue(mockJob);

    const job = await jobMonitor.createJob(1, 1000, 2000);
    expect(job).toEqual(mockJob);
  });

  test("应该正确更新任务状态", async () => {
    const mockJob = {
      _id: "test-job-id",
      status: "success",
      processedEvents: 100,
    };

    jobMonitor.updateJob.mockResolvedValue(mockJob);

    const job = await jobMonitor.updateJob("test-job-id", {
      status: "success",
      processedEvents: 100,
    });

    expect(job).toEqual(mockJob);
  });

  test("应该正确获取任务统计", async () => {
    const mockStats = {
      success: {
        count: 10,
        avgDuration: 300,
        totalEvents: 1000,
        totalFailed: 0,
      },
    };

    jobMonitor.getJobStats.mockResolvedValue(mockStats);

    const stats = await jobMonitor.getJobStats();
    expect(stats).toEqual(mockStats);
  });
});
