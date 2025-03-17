/**
 * OpenTelemetry 集成示例
 * 
 * 本文件展示如何使用 OpenTelemetry 进行分布式追踪和指标收集
 */

import { 
  initTelemetry, 
  createSpan, 
  recordMetric, 
  setSpanAttribute, 
  recordSpanEvent,
  getCurrentTraceId,
  getCurrentSpanId
} from '../monitoring/telemetry';
import { logger } from '../utils/logger';

// 初始化 OpenTelemetry
initTelemetry();

/**
 * 模拟一个异步操作
 */
async function simulateAsyncOperation(name: string, duration: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`${name} 完成`);
    }, duration);
  });
}

/**
 * 使用 OpenTelemetry 追踪的示例函数
 */
async function tracedFunction() {
  // 创建一个带有追踪的 span
  return await createSpan('example.operation', async () => {
    logger.info('开始执行追踪操作');
    
    // 设置 span 属性
    setSpanAttribute('operation.type', 'example');
    setSpanAttribute('operation.priority', 1);
    
    // 记录一个事件
    recordSpanEvent('operation.started', { timestamp: new Date().toISOString() });
    
    // 执行一些操作
    const result1 = await simulateAsyncOperation('子操作1', 100);
    
    // 记录另一个事件
    recordSpanEvent('suboperation.completed', { name: '子操作1' });
    
    // 嵌套 span
    const result2 = await createSpan('example.suboperation', async () => {
      setSpanAttribute('suboperation.name', '子操作2');
      
      // 记录指标
      recordMetric('suboperation.count', 1, { name: '子操作2' });
      
      return await simulateAsyncOperation('子操作2', 200);
    });
    
    // 获取并记录当前的 trace ID 和 span ID
    const traceId = getCurrentTraceId();
    const spanId = getCurrentSpanId();
    logger.info(`当前 Trace ID: ${traceId}, Span ID: ${spanId}`);
    
    // 记录更多指标
    recordMetric('operation.duration', 300, { status: 'success' });
    
    return `操作完成: ${result1}, ${result2}`;
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('开始 OpenTelemetry 示例');
    
    const result = await tracedFunction();
    logger.info(`操作结果: ${result}`);
    
    // 等待一段时间以确保所有遥测数据都被导出
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('OpenTelemetry 示例完成');
  } catch (error) {
    logger.error('示例执行失败', { error });
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(error => {
    logger.error('未捕获的错误', { error });
    process.exit(1);
  });
}

export { tracedFunction }; 