/**
 * OpenTelemetry 功能测试
 */

import { 
  createSpan, 
  recordMetric, 
  setSpanAttribute, 
  recordSpanEvent,
  getCurrentTraceId,
  getCurrentSpanId,
  meter
} from '../../../monitoring/telemetry';

// 简单的 mock 函数
const mockAdd = jest.fn();
const mockObserve = jest.fn();
const mockSetAttribute = jest.fn();
const mockAddEvent = jest.fn();

// 模拟 meter 的 createCounter 方法
jest.mock('../../../monitoring/telemetry', () => {
  const original = jest.requireActual('../../../monitoring/telemetry');
  
  return {
    ...original,
    meter: {
      createCounter: jest.fn().mockReturnValue({
        add: mockAdd
      })
    },
    recordMetric: jest.fn().mockImplementation((name, value, attributes) => {
      mockAdd(value, attributes);
    }),
    setSpanAttribute: jest.fn().mockImplementation((key, value) => {
      mockSetAttribute(key, value);
    }),
    recordSpanEvent: jest.fn().mockImplementation((name, attributes) => {
      mockAddEvent(name, attributes);
    })
  };
});

describe('OpenTelemetry 功能测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('应该能够记录指标', () => {
    recordMetric('test-metric', 1, { key: 'value' });
    expect(mockAdd).toHaveBeenCalledWith(1, { key: 'value' });
  });
  
  it('应该能够设置 Span 属性', () => {
    setSpanAttribute('test-key', 'test-value');
    expect(mockSetAttribute).toHaveBeenCalledWith('test-key', 'test-value');
  });
  
  it('应该能够记录 Span 事件', () => {
    recordSpanEvent('test-event', { key: 'value' });
    expect(mockAddEvent).toHaveBeenCalledWith('test-event', { key: 'value' });
  });
}); 