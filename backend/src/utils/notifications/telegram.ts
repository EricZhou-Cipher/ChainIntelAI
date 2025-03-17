import { Telegraf } from 'telegraf';

export class TelegramBot {
  private bot: Telegraf;
  private chatId: string;

  constructor(token: string, chatId: string) {
    this.bot = new Telegraf(token);
    this.chatId = chatId;
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
      throw error;
    }
  }
} 