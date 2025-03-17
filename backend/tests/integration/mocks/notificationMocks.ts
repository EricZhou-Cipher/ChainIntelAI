import { NormalizedEvent } from '../../../types/events';
import { RiskAnalysisResult } from './aiMocks';

export interface NotificationContent {
  channel: string;
  content: string;
  timestamp: number;
  metadata: {
    eventId: string;
    riskScore: number;
    riskLevel: string;
    traceId?: string;
  };
}

class NotificationStore {
  private notifications: NotificationContent[] = [];

  addNotification(notification: NotificationContent): void {
    this.notifications.push(notification);
  }

  getNotifications(): NotificationContent[] {
    return [...this.notifications];
  }

  getNotificationsByChannel(channel: string): NotificationContent[] {
    return this.notifications.filter((n) => n.channel === channel);
  }

  getNotificationsByRiskLevel(riskLevel: string): NotificationContent[] {
    return this.notifications.filter((n) => n.metadata.riskLevel === riskLevel);
  }

  clear(): void {
    this.notifications = [];
  }

  getStats(): {
    totalCount: number;
    channelCounts: Record<string, number>;
    riskLevelCounts: Record<string, number>;
  } {
    const channelCounts: Record<string, number> = {};
    const riskLevelCounts: Record<string, number> = {};

    this.notifications.forEach((notification) => {
      channelCounts[notification.channel] = (channelCounts[notification.channel] || 0) + 1;
      riskLevelCounts[notification.metadata.riskLevel] =
        (riskLevelCounts[notification.metadata.riskLevel] || 0) + 1;
    });

    return {
      totalCount: this.notifications.length,
      channelCounts,
      riskLevelCounts,
    };
  }
}

export const notificationStore = new NotificationStore();

export function mockSendNotification(
  channel: string,
  event: NormalizedEvent,
  analysis: RiskAnalysisResult,
  traceId?: string
): void {
  const riskLevel =
    analysis.score >= 0.9
      ? 'CRITICAL'
      : analysis.score >= 0.7
        ? 'HIGH'
        : analysis.score >= 0.4
          ? 'MEDIUM'
          : 'LOW';

  const content = formatNotificationContent(channel, event, analysis);

  notificationStore.addNotification({
    channel,
    content,
    timestamp: Math.floor(Date.now() / 1000),
    metadata: {
      eventId: event.transactionHash,
      riskScore: analysis.score,
      riskLevel,
      traceId,
    },
  });
}

export function getMockedNotifications(): NotificationContent[] {
  return notificationStore.getNotifications();
}

export function clearMockedNotifications(): void {
  notificationStore.clear();
}

export function getNotificationStats() {
  return notificationStore.getStats();
}

function formatNotificationContent(
  channel: string,
  event: NormalizedEvent,
  analysis: RiskAnalysisResult
): string {
  const riskLevel =
    analysis.score >= 0.9
      ? 'CRITICAL'
      : analysis.score >= 0.7
        ? 'HIGH'
        : analysis.score >= 0.4
          ? 'MEDIUM'
          : 'LOW';

  switch (channel) {
    case 'dingtalk':
      return formatDingTalkMessage(event, analysis, riskLevel);
    case 'feishu':
      return formatFeishuMessage(event, analysis, riskLevel);
    default:
      return formatDefaultMessage(event, analysis, riskLevel);
  }
}

function formatSlackMessage(
  event: NormalizedEvent,
  analysis: RiskAnalysisResult,
  riskLevel: string
): string {
  return (
    `*Risk Alert - ${riskLevel}*\n` +
    `Transaction: ${event.transactionHash}\n` +
    `From: ${event.from}\n` +
    `To: ${event.to}\n` +
    `Value: ${event.value}\n` +
    `Risk Score: ${analysis.score.toFixed(2)}\n` +
    `Risk Factors:\n${analysis.factors.map((f: string) => `• ${f}`).join('\n')}`
  );
}

function formatDingTalkMessage(
  event: NormalizedEvent,
  analysis: RiskAnalysisResult,
  riskLevel: string
): string {
  return (
    `## Risk Alert - ${riskLevel}\n` +
    `**Transaction**: ${event.transactionHash}\n` +
    `**From**: ${event.from}\n` +
    `**To**: ${event.to}\n` +
    `**Value**: ${event.value}\n` +
    `**Risk Score**: ${analysis.score.toFixed(2)}\n` +
    `**Risk Factors**:\n${analysis.factors.map((f: string) => `- ${f}`).join('\n')}`
  );
}

function formatFeishuMessage(
  event: NormalizedEvent,
  analysis: RiskAnalysisResult,
  riskLevel: string
): string {
  return JSON.stringify({
    title: `Risk Alert - ${riskLevel}`,
    content: [
      {
        tag: 'text',
        text:
          `Transaction: ${event.transactionHash}\n` +
          `From: ${event.from}\n` +
          `To: ${event.to}\n` +
          `Value: ${event.value}\n` +
          `Risk Score: ${analysis.score.toFixed(2)}\n` +
          `Risk Factors:\n${analysis.factors.join('\n')}`,
      },
    ],
  });
}

function formatDefaultMessage(
  event: NormalizedEvent,
  analysis: RiskAnalysisResult,
  riskLevel: string
): string {
  return (
    `Risk Alert - ${riskLevel}\n` +
    `Transaction: ${event.transactionHash}\n` +
    `From: ${event.from}\n` +
    `To: ${event.to}\n` +
    `Value: ${event.value}\n` +
    `Risk Score: ${analysis.score}\n` +
    `Risk Factors: ${analysis.factors.join(', ')}`
  );
}
