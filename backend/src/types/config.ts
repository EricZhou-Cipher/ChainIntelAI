export interface ProfilerConfig {
  cacheTTL: number; // 缓存过期时间（秒）
  fetchTimeout: number; // 查询超时时间（毫秒）
  fetchRetries: number; // 重试次数
  minRetryDelay: number; // 最小重试延迟（毫秒）
  maxRetryDelay: number; // 最大重试延迟（毫秒）
  batchSize: number; // 批量查询大小
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  timestampFormat: string;
}

export interface MonitorConfig {
  metricsPrefix: string; // 指标前缀
  buckets: number[]; // 直方图分桶
}

export interface PipelineConfig {
  profiler: ProfilerConfig;
  logger: LoggerConfig;
  monitor: MonitorConfig;
}
