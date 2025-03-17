import { 
  isWebGLSupported, 
  getMaxTextureSize, 
  getDevicePerformanceLevel, 
  getWebGLCapabilities 
} from '../utils/webglDetector';

// 模拟WebGL上下文
class MockWebGLRenderingContext {
  MAX_TEXTURE_SIZE = 0x0D33;
  UNMASKED_VENDOR_WEBGL = 0x9245;
  UNMASKED_RENDERER_WEBGL = 0x9246;
  
  private parameters: Map<number, any> = new Map();
  private extensions: Map<string, any> = new Map();
  
  constructor() {
    this.parameters.set(this.MAX_TEXTURE_SIZE, 8192);
    this.extensions.set('WEBGL_debug_renderer_info', {
      UNMASKED_VENDOR_WEBGL: this.UNMASKED_VENDOR_WEBGL,
      UNMASKED_RENDERER_WEBGL: this.UNMASKED_RENDERER_WEBGL
    });
  }
  
  getParameter(param: number): any {
    return this.parameters.get(param);
  }
  
  getExtension(name: string): any {
    return this.extensions.get(name);
  }
  
  setParameter(param: number, value: any): void {
    this.parameters.set(param, value);
  }
}

// 确保MockWebGLRenderingContext可以被instanceof检查
Object.setPrototypeOf(MockWebGLRenderingContext.prototype, WebGLRenderingContext.prototype);

// 模拟canvas元素
const mockCanvas = {
  getContext: jest.fn()
};

// 模拟document.createElement
document.createElement = jest.fn().mockImplementation((tag: string) => {
  if (tag === 'canvas') {
    return mockCanvas;
  }
  return null;
});

// 模拟navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  configurable: true
});

describe('WebGL 检测工具测试', () => {
  let mockWebGLContext: MockWebGLRenderingContext;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebGLContext = new MockWebGLRenderingContext();
    mockCanvas.getContext.mockReturnValue(mockWebGLContext);
  });
  
  describe('isWebGLSupported', () => {
    it('应该在 WebGL 可用时返回 true', () => {
      expect(isWebGLSupported()).toBe(true);
    });
    
    it('应该在 WebGL 不可用时返回 false', () => {
      mockCanvas.getContext.mockReturnValue(null);
      expect(isWebGLSupported()).toBe(false);
    });
  });
  
  describe('getMaxTextureSize', () => {
    it('应该返回正确的纹理大小', () => {
      mockWebGLContext.setParameter(mockWebGLContext.MAX_TEXTURE_SIZE, 8192);
      expect(getMaxTextureSize()).toBe(8192);
    });
    
    it('应该在 getParameter 返回无效值时返回默认值 0', () => {
      mockWebGLContext.setParameter(mockWebGLContext.MAX_TEXTURE_SIZE, null);
      expect(getMaxTextureSize()).toBe(0);
    });
  });
  
  describe('getDevicePerformanceLevel', () => {
    it('应该对大型纹理支持返回 "high"', () => {
      mockWebGLContext.setParameter(mockWebGLContext.MAX_TEXTURE_SIZE, 16384);
      expect(getDevicePerformanceLevel()).toBe('high');
    });
    
    it('应该对中等纹理支持返回 "medium"', () => {
      mockWebGLContext.setParameter(mockWebGLContext.MAX_TEXTURE_SIZE, 4096);
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      expect(getDevicePerformanceLevel()).toBe('medium');
    });
    
    it('应该对小型纹理支持返回 "low"', () => {
      mockWebGLContext.setParameter(mockWebGLContext.MAX_TEXTURE_SIZE, 2048);
      expect(getDevicePerformanceLevel()).toBe('low');
    });
  });
  
  describe('getWebGLCapabilities', () => {
    it('应该在 WebGL 可用时返回完整的能力对象', () => {
      // 为每个getContext调用设置相同的上下文
      mockCanvas.getContext.mockImplementation((contextId: string, options?: any) => {
        if (contextId === 'webgl' || contextId === 'experimental-webgl') {
          const context = new MockWebGLRenderingContext();
          context.setParameter(context.MAX_TEXTURE_SIZE, 16384);
          context.setParameter(context.UNMASKED_VENDOR_WEBGL, 'Test Vendor');
          context.setParameter(context.UNMASKED_RENDERER_WEBGL, 'Test Renderer');
          return context;
        }
        return null;
      });
      
      const capabilities = getWebGLCapabilities();
      
      expect(capabilities).toEqual({
        supported: true,
        hardwareAccelerated: true,
        maxTextureSize: 16384,
        performanceLevel: 'high',
        vendor: 'Test Vendor',
        renderer: 'Test Renderer'
      });
    });
    
    it('应该在 WebGL 不可用时返回默认值', () => {
      mockCanvas.getContext.mockReturnValue(null);
      
      const capabilities = getWebGLCapabilities();
      
      expect(capabilities).toEqual({
        supported: false,
        hardwareAccelerated: false,
        maxTextureSize: 0,
        performanceLevel: 'low',
        vendor: '',
        renderer: ''
      });
    });
  });
}); 