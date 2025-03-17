import mongoose from "mongoose";
import logger from "../config/logger.js";

// 回放任务记录Schema
const ReplayJobSchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["running", "success", "failed"],
      default: "running",
    },
    chainId: { type: Number, required: true },
    startBlock: { type: Number, required: true },
    endBlock: { type: Number, required: true },
    processedEvents: { type: Number, default: 0 },
    failedEvents: { type: Number, default: 0 },
    duration: { type: Number }, // 秒
    error: { type: String },
    retryCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const ReplayJob = mongoose.model("ReplayJob", ReplayJobSchema);

class JobMonitor {
  // 创建新的任务记录
  async createJob(chainId, startBlock, endBlock) {
    try {
      const job = new ReplayJob({
        startTime: new Date(),
        chainId,
        startBlock,
        endBlock,
      });

      await job.save();
      logger.info("创建回放任务记录", {
        jobId: job._id,
        chainId,
        startBlock,
        endBlock,
      });

      return job;
    } catch (error) {
      logger.error("创建任务记录失败:", error);
      throw error;
    }
  }

  // 更新任务状态
  async updateJob(jobId, updates) {
    try {
      const job = await ReplayJob.findByIdAndUpdate(
        jobId,
        { ...updates },
        { new: true }
      );

      if (!job) {
        throw new Error(`任务 ${jobId} 不存在`);
      }

      logger.info("更新任务状态", {
        jobId,
        status: job.status,
        processedEvents: job.processedEvents,
      });

      return job;
    } catch (error) {
      logger.error("更新任务状态失败:", error);
      throw error;
    }
  }

  // 完成任务
  async completeJob(jobId, { processedEvents, failedEvents }) {
    const endTime = new Date();
    try {
      const job = await ReplayJob.findById(jobId);
      if (!job) {
        throw new Error(`任务 ${jobId} 不存在`);
      }

      const duration = (endTime - job.startTime) / 1000;

      const updates = {
        status: "success",
        endTime,
        duration,
        processedEvents,
        failedEvents,
      };

      return await this.updateJob(jobId, updates);
    } catch (error) {
      logger.error("完成任务更新失败:", error);
      throw error;
    }
  }

  // 标记任务失败
  async failJob(jobId, error) {
    const endTime = new Date();
    try {
      const job = await ReplayJob.findById(jobId);
      if (!job) {
        throw new Error(`任务 ${jobId} 不存在`);
      }

      const duration = (endTime - job.startTime) / 1000;

      const updates = {
        status: "failed",
        endTime,
        duration,
        error: error.message,
        retryCount: (job.retryCount || 0) + 1,
      };

      return await this.updateJob(jobId, updates);
    } catch (error) {
      logger.error("更新失败状态失败:", error);
      throw error;
    }
  }

  // 获取最近的任务记录
  async getRecentJobs(limit = 10) {
    try {
      return await ReplayJob.find().sort({ startTime: -1 }).limit(limit);
    } catch (error) {
      logger.error("获取最近任务记录失败:", error);
      throw error;
    }
  }

  // 获取任务统计信息
  async getJobStats() {
    try {
      const stats = await ReplayJob.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgDuration: { $avg: "$duration" },
            totalEvents: { $sum: "$processedEvents" },
            totalFailed: { $sum: "$failedEvents" },
          },
        },
      ]);

      return stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgDuration: stat.avgDuration,
          totalEvents: stat.totalEvents,
          totalFailed: stat.totalFailed,
        };
        return acc;
      }, {});
    } catch (error) {
      logger.error("获取任务统计失败:", error);
      throw error;
    }
  }
}

export const jobMonitor = new JobMonitor();
