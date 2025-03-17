import { randomBytes } from 'crypto';

export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

export function isValidTraceId(traceId: string): boolean {
  return /^[a-f0-9]{32}$/.test(traceId);
}
