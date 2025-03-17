import { v4 as uuidv4 } from 'uuid';

/**
 * 生成追踪ID
 */
export function generateTraceId(): string {
  return uuidv4();
}

/**
 * 从请求头中获取追踪ID
 */
export function getTraceIdFromHeaders(headers: Record<string, string | string[] | undefined>): string {
  const traceId = headers['x-trace-id'] || headers['x-request-id'];
  
  if (typeof traceId === 'string') {
    return traceId;
  }
  
  return generateTraceId();
} 