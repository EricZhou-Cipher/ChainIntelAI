import { Counter, Gauge, Histogram } from 'prom-client';

// 扩展 prom-client 的类型定义
declare module 'prom-client' {
  interface LabeledCounter {
    inc(value?: number): void;
    get(): number;
  }

  interface LabeledGauge {
    set(value: number): void;
    inc(value?: number): void;
    dec(value?: number): void;
    get(): number;
  }

  interface LabeledHistogram {
    observe(value: number): void;
    startTimer(): () => number;
    get(): {
      sum: number;
      count: number;
      buckets: Record<string, number>;
    };
  }

  interface Counter<T extends string = string> {
    labels(labelValues: Record<string, string> | string): LabeledCounter;
  }

  interface Gauge<T extends string = string> {
    labels(labelValues: Record<string, string> | string): LabeledGauge;
    set(labels: Record<string, string>, value: number): void;
  }

  interface Histogram<T extends string = string> {
    labels(labelValues: Record<string, string> | string): LabeledHistogram;
  }
} 