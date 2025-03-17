import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      LOG_LEVEL?: string;
      MONGODB_URI?: string;
      MONGODB_MAX_POOL_SIZE?: string;
      MONGODB_MIN_POOL_SIZE?: string;
      MONGODB_SERVER_SELECTION_TIMEOUT?: string;
      MONGODB_SOCKET_TIMEOUT?: string;
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;
      REDIS_DB?: string;
      ETH_RPC_URL?: string;
      ETH_WS_URL?: string;
      BSC_RPC_URL?: string;
      BSC_WS_URL?: string;
      SLACK_WEBHOOK_URL?: string;
      SLACK_CHANNEL?: string;
      TELEGRAM_BOT_TOKEN?: string;
      TELEGRAM_CHAT_ID?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_SECURE?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      EMAIL_FROM?: string;
      EMAIL_TO?: string;
    }
  }
}

export {}; 