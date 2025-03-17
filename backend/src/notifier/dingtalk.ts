import axios from 'axios';

export class DingTalkClient {
  constructor(private webhook: string) {}

  async sendMessage(message: string): Promise<void> {
    try {
      const response = await axios.post(this.webhook, {
        msgtype: 'text',
        text: { content: message },
      });
      if (response.status !== 200) {
        throw new Error(`DingTalk response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending DingTalk message:', error);
      throw error;
    }
  }
}
