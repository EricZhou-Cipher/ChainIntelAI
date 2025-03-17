import { PipelineConfig } from '../types/config';
import { z } from 'zod';
import { Logger } from '../utils/logger';
import { RiskLevel } from '../types/events';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const defaultConfig: PipelineConfig = {
  profiler: {
    cacheTTL: Number(process.env.PROFILE_CACHE_TTL) || 3600,
    fetchTimeout: Number(process.env.PROFILE_FETCH_TIMEOUT) || 15000,
    fetchRetries: Number(process.env.PROFILE_FETCH_RETRIES) || 3,
    minRetryDelay: Number(process.env.PROFILE_MIN_RETRY_DELAY) || 1000,
    maxRetryDelay: Number(process.env.PROFILE_MAX_RETRY_DELAY) || 5000,
    batchSize: Number(process.env.PROFILE_BATCH_SIZE) || 100,
  },
  monitor: {
    metricsPrefix: 'chainintel_',
    buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 15],
  },
  logger: {
    level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    format: (process.env.LOG_FORMAT || 'json') as 'json' | 'text',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  },
};

export default defaultConfig;
