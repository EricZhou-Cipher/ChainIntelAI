import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { useState, useEffect } from 'react';

// 模拟API服务
const mockFetchData = jest.fn();

// 创建一个简单的异步组件
function AsyncDataComponent() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await mockFetchData();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError('加载数据失败');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  return <div>数据: {data}</div>;
}

describe('异步组件测试', () => {
  beforeEach(() => {
    mockFetchData.mockClear();
  });

  test('显示加载状态', () => {
    // 模拟API请求永远不会解析
    mockFetchData.mockImplementation(() => new Promise(() => {}));
    
    render(<AsyncDataComponent />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  test('成功加载数据后显示数据', async () => {
    // 模拟API请求成功返回数据
    mockFetchData.mockResolvedValue('测试数据');
    
    render(<AsyncDataComponent />);
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('数据: 测试数据')).toBeInTheDocument();
    });
    
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });

  test('加载失败时显示错误信息', async () => {
    // 模拟API请求失败
    mockFetchData.mockRejectedValue(new Error('API错误'));
    
    render(<AsyncDataComponent />);
    
    // 等待错误信息显示
    await waitFor(() => {
      expect(screen.getByText('错误: 加载数据失败')).toBeInTheDocument();
    });
    
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });
}); 