/**
 * 简单的 OpenTelemetry 测试
 */

import { meter } from '../../../monitoring/telemetry';

describe('简单 OpenTelemetry 测试', () => {
  it('应该能够导入 meter', () => {
    expect(meter).toBeDefined();
  });
}); 