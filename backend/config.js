import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础配置
export const config = {
  // 区块链节点配置
  rpc: {
    ws: process.env.ETH_NODE_WSS || "ws://127.0.0.1:8545",
    http: process.env.ETH_NODE_HTTP || "http://127.0.0.1:8545",
  },

  // 合约配置
  contract: {
    address:
      process.env.CONTRACT_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: [
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address to, uint256 value) returns (bool)",
      "function approve(address spender, uint256 value) returns (bool)",
      "function transferFrom(address from, address to, uint256 value) returns (bool)",
    ],
  },

  // 数据库配置
  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/chainintel",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // 回放配置
  replay: {
    startBlock: parseInt(process.env.REPLAY_START_BLOCK || "0"),
    endBlock: process.env.REPLAY_END_BLOCK || "latest",
    batchSize: parseInt(process.env.REPLAY_BATCH_SIZE || "100"),
    maxRetries: parseInt(process.env.REPLAY_MAX_RETRIES || "3"),
    retryDelay: parseInt(process.env.REPLAY_RETRY_DELAY || "5000"),
  },

  // 通知配置
  notification: {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    },
    discord: {
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
    },
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: "json",
    dir: path.join(__dirname, "logs"),
    files: {
      combined: "combined.log",
      error: "error.log",
      replay: "replay.log",
    },
  },

  // AI分析配置
  ai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || "gpt-4",
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  },
};

// 导出默认配置
export default config;
