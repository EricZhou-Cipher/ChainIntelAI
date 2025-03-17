// 添加jest-dom的扩展
import '@testing-library/jest-dom';

// 设置测试环境
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟Next.js的路由
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// 模拟Next.js的图片组件
jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// 模拟WebGLRenderingContext
class WebGLRenderingContext {
  MAX_TEXTURE_SIZE = 0x0d33;
  UNMASKED_VENDOR_WEBGL = 0x9245;
  UNMASKED_RENDERER_WEBGL = 0x9246;

  getParameter() {}
  getExtension() {}
}

// 添加到全局对象
global.WebGLRenderingContext = WebGLRenderingContext;

// 扩展expect
require('@testing-library/jest-dom');
