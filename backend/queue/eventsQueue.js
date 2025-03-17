import PQueue from "p-queue";
import { Counter, Gauge } from "prom-client";
import logger from "../config/logger.js";

// Prometheus指标
const queueSizeGauge = new Gauge({
  name: "event_queue_size",
  help: "当前队列中的事件数量",
});

const eventDuplicateCounter = new Counter({
  name: "event_duplicate_count",
  help: "被队列去重的事件数量",
});

class EventsQueue {
  constructor(options = {}) {
    this.queue = new PQueue({
      concurrency: options.concurrency || 10,
      timeout: options.timeout || 30000,
      throwOnTimeout: true,
    });

    // 用于去重的集合(使用Map以支持TTL)
    this.processedEvents = new Map();
    this.dedupeTimeout = options.dedupeTimeout || 3600000; // 1小时去重窗口

    // 监听队列大小变化
    this.queue.on("add", () => {
      queueSizeGauge.set(this.queue.size);
    });
    this.queue.on("completed", () => {
      queueSizeGauge.set(this.queue.size);
    });
  }

  // 生成事件唯一ID
  generateEventId(event) {
    return `${event.chainId}-${event.txHash}-${event.from}-${event.to}`;
  }

  // 检查事件是否重复
  isDuplicate(event) {
    const eventId = this.generateEventId(event);
    const now = Date.now();

    // 清理过期的去重记录
    for (const [id, timestamp] of this.processedEvents) {
      if (now - timestamp > this.dedupeTimeout) {
        this.processedEvents.delete(id);
      }
    }

    if (this.processedEvents.has(eventId)) {
      eventDuplicateCounter.inc();
      return true;
    }

    this.processedEvents.set(eventId, now);
    return false;
  }

  // 添加事件到队列
  async addEvent(event, processor) {
    if (this.isDuplicate(event)) {
      logger.info("事件重复,已跳过", {
        chainId: event.chainId,
        txHash: event.txHash,
      });
      return false;
    }

    try {
      await this.queue.add(async () => {
        await processor(event);
      });

      logger.debug("事件已加入队列", {
        chainId: event.chainId,
        txHash: event.txHash,
        queueSize: this.queue.size,
      });

      return true;
    } catch (error) {
      logger.error("添加事件到队列失败:", error);
      throw error;
    }
  }

  // 获取队列状态
  getStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
    };
  }

  // 暂停队列
  pause() {
    this.queue.pause();
    logger.info("事件队列已暂停");
  }

  // 恢复队列
  resume() {
    this.queue.start();
    logger.info("事件队列已恢复");
  }

  // 清空队列
  clear() {
    this.queue.clear();
    this.processedEvents.clear();
    queueSizeGauge.set(0);
    logger.info("事件队列已清空");
  }

  // 等待所有事件处理完成
  async waitForIdle() {
    await this.queue.onIdle();
  }
}

// 导出单例实例
export const eventsQueue = new EventsQueue();
