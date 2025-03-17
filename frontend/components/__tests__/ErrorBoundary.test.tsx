import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary, { TranslatedErrorBoundary } from '../ErrorBoundary';

// 模拟console.error以避免测试输出中的错误消息
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// 模拟window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
});

// 模拟国际化
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common.error': '发生错误',
        'common.errorOccurred': '应用程序遇到了问题，请刷新页面重试。',
        'common.refresh': '刷新页面'
      };
      return translations[key] || key;
    }
  })
}));

// 创建一个会抛出错误的组件
const ErrorComponent = () => {
  throw new Error('测试错误');
  return <div>这个组件不会渲染</div>;
};

describe('ErrorBoundary 组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div>正常内容</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });
  
  test('捕获错误并显示错误UI', () => {
    // 使用jest.spyOn来模拟console.error，因为ErrorBoundary内部使用了它
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // 渲染会抛出错误的组件
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    // 检查错误UI是否显示
    expect(screen.getByText('页面发生错误')).toBeInTheDocument();
    expect(screen.getByText('应用程序遇到了问题，请刷新页面重试。')).toBeInTheDocument();
    expect(screen.getByText(/测试错误/)).toBeInTheDocument();
    
    // 检查刷新按钮
    const refreshButton = screen.getByText('刷新页面');
    expect(refreshButton).toBeInTheDocument();
    
    // 点击刷新按钮
    fireEvent.click(refreshButton);
    expect(mockReload).toHaveBeenCalledTimes(1);
    
    // 清理
    errorSpy.mockRestore();
  });
  
  test('使用自定义fallback UI', () => {
    const customFallback = <div>自定义错误UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('自定义错误UI')).toBeInTheDocument();
  });
});

describe('TranslatedErrorBoundary 组件', () => {
  test('使用翻译的错误消息', () => {
    render(
      <TranslatedErrorBoundary>
        <ErrorComponent />
      </TranslatedErrorBoundary>
    );
    
    expect(screen.getByText('发生错误')).toBeInTheDocument();
    expect(screen.getByText('应用程序遇到了问题，请刷新页面重试。')).toBeInTheDocument();
    expect(screen.getByText('刷新页面')).toBeInTheDocument();
  });
}); 