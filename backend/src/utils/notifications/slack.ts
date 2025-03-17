import { IncomingWebhook } from '@slack/webhook';

export class SlackWebhook {
  private webhook: IncomingWebhook;

  constructor(webhookUrl: string) {
    this.webhook = new IncomingWebhook(webhookUrl);
  }

  async send(message: { text: string; blocks?: any[] }): Promise<void> {
    try {
      await this.webhook.send(message);
    } catch (error) {
      console.error('Error sending message to Slack:', error);
      throw error;
    }
  }
} 