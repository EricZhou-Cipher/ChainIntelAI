import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 用于捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    // 更新 state 以在下一次渲染时显示降级 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    console.error('组件错误:', error);
    console.error('错误栈:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义降级 UI，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // 默认错误 UI
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-medium text-red-800 mb-2">页面发生错误</h2>
          <p className="text-sm text-red-600 mb-4">
            应用程序遇到了问题，请刷新页面重试。
          </p>
          {this.state.error && (
            <div className="mt-2 p-2 bg-white rounded border border-red-100 overflow-auto max-h-40">
              <p className="text-xs font-mono text-red-600">
                {this.state.error.toString()}
              </p>
            </div>
          )}
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      );
    }

    // 如果没有错误，正常渲染子组件
    return this.props.children;
  }
}

/**
 * 带有国际化支持的错误边界组件
 */
export const TranslatedErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  const { t } = useTranslation();
  
  return (
    <ErrorBoundary
      {...props}
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-medium text-red-800 mb-2">{t('common.error')}</h2>
          <p className="text-sm text-red-600 mb-4">
            {t('common.errorOccurred')}
          </p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            {t('common.refresh')}
          </button>
        </div>
      }
    />
  );
};

export default ErrorBoundary; 