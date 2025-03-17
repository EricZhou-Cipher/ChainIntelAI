import { formatDistanceToNow } from "date-fns";
import { zh } from "date-fns/locale";

// 通知渠道类型
export const NotificationChannel = {
  TELEGRAM: "telegram",
  DISCORD: "discord",
  EMAIL: "email",
  SLACK: "slack",
};

// 风险等级对应的emoji
const RISK_EMOJIS = {
  HIGH: "🔴",
  MEDIUM: "🟡",
  LOW: "🟢",
};

// 通知模板
function formatEventMessage(event, analysisResult) {
  const riskEmoji = RISK_EMOJIS[analysisResult.riskLevel] || "⚪️";
  const timeAgo = formatDistanceToNow(new Date(event.timestamp), {
    locale: zh,
    addSuffix: true,
  });

  return `${riskEmoji} 风险等级: ${analysisResult.riskLevel}
  
📊 交易详情:
• 金额: ${event.amount} ETH
• 发送方: ${event.from}
• 接收方: ${event.to}
• 交易哈希: ${event.txHash}
• 区块: ${event.blockNumber}
• 时间: ${timeAgo}

🔍 风险分析:
• 总分: ${(analysisResult.score * 100).toFixed(2)}%
• 金额风险: ${(analysisResult.details.amountScore * 100).toFixed(2)}%
• 地址历史: ${(analysisResult.details.historyScore * 100).toFixed(2)}%
• 行为模式: ${(analysisResult.details.behaviorScore * 100).toFixed(2)}%
• 合约风险: ${(analysisResult.details.contractScore * 100).toFixed(2)}%

🔗 链接:
• Etherscan: https://etherscan.io/tx/${event.txHash}`;
}

// Telegram通知实现
export async function sendTelegramAlert(event, analysisResult) {
  try {
    const message = formatEventMessage(event, analysisResult);
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      });
      if (!response.ok)
        throw new Error(`Telegram API error: ${response.statusText}`);
    } else {
      console.log("Telegram通知(测试模式):", message);
    }
  } catch (error) {
    console.error("Telegram通知发送失败:", error);
  }
}

// Discord通知实现
export async function sendDiscordAlert(event, analysisResult) {
  try {
    const message = formatEventMessage(event, analysisResult);
    if (process.env.DISCORD_WEBHOOK_URL) {
      const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
          username: "ChainIntel AI",
          avatar_url: "https://example.com/bot-avatar.png",
        }),
      });
      if (!response.ok)
        throw new Error(`Discord API error: ${response.statusText}`);
    } else {
      console.log("Discord通知(测试模式):", message);
    }
  } catch (error) {
    console.error("Discord通知发送失败:", error);
  }
}

// 通用通知接口，支持扩展
export async function notify(channel, event, analysisResult) {
  switch (channel) {
    case NotificationChannel.TELEGRAM:
      await sendTelegramAlert(event, analysisResult);
      break;
    case NotificationChannel.DISCORD:
      await sendDiscordAlert(event, analysisResult);
      break;
    case NotificationChannel.EMAIL:
      // 预留邮件通知接口
      console.log("邮件通知功能待实现");
      break;
    case NotificationChannel.SLACK:
      // 预留Slack通知接口
      console.log("Slack通知功能待实现");
      break;
    default:
      console.warn(`未知的通知渠道: ${channel}`);
  }
}
