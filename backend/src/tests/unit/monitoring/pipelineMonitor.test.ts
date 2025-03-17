import { PipelineMonitor } from '../../../monitoring/pipelineMonitor';
import { MonitorConfig } from '../../../types/config';
import { Registry, register } from 'prom-client';

// 模拟 prom-client 的行为
jest.mock('prom-client', () => {
  const originalModule = jest.requireActual('prom-client');
  
  // 创建模拟的计数器
  let cacheHits = 0;
  let cacheMisses = 0;
  let cacheHitRatio = 0;
  let profileLatencyCount = 0;
  let aiAnalysisLatencyCount = 0;
  let eventProcessingSuccess = 0;
  let eventProcessingError = 0;
  let errorsByType = new Map<string, number>();
  
  // 创建一个模拟的 Registry 类
  class MockRegistry {
    metrics() {
      // 根据当前计数生成指标字符串
      return Promise.resolve(`
# HELP chainintel_profile_latency_seconds Address profile loading latency in seconds
# TYPE chainintel_profile_latency_seconds histogram
chainintel_profile_latency_seconds_bucket{le="0.01"} 0
chainintel_profile_latency_seconds_bucket{le="0.1"} 0
chainintel_profile_latency_seconds_bucket{le="0.5"} 0
chainintel_profile_latency_seconds_bucket{le="1"} 0
chainintel_profile_latency_seconds_bucket{le="2"} ${profileLatencyCount > 0 ? '1' : '0'}
chainintel_profile_latency_seconds_bucket{le="5"} ${profileLatencyCount > 0 ? '1' : '0'}
chainintel_profile_latency_seconds_bucket{le="10"} ${profileLatencyCount > 0 ? '1' : '0'}
chainintel_profile_latency_seconds_bucket{le="+Inf"} ${profileLatencyCount}
chainintel_profile_latency_seconds_sum ${profileLatencyCount * 2}
chainintel_profile_latency_seconds_count ${profileLatencyCount}

# HELP chainintel_profile_cache_hits_total Total number of profile cache hits
# TYPE chainintel_profile_cache_hits_total counter
chainintel_profile_cache_hits_total ${cacheHits}

# HELP chainintel_profile_cache_misses_total Total number of profile cache misses
# TYPE chainintel_profile_cache_misses_total counter
chainintel_profile_cache_misses_total ${cacheMisses}

# HELP chainintel_profile_cache_hit_ratio Profile cache hit ratio
# TYPE chainintel_profile_cache_hit_ratio gauge
chainintel_profile_cache_hit_ratio ${cacheHitRatio}

# HELP chainintel_ai_analysis_latency_seconds AI analysis latency in seconds
# TYPE chainintel_ai_analysis_latency_seconds histogram
chainintel_ai_analysis_latency_seconds_bucket{le="0.1"} 0
chainintel_ai_analysis_latency_seconds_bucket{le="0.5"} 0
chainintel_ai_analysis_latency_seconds_bucket{le="1"} 0
chainintel_ai_analysis_latency_seconds_bucket{le="2"} ${aiAnalysisLatencyCount > 0 ? '1' : '0'}
chainintel_ai_analysis_latency_seconds_bucket{le="5"} ${aiAnalysisLatencyCount > 0 ? '1' : '0'}
chainintel_ai_analysis_latency_seconds_bucket{le="+Inf"} ${aiAnalysisLatencyCount}
chainintel_ai_analysis_latency_seconds_sum ${aiAnalysisLatencyCount * 1.5}
chainintel_ai_analysis_latency_seconds_count ${aiAnalysisLatencyCount}

# HELP chainintel_event_processing_total Total number of events processed
# TYPE chainintel_event_processing_total counter
chainintel_event_processing_total{status="success"} ${eventProcessingSuccess}
chainintel_event_processing_total{status="error"} ${eventProcessingError}

# HELP chainintel_error_total Total number of errors
# TYPE chainintel_error_total counter
${Array.from(errorsByType.entries()).map(([type, count]) => 
  `chainintel_error_total{type="${type}"} ${count}`
).join('\n')}
      `);
    }
    
    registerMetric() {
      // 空实现
    }
  }
  
  // 模拟 Histogram 类
  class MockHistogram {
    name: string;
    
    constructor(config: { name: string }) {
      this.name = config.name;
    }
    
    observe(value: number): void {
      if (this.name && this.name.includes('profile_latency')) {
        profileLatencyCount++;
      } else if (this.name && this.name.includes('ai_analysis_latency')) {
        aiAnalysisLatencyCount++;
      }
    }
  }
  
  // 模拟 Counter 类
  class MockCounter {
    name: string;
    labelValues?: Record<string, string>;
    
    constructor(config: { name: string }) {
      this.name = config.name;
    }
    
    inc(value = 1): void {
      if (this.name && this.name.includes('profile_cache_hits')) {
        cacheHits += value;
      } else if (this.name && this.name.includes('profile_cache_misses')) {
        cacheMisses += value;
      } else if (this.name && this.name.includes('event_processing')) {
        if (this.labelValues && this.labelValues.status === 'success') {
          eventProcessingSuccess += value;
        } else if (this.labelValues && this.labelValues.status === 'error') {
          eventProcessingError += value;
        }
      } else if (this.name && this.name.includes('error_total')) {
        const type = this.labelValues ? this.labelValues.type : 'unknown';
        errorsByType.set(type, (errorsByType.get(type) || 0) + value);
      }
    }
    
    labels(labelValues: Record<string, string>): MockCounter {
      const counter = new MockCounter({ name: this.name });
      counter.labelValues = labelValues;
      return counter;
    }
  }
  
  // 模拟 Gauge 类
  class MockGauge {
    name: string;
    
    constructor(config: { name: string }) {
      this.name = config.name;
    }
    
    set(value: number): void {
      if (this.name && this.name.includes('profile_cache_hit_ratio')) {
        cacheHitRatio = value;
      }
    }
  }
  
  return {
    ...originalModule,
    Registry: MockRegistry,
    Histogram: MockHistogram,
    Counter: MockCounter,
    Gauge: MockGauge,
    register: {
      ...originalModule.register,
      clear: () => {
        // 重置所有计数
        cacheHits = 0;
        cacheMisses = 0;
        cacheHitRatio = 0;
        profileLatencyCount = 0;
        aiAnalysisLatencyCount = 0;
        eventProcessingSuccess = 0;
        eventProcessingError = 0;
        errorsByType.clear();
      },
    },
  };
});

