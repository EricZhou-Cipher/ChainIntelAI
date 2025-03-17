/**
 * @file 配置
 * @description 定义应用程序配置接口
 */

import { ILogger } from '../utils/logger';
import { defaultConfig } from './default';
import { developmentConfig } from './development';
import { productionConfig } from './production';
import { PipelineConfig } from '../pipeline/pipelineConfig';
import { RiskLevel } from '../types/events';

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  server: {
    port: number;
    host: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  monitoring: {
    prometheus: {
      enabled: boolean;
      port: number;
    };
    logging: {
      level: string;
      format: string;
    };
  };
  riskAnalysis: {
    thresholds: Record<RiskLevel, number>;
    minRiskLevel: RiskLevel;
    maxRiskLevel: RiskLevel;
  };
}

export type Config = AppConfig;

export const config: Config = {
  ...defaultConfig,
  ...(process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig),
  riskAnalysis: {
    ...defaultConfig.riskAnalysis,
    thresholds: {
      [RiskLevel.LOW]: 0.3,
      [RiskLevel.MEDIUM]: 0.5,
      [RiskLevel.HIGH]: 0.7,
      [RiskLevel.CRITICAL]: 0.9,
    } as Record<RiskLevel, number>,
  },
};

export async function loadConfig(logger: ILogger): Promise<Config> {
  try {
    logger.info('Loading configuration...');
    return config;
  } catch (error) {
    logger.error('Failed to load configuration', { error });
    throw error;
  }
}
