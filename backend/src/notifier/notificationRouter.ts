import { RiskAnalysis } from '../types/events';
import { NormalizedEvent } from '../types/events';
import { logger } from '../utils/logger';

export interface NotificationParams {
  event: NormalizedEvent;
  riskAnalysis: RiskAnalysis;
  channels: string[];
  traceId: string;
}

export class NotificationRouter {
  async route(params: NotificationParams): Promise<void> {
    const { event, riskAnalysis, channels, traceId } = params;

    try {
      // 检查是否为批量操作
      if (event.metadata?.batchOperation) {
        logger.info('批量操作已缓存', { traceId, channels });
        return;
      }

      // 检查事件类型是否有对应的通知模板
      if (event.methodName === 'unknown_method') {
        logger.warn('未找到事件类型的通知模板', {
          traceId,
          eventType: event.type,
          methodName: event.methodName,
        });
        return;
      }

      // 检查是否为紧急通知（大额转账）
      const isEmergency = event.value && BigInt(event.value) > BigInt('100000000000000000000'); // > 100 ETH

      // 检查风险等级，低风险事件可能没有接收人
      if (riskAnalysis.score < 0.3) {
        logger.info('没有匹配的接收人', {
          traceId,
          riskScore: riskAnalysis.score,
          riskLevel: riskAnalysis.level,
        });
        return;
      }

      // 发送通知
      await this._sendNotification(event, riskAnalysis, channels);

      logger.info('通知发送成功', {
        traceId,
        channels,
        isEmergency,
        riskScore: riskAnalysis.score,
        riskLevel: riskAnalysis.level,
      });
    } catch (error) {
      logger.error('通知发送失败', {
        traceId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async _sendNotification(
    event: NormalizedEvent,
    riskAnalysis: RiskAnalysis,
    channels: string[]
  ): Promise<void> {
    // 实际发送通知的逻辑
    return Promise.resolve();
  }

  static async send(
    event: NormalizedEvent,
    riskAnalysis: RiskAnalysis,
    channels: string[]
  ): Promise<void> {
    // TODO: 实现通知发送逻辑
    console.log('Sending notification:', { event, riskAnalysis, channels });
  }
}