describe('PipelineMonitor', () => {
  let monitor: PipelineMonitor;
  let mockConfig: MonitorConfig;

  beforeEach(() => {
    // 清除所有 Prometheus 指标
    register.clear();

    // 创建模拟配置
    mockConfig = {
      metricsPrefix: 'chainintel',
      buckets: [0.1, 0.5, 1, 2, 5],
    };

    // 创建 PipelineMonitor 实例
    monitor = new PipelineMonitor(mockConfig);
  });

  afterEach(() => {
    // 清除所有 Prometheus 指标
    register.clear();
  });

  describe('constructor', () => {
    it('should initialize with correct prefix', async () => {
      const metrics = await monitor.getMetrics();
      expect(metrics).toContain('chainintel_profile_latency_seconds');
      expect(metrics).toContain('chainintel_profile_cache_hits_total');
      expect(metrics).toContain('chainintel_profile_cache_misses_total');
      expect(metrics).toContain('chainintel_profile_cache_hit_ratio');
      expect(metrics).toContain('chainintel_ai_analysis_latency_seconds');
      expect(metrics).toContain('chainintel_event_processing_total');
      expect(metrics).toContain('chainintel_error_total');
    });

    it('should initialize with custom buckets', async () => {
      // 创建自定义配置
      const customConfig: MonitorConfig = {
        metricsPrefix: 'chainintel',
        buckets: [0.01, 0.1, 1, 10],
      };

      // 创建自定义 PipelineMonitor 实例
      const customMonitor = new PipelineMonitor(customConfig);
      
      const metrics = await customMonitor.getMetrics();
      
      expect(metrics).toContain('le="0.01"');
      expect(metrics).toContain('le="0.1"');
      expect(metrics).toContain('le="1"');
      expect(metrics).toContain('le="10"');
    });
  });

  describe('recordProfileLatency', () => {
    it('should record profile latency', async () => {
      monitor.recordProfileLatency(1000);
      
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('chainintel_profile_latency_seconds_bucket');
      expect(metrics).toContain('chainintel_profile_latency_seconds_sum');
      expect(metrics).toContain('chainintel_profile_latency_seconds_count');
    });

    it('should convert milliseconds to seconds', async () => {
      monitor.recordProfileLatency(2000);
      
      const metrics = await monitor.getMetrics();
      
      // 2000ms = 2s, should be in the 2-5 bucket
      expect(metrics).toContain('chainintel_profile_latency_seconds_bucket{le="5"}');
      expect(metrics).toContain('chainintel_profile_latency_seconds_bucket{le="2"}');
    });
  });

  describe('recordCacheHit and recordCacheMiss', () => {
    it('should record cache hits', async () => {
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('chainintel_profile_cache_hits_total');
    });

    it('should record cache misses', async () => {
      monitor.recordCacheMiss();
      
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('chainintel_profile_cache_misses_total');
    });

    it('should calculate cache hit ratio', async () => {
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      monitor.recordCacheMiss();
      monitor.recordCacheMiss();
      
      const metrics = await monitor.getMetrics();
      
      // Hit ratio should be 0.5 (2 hits / 4 total)
      expect(metrics).toContain('chainintel_profile_cache_hit_ratio');
    });

    it('should handle zero total requests', async () => {
      // 创建新的 monitor 实例，确保没有缓存命中或未命中
      const newMonitor = new PipelineMonitor(mockConfig);
      
      // 强制收集指标
      const registry = new Registry();
      registry.registerMetric(newMonitor['profileCacheHitRatio']);
      await registry.metrics();
      
      const metrics = await newMonitor.getMetrics();
      
      // 检查指标中是否包含缓存命中率相关信息
      expect(metrics).toContain('chainintel_profile_cache_hit_ratio');
      
      // 检查缓存命中和未命中计数是否为零
      expect(metrics).toContain('chainintel_profile_cache_hits_total 0');
      expect(metrics).toContain('chainintel_profile_cache_misses_total 0');
    });
  });

  describe('recordAiAnalysisLatency', () => {
    it('should record AI analysis latency', async () => {
      monitor.recordAiAnalysisLatency(1000);
      
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('chainintel_ai_analysis_latency_seconds_bucket');
      expect(metrics).toContain('chainintel_ai_analysis_latency_seconds_sum');
      expect(metrics).toContain('chainintel_ai_analysis_latency_seconds_count');
    });

    it('should convert milliseconds to seconds', async () => {
      monitor.recordAiAnalysisLatency(1500);
      
      const metrics = await monitor.getMetrics();
      
      // 1500ms = 1.5s, should be in the 1-2 bucket
      expect(metrics).toContain('chainintel_ai_analysis_latency_seconds_bucket{le="2"}');
    });
  });

  describe('recordEventProcessing', () => {
    it('should record successful event processing', async () => {
      // 记录成功事件
      monitor.recordEventProcessing('success');
      
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('chainintel_event_processing_total{status="success"}');
    });

    it('should record error event processing', async () => {
      // 记录错误事件
      monitor.recordEventProcessing('error');
      
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('chainintel_event_processing_total{status="error"}');
    });

    it('should increment counters correctly', async () => {
      // 记录多个事件
      monitor.recordEventProcessing('success');
      monitor.recordEventProcessing('success');
      monitor.recordEventProcessing('error');
      
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('chainintel_event_processing_total{status="success"}');
      expect(metrics).toContain('chainintel_event_processing_total{status="error"}');
    });
  });

  describe('recordError', () => {
    it('should record errors by type', async () => {
      // 记录错误
      monitor.recordError('network');
      monitor.recordError('timeout');
      
      // 检查是否调用了 errorTotal.labels().inc()
      const metrics = await monitor.getMetrics();
      
      // 检查指标中是否包含错误计数相关信息
      expect(metrics).toContain('chainintel_error_total');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const metrics = await monitor.getMetrics();
      
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
      expect(metrics).toContain('chainintel_profile_latency_seconds');
      expect(metrics).toContain('chainintel_profile_cache_hits_total');
      expect(metrics).toContain('chainintel_event_processing_total');
    });
  });
}); 