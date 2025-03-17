import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddressDetails from '../../app/components/AddressDetails';
import userEvent from '@testing-library/user-event';

// 模拟fetch API
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('AddressDetails组件', () => {
  // 模拟地址详情数据
  const mockAddressData = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    balance: '15.75',
    transactionCount: 156,
    firstSeen: '2022-05-12T08:30:15Z',
    lastSeen: '2023-03-17T10:15:30Z',
    riskScore: 85,
    riskLevel: 'high',
    tags: ['混币', '暗网', '高风险'],
    riskFactors: [
      {
        name: '混币交易',
        description: '该地址参与了多次混币交易，试图隐藏资金来源',
        severity: 'high',
        confidence: 0.92
      }
    ],
    transactionHistory: [
      {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        timestamp: '2023-03-17T10:15:30Z',
        counterparty: '0x2345678901abcdef2345678901abcdef23456789',
        direction: 'outgoing',
        value: '5.25',
        type: 'transfer',
        status: 'confirmed'
      },
      {
        hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        timestamp: '2023-03-16T14:22:45Z',
        counterparty: '0x3456789012abcdef3456789012abcdef34567890',
        direction: 'incoming',
        value: '10.0',
        type: 'transfer',
        status: 'confirmed'
      }
    ],
    relatedAddresses: [
      {
        address: '0x2345678901abcdef2345678901abcdef23456789',
        relationship: '交易对手',
        transactionCount: 12,
        lastTransaction: '2023-03-17T10:15:30Z',
        riskLevel: 'medium'
      }
    ]
  };

  // 测试1：正确渲染地址详情
  test('正确渲染地址详情', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: mockAddressData })
    });

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });

    // 验证基本信息显示
    expect(screen.getByText('余额:')).toBeInTheDocument();
    expect(screen.getByText('15.75')).toBeInTheDocument();
    expect(screen.getByText('交易数量:')).toBeInTheDocument();
    expect(screen.getByText('156')).toBeInTheDocument();

    // 验证风险评分显示
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('高风险')).toBeInTheDocument();

    // 验证标签显示
    expect(screen.getByText('混币')).toBeInTheDocument();
    expect(screen.getByText('暗网')).toBeInTheDocument();
    expect(screen.getByText('高风险')).toBeInTheDocument();

    // 验证交易历史显示
    expect(screen.getByText('交易历史')).toBeInTheDocument();
    expect(screen.getByText('0xabcdef1234')).toBeInTheDocument(); // 截断的哈希
    expect(screen.getByText('5.25')).toBeInTheDocument();
    expect(screen.getByText('10.0')).toBeInTheDocument();

    // 验证相关地址显示
    expect(screen.getByText('相关地址')).toBeInTheDocument();
    expect(screen.getByText('0x2345678901')).toBeInTheDocument(); // 截断的地址
  });

  // 测试2：加载状态显示
  test('显示加载状态', async () => {
    // 延迟API响应
    fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({ address: mockAddressData })
        });
      }, 100);
    }));

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 验证加载状态
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  // 测试3：API错误处理
  test('处理API错误', async () => {
    // 模拟API错误
    fetch.mockRejectedValueOnce(new Error('API错误'));

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText('加载地址详情失败')).toBeInTheDocument();
    });
  });

  // 测试4：无效地址处理
  test('处理无效地址', async () => {
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid Ethereum address format' })
    });

    render(<AddressDetails address="invalid-address" />);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText('无效的以太坊地址格式')).toBeInTheDocument();
    });
  });

  // 测试5：地址不存在处理
  test('处理不存在的地址', async () => {
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Address not found' })
    });

    render(<AddressDetails address="0x0000000000000000000000000000000000000000" />);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText('地址未找到')).toBeInTheDocument();
    });
  });

  // 测试6：交易历史分页
  test('交易历史分页', async () => {
    // 创建大量模拟交易数据
    const mockLargeTransactionHistory = Array.from({ length: 25 }, (_, i) => ({
      hash: `0x${i.toString().padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      counterparty: `0xCounter${i}`,
      direction: i % 2 === 0 ? 'outgoing' : 'incoming',
      value: `${i} ETH`,
      type: 'transfer',
      status: 'confirmed'
    }));

    const mockDataWithLargeHistory = {
      ...mockAddressData,
      transactionHistory: mockLargeTransactionHistory
    };

    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: mockDataWithLargeHistory })
    });

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });

    // 验证第一页交易显示
    expect(screen.getByText('0x0000')).toBeInTheDocument();
    
    // 点击下一页
    fireEvent.click(screen.getByText('下一页'));
    
    // 验证第二页交易显示
    expect(screen.getByText('0x0010')).toBeInTheDocument();
    expect(screen.queryByText('0x0000')).not.toBeInTheDocument();
  });

  // 测试7：切换交易历史和相关地址标签
  test('切换交易历史和相关地址标签', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: mockAddressData })
    });

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });

    // 默认显示交易历史
    expect(screen.getByText('交易历史')).toBeInTheDocument();
    expect(screen.getByText('0xabcdef1234')).toBeInTheDocument();
    
    // 点击相关地址标签
    fireEvent.click(screen.getByText('相关地址'));
    
    // 验证显示相关地址
    expect(screen.getByText('0x2345678901')).toBeInTheDocument();
    expect(screen.getByText('交易对手')).toBeInTheDocument();
  });

  // 边缘情况测试
  it('应处理API响应慢的情况', async () => {
    // 模拟延迟3秒的API响应
    fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({ address: mockAddressData })
        });
      }, 3000);
    }));

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 验证加载状态持续显示
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    }, { timeout: 4000 });
    
    // 验证数据最终显示
    expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
  });

  it('应处理网络请求失败的情况', async () => {
    // 模拟网络错误
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText('网络错误，请检查您的连接')).toBeInTheDocument();
    });
    
    // 验证重试按钮显示
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('应处理地址交易量过大的情况', async () => {
    // 创建一个包含10000条交易的大数据集
    const largeTransactionHistory = Array.from({ length: 10000 }, (_, i) => ({
      hash: `0x${i.toString().padStart(64, '0')}`,
      timestamp: new Date().toISOString(),
      counterparty: `0xCounter${i}`,
      direction: i % 2 === 0 ? 'outgoing' : 'incoming',
      value: `${i % 100} ETH`,
      type: 'transfer',
      status: 'confirmed'
    }));

    const largeAddressData = {
      ...mockAddressData,
      transactionCount: 10000,
      transactionHistory: largeTransactionHistory.slice(0, 20) // API只返回前20条
    };

    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: largeAddressData })
    });

    // 使用性能计时API测量渲染时间
    const startTime = performance.now();
    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);
    const endTime = performance.now();

    // 确保渲染时间在合理范围内（小于1000ms）
    expect(endTime - startTime).toBeLessThan(1000);
    
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });
    
    // 验证分页信息显示正确的总交易数
    expect(screen.getByText(/共 10000 条交易/)).toBeInTheDocument();
  });

  // 无障碍测试
  it('应包含正确的ARIA标签', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: mockAddressData })
    });

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });

    // 验证主区域有正确的role和aria-label
    expect(screen.getByRole('region', { name: '地址详情' })).toBeInTheDocument();
    
    // 验证交易历史表格有正确的aria属性
    expect(screen.getByRole('table')).toHaveAttribute('aria-label', '交易历史');
    
    // 验证标签页有正确的role和aria-selected
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('应支持键盘快捷键', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: mockAddressData })
    });

    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });

    // 获取标签页
    const tabs = screen.getAllByRole('tab');
    
    // 第一个标签页应该可以聚焦
    tabs[0].focus();
    expect(document.activeElement).toBe(tabs[0]);
    
    // 模拟右箭头键按下，焦点应该移动到下一个标签页
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[1]);
    
    // 模拟Enter键按下，应该激活标签页
    fireEvent.keyDown(document.activeElement, { key: 'Enter' });
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    
    // 验证相关地址内容显示
    expect(screen.getByText('交易对手')).toBeInTheDocument();
  });

  it('应支持Esc键关闭详情视图', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ address: mockAddressData })
    });

    const onClose = jest.fn();
    render(<AddressDetails address="0x1234567890abcdef1234567890abcdef12345678" onClose={onClose} />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });

    // 模拟Esc键按下
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // 验证关闭回调被调用
    expect(onClose).toHaveBeenCalled();
  });
}); 