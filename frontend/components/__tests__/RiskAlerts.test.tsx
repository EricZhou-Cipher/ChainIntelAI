import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import RiskAlerts from '../RiskAlerts';

// 模拟API服务
const mockFetchAlerts = jest.fn();

// 模拟API模块
jest.mock('../../utils/api', () => ({
  fetchAlerts: () => mockFetchAlerts()
}));

describe('RiskAlerts 组件', () => {
  beforeEach(() => {
    mockFetchAlerts.mockClear();
  });

  test('正常渲染风险警报列表', async () => {
    // 模拟API返回数据
    const mockAlerts = [
      { id: '1', level: 'high', message: '可疑交易检测', timestamp: '2023-05-01T10:00:00Z', address: '0x123...', score: 85 },
      { id: '2', level: 'medium', message: '异常活动', timestamp: '2023-05-02T11:00:00Z', address: '0x456...', score: 65 }
    ];
    mockFetchAlerts.mockResolvedValue({ alerts: mockAlerts });

    render(<RiskAlerts />);

    // 初始应该显示加载状态
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('可疑交易检测')).toBeInTheDocument();
    });

    // 验证警报项目是否正确渲染
    expect(screen.getByText('可疑交易检测')).toBeInTheDocument();
    expect(screen.getByText('异常活动')).toBeInTheDocument();
    expect(screen.getByText('0x123...')).toBeInTheDocument();
    expect(screen.getByText('0x456...')).toBeInTheDocument();
  });

  test('显示加载状态', () => {
    // 模拟API请求永远不会解析
    mockFetchAlerts.mockImplementation(() => new Promise(() => {}));
    
    render(<RiskAlerts />);
    
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });

  test('处理API错误', async () => {
    // 模拟API请求失败
    mockFetchAlerts.mockRejectedValue(new Error('API错误'));
    
    render(<RiskAlerts />);
    
    // 等待错误信息显示
    await waitFor(() => {
      expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
    });
  });

  test('处理空数据', async () => {
    // 模拟API返回空数据
    mockFetchAlerts.mockResolvedValue({ alerts: [] });
    
    render(<RiskAlerts />);
    
    // 等待空数据信息显示
    await waitFor(() => {
      expect(screen.getByText(/没有警报/i)).toBeInTheDocument();
    });
  });
}); 