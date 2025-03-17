import { Counter, Histogram } from "prom-client";
import logger from "../config/logger.js";
import { saveTransferEvent, updateTransferEvent } from "../db.js";
import { analyzeTransfer } from "../aiAnalysis.js";
import { notify, NotificationChannel } from "../notifier.js";

// Prometheus指标
const processSuccessCounter = new Counter({
  name: "event_process_success_count",
  help: "处理成功的事件数量",
});

const processFailureCounter = new Counter({
  name: "event_process_failure_count",
  help: "处理失败的事件数量",
  labelNames: ["error_type"],
});

const processDurationHistogram = new Histogram({
  name: "event_process_duration_seconds",
  help: "事件处理耗时(秒)",
  buckets: [1, 5, 15, 30, 60],
});

class EventProcessor {
  constructor() {
    this.maxRetries = 3;
  }

  // 处理单个事件
  async processEvent(event) {
    const startTime = Date.now();
    const retryCount = event.retryCount || 0;

    try {
      // 1. 更新事件状态为处理中
      event.status = "processing";
      await this.updateEventStatus(event);

      // 2. 存储事件
      await this.storeEvent(event);

      // 3. AI分析
      const analysisResult = await this.analyzeEvent(event);

      // 4. 发送通知(如果是高风险)
      if (analysisResult.riskLevel === "HIGH") {
        await this.sendNotification(event, analysisResult);
      }

      // 5. 更新处理成功状态
      event.status = "success";
      event.aiResult = analysisResult;
      await this.updateEventStatus(event);

      // 记录成功指标
      processSuccessCounter.inc();

      logger.info("事件处理成功", {
        chainId: event.chainId,
        txHash: event.txHash,
        riskLevel: analysisResult.riskLevel,
      });
    } catch (error) {
      // 处理失败逻辑
      await this.handleProcessingError(event, error, retryCount);
    } finally {
      // 记录处理耗时
      const duration = (Date.now() - startTime) / 1000;
      processDurationHistogram.observe(duration);
    }
  }

  // 存储事件
  async storeEvent(event) {
    try {
      await saveTransferEvent(event);
      logger.debug("事件已存储", {
        chainId: event.chainId,
        txHash: event.txHash,
      });
    } catch (error) {
      logger.error("存储事件失败:", error);
      processFailureCounter.inc({ error_type: "storage" });
      throw error;
    }
  }

  // AI分析事件
  async analyzeEvent(event) {
    try {
      const result = await analyzeTransfer(event);
      logger.debug("事件分析完成", {
        chainId: event.chainId,
        txHash: event.txHash,
        riskLevel: result.riskLevel,
      });
      return result;
    } catch (error) {
      logger.error("AI分析失败:", error);
      processFailureCounter.inc({ error_type: "analysis" });

      // AI分析失败不重试,直接标记状态
      event.status = "ai_failed";
      await this.updateEventStatus(event);

      throw error;
    }
  }

  // 发送通知
  async sendNotification(event, analysisResult) {
    try {
      await notify(NotificationChannel.TELEGRAM, event, analysisResult);
      logger.info("高风险事件通知已发送", {
        chainId: event.chainId,
        txHash: event.txHash,
      });
    } catch (error) {
      logger.error("发送通知失败:", error);
      processFailureCounter.inc({ error_type: "notification" });
      throw error;
    }
  }

  // 更新事件状态
  async updateEventStatus(event) {
    try {
      await updateTransferEvent(event.txHash, {
        status: event.status,
        aiResult: event.aiResult,
        retryCount: event.retryCount,
      });
    } catch (error) {
      logger.error("更新事件状态失败:", error);
      throw error;
    }
  }

  // 处理错误
  async handleProcessingError(event, error, retryCount) {
    processFailureCounter.inc({ error_type: "general" });

    // 如果是AI分析失败,不进行重试
    if (event.status === "ai_failed") {
      logger.warn("AI分析失败,不进行重试", {
        chainId: event.chainId,
        txHash: event.txHash,
        error: error.message,
      });
      return;
    }

    // 检查重试次数
    if (retryCount < this.maxRetries) {
      event.status = "pending";
      event.retryCount = retryCount + 1;
      await this.updateEventStatus(event);

      logger.warn(`事件处理失败,将进行第${event.retryCount}次重试`, {
        chainId: event.chainId,
        txHash: event.txHash,
        error: error.message,
      });

      // 重新加入队列
      throw new Error("需要重试");
    } else {
      // 超过重试次数,标记为失败
      event.status = "failed";
      await this.updateEventStatus(event);

      logger.error("事件处理失败且超过重试次数上限", {
        chainId: event.chainId,
        txHash: event.txHash,
        error: error.message,
        retryCount,
      });
    }
  }
}

export const eventProcessor = new EventProcessor();
