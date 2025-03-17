import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './page';

describe('Dashboard Page', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('ChainIntelAI 仪表盘')).toBeInTheDocument();
  });

  it('renders system status section', () => {
    render(<Dashboard />);
    expect(screen.getByText('系统状态')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();
  });

  it('renders risk distribution section', () => {
    render(<Dashboard />);
    expect(screen.getByText('风险分布')).toBeInTheDocument();
    expect(screen.getByText('低风险')).toBeInTheDocument();
    expect(screen.getByText('中风险')).toBeInTheDocument();
    expect(screen.getByText('高风险')).toBeInTheDocument();
  });

  it('renders network activity section', () => {
    render(<Dashboard />);
    expect(screen.getByText('实时网络活动')).toBeInTheDocument();
    expect(screen.getByText('简化网络视图')).toBeInTheDocument();
    expect(screen.getByText(/个节点/)).toBeInTheDocument();
    expect(screen.getByText(/个连接/)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Dashboard />);
    expect(screen.getByText('地址分析')).toBeInTheDocument();
    expect(screen.getByText('交易监控')).toBeInTheDocument();
    expect(screen.getByText('风险警报')).toBeInTheDocument();
  });
}); 