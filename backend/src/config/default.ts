import { z } from 'zod';
import { PipelineConfig } from '../pipeline/pipelineConfig';
import { RiskLevel } from '../types/events';

const ConfigSchema = z.object({
  app: z.object({
    name: z.string().default('ChainIntelAI'),
    version: z.string().default('1.0.0'),
    environment: z.string().default('development'),
  }),
  server: z.object({
    port: z.number().positive().default(3000),
    host: z.string().default('localhost'),
  }),
  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().positive().default(5432),
    username: z.string().default('postgres'),
    password: z.string().default('postgres'),
    database: z.string().default('chainintel'),
  }),
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().positive().default(6379),
    password: z.string().optional(),
    db: z.number().nonnegative().default(0),
  }),
  monitoring: z.object({
    prometheus: z.object({
      enabled: z.boolean().default(true),
      port: z.number().positive().default(9090),
    }),
    logging: z.object({
      level: z.string().default('info'),
      format: z.string().default('json'),
    }),
  }),
  riskAnalysis: z.object({
    thresholds: z.record(z.nativeEnum(RiskLevel), z.number().min(0).max(1)),
    minRiskLevel: z.nativeEnum(RiskLevel),
    maxRiskLevel: z.nativeEnum(RiskLevel),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export const defaultConfig: Config = {
  app: {
    name: process.env.APP_NAME || 'ChainIntelAI',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  server: {
    port: parseInt(process.env.SERVER_PORT || '3000', 10),
    host: process.env.SERVER_HOST || 'localhost',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'chainintel',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  monitoring: {
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED !== 'false',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
    },
  },
  riskAnalysis: {
    thresholds: {
      [RiskLevel.LOW]: 0.3,
      [RiskLevel.MEDIUM]: 0.5,
      [RiskLevel.HIGH]: 0.7,
      [RiskLevel.CRITICAL]: 0.9,
    },
    minRiskLevel: RiskLevel.HIGH,
    maxRiskLevel: RiskLevel.CRITICAL,
  },
};

export function validateConfig(config: Config): void {
  try {
    ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Invalid configuration:\n${errors}`);
    }
    throw error;
  }
}
