import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RiskAlerts from '../../app/components/RiskAlerts';

// 模拟fetch API
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('RiskAlerts组件', () => {
  // 测试1：正确渲染警报列表
  test('正确渲染警报列表', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alerts: [
          { id: '1', title: '高风险交易', severity: 'high' },
          { id: '2', title: '异常资金流动', severity: 'medium' }
        ]
      })
    });

    render(<RiskAlerts />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('高风险交易')).toBeInTheDocument();
      expect(screen.getByText('异常资金流动')).toBeInTheDocument();
    });

    // 验证高风险警报有正确的样式类
    const highRiskAlert = screen.getByText('高风险交易').closest('[data-testid="alert-item"]');
    expect(highRiskAlert).toHaveClass('high');

    // 验证中等风险警报有正确的样式类
    const mediumRiskAlert = screen.getByText('异常资金流动').closest('[data-testid="alert-item"]');
    expect(mediumRiskAlert).toHaveClass('medium');
  });

  // 测试2：无警报时显示提示信息
  test('无警报时显示提示信息', async () => {
    // 模拟空警报列表
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: [] })
    });

    render(<RiskAlerts />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('暂无风险警报')).toBeInTheDocument();
    });
  });

  // 测试3：点击警报可查看详情
  test('点击警报可查看详情', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alerts: [
          { 
            id: '1', 
            title: '高风险交易', 
            description: '检测到高风险地址的异常交易活动',
            severity: 'high' 
          }
        ]
      })
    });

    render(<RiskAlerts />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('高风险交易')).toBeInTheDocument();
    });

    // 点击警报
    fireEvent.click(screen.getByText('高风险交易'));

    // 验证详情是否显示
    expect(screen.getByText('检测到高风险地址的异常交易活动')).toBeInTheDocument();
  });

  // 测试4：加载状态显示
  test('显示加载状态', async () => {
    // 延迟API响应
    fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({ alerts: [] })
        });
      }, 100);
    }));

    render(<RiskAlerts />);

    // 验证加载状态
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  // 测试5：API错误处理
  test('处理API错误', async () => {
    // 模拟API错误
    fetch.mockRejectedValueOnce(new Error('API错误'));

    render(<RiskAlerts />);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText('加载警报失败')).toBeInTheDocument();
    });
  });

  // 测试6：筛选警报
  test('筛选警报', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alerts: [
          { id: '1', title: '高风险交易', severity: 'high' },
          { id: '2', title: '异常资金流动', severity: 'medium' },
          { id: '3', title: '新增黑名单地址', severity: 'low' }
        ]
      })
    });

    render(<RiskAlerts />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('高风险交易')).toBeInTheDocument();
    });

    // 筛选高风险警报
    fireEvent.click(screen.getByText('高风险'));

    // 验证只显示高风险警报
    expect(screen.getByText('高风险交易')).toBeInTheDocument();
    expect(screen.queryByText('异常资金流动')).not.toBeInTheDocument();
    expect(screen.queryByText('新增黑名单地址')).not.toBeInTheDocument();
  });

  // 测试7：标记警报为已解决
  test('标记警报为已解决', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alerts: [
          { id: '1', title: '高风险交易', severity: 'high', status: 'active' }
        ]
      })
    });

    // 模拟更新API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<RiskAlerts />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('高风险交易')).toBeInTheDocument();
    });

    // 点击解决按钮
    fireEvent.click(screen.getByTestId('resolve-button'));

    // 验证解决请求
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toContain('/api/alerts/1');
    expect(fetch.mock.calls[1][1].method).toBe('PUT');
  });
}); 