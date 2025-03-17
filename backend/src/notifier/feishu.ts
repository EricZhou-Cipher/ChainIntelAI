import axios from 'axios';

export class FeishuClient {
  constructor(private webhook: string) {}

  async sendMessage(message: string): Promise<void> {
    try {
      const response = await axios.post(this.webhook, {
        msg_type: 'text',
        content: { text: message },
      });
      if (response.status !== 200) {
        throw new Error(`Feishu response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending Feishu message:', error);
      throw error;
    }
  }
}
