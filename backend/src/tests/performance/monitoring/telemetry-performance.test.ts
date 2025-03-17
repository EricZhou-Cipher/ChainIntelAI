/**
 * OpenTelemetry 性能测试
 * 
 * 测试 OpenTelemetry 的性能影响
 */

import { 
  createSpan, 
  recordMetric, 
  setSpanAttribute, 
  recordSpanEvent 
} from '../../../monitoring/telemetry';

describe('OpenTelemetry 性能测试', () => {
  // 辅助函数：测量函数执行时间
  const measureExecutionTime = async (fn: () => Promise<void>, iterations: number = 1000): Promise<number> => {
    const start = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // 转换为毫秒
  };
  
  // 辅助函数：延迟一段时间
  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
  
  it('应该测量 createSpan 的性能', async () => {
    const iterations = 100;
    
    const executionTime = await measureExecutionTime(async () => {
      await createSpan('performance-test', async () => {
        await delay(1); // 模拟一个非常短的操作
      });
    }, iterations);
    
    console.log(`createSpan 平均执行时间: ${executionTime / iterations} 毫秒`);
    expect(executionTime).toBeDefined();
  }, 30000);
  
  it('应该测量 recordMetric 的性能', async () => {
    const iterations = 10000;
    
    const executionTime = await measureExecutionTime(async () => {
      recordMetric('performance-test', 1, { test: 'value' });
    }, iterations);
    
    console.log(`recordMetric 平均执行时间: ${executionTime / iterations} 毫秒`);
    expect(executionTime).toBeDefined();
  }, 30000);
  
  it('应该测量 setSpanAttribute 的性能', async () => {
    const iterations = 10000;
    
    const executionTime = await measureExecutionTime(async () => {
      setSpanAttribute('test-key', 'test-value');
    }, iterations);
    
    console.log(`setSpanAttribute 平均执行时间: ${executionTime / iterations} 毫秒`);
    expect(executionTime).toBeDefined();
  }, 30000);
  
  it('应该测量 recordSpanEvent 的性能', async () => {
    const iterations = 10000;
    
    const executionTime = await measureExecutionTime(async () => {
      recordSpanEvent('test-event', { key: 'value' });
    }, iterations);
    
    console.log(`recordSpanEvent 平均执行时间: ${executionTime / iterations} 毫秒`);
    expect(executionTime).toBeDefined();
  }, 30000);
  
  it('应该测量嵌套 Span 的性能', async () => {
    const iterations = 100;
    
    const executionTime = await measureExecutionTime(async () => {
      await createSpan('parent-span', async () => {
        setSpanAttribute('parent-key', 'parent-value');
        recordSpanEvent('parent-event', { parent: 'true' });
        
        await createSpan('child-span-1', async () => {
          setSpanAttribute('child-key-1', 'child-value-1');
          await delay(1);
        });
        
        await createSpan('child-span-2', async () => {
          setSpanAttribute('child-key-2', 'child-value-2');
          await delay(1);
        });
      });
    }, iterations);
    
    console.log(`嵌套 Span 平均执行时间: ${executionTime / iterations} 毫秒`);
    expect(executionTime).toBeDefined();
  }, 30000);
}); 