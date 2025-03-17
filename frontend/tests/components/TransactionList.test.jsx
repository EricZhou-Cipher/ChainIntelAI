import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionList from '../../app/components/TransactionList';
import userEvent from '@testing-library/user-event';

// 模拟fetch API
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('TransactionList组件', () => {
  // 测试1：正确渲染交易数据
  test('正确渲染交易数据', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [
          { 
            hash: '0x1234', 
            from: '0xA', 
            to: '0xB', 
            value: '10 ETH',
            timestamp: '2023-03-17T10:15:30Z',
            status: 'confirmed'
          }
        ]
      })
    });

    render(<TransactionList />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234')).toBeInTheDocument();
      expect(screen.getByText('10 ETH')).toBeInTheDocument();
      expect(screen.getByText('0xA')).toBeInTheDocument();
      expect(screen.getByText('0xB')).toBeInTheDocument();
    });
  });

  // 测试2：搜索交易
  test('搜索交易', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [
          { hash: '0x1234', from: '0xA', to: '0xB', value: '10 ETH', timestamp: '2023-03-17T10:15:30Z' },
          { hash: '0x5678', from: '0xC', to: '0xD', value: '5 ETH', timestamp: '2023-03-17T09:45:12Z' }
        ]
      })
    });

    render(<TransactionList />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234')).toBeInTheDocument();
      expect(screen.getByText('0x5678')).toBeInTheDocument();
    });

    // 搜索交易
    const searchInput = screen.getByPlaceholderText('搜索交易');
    fireEvent.change(searchInput, { target: { value: '0x1234' } });

    // 验证搜索结果
    expect(screen.getByText('0x1234')).toBeInTheDocument();
    expect(screen.queryByText('0x5678')).not.toBeInTheDocument();
  });

  // 测试3：分页功能
  test('分页功能', async () => {
    // 创建大量模拟数据
    const mockTransactions = Array.from({ length: 25 }, (_, i) => ({
      hash: `0x${i.toString().padStart(4, '0')}`,
      from: `0xSender${i}`,
      to: `0xReceiver${i}`,
      value: `${i} ETH`,
      timestamp: new Date().toISOString()
    }));

    // 模拟第一页API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions.slice(0, 10),
        total: mockTransactions.length
      })
    });

    // 模拟第二页API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions.slice(10, 20),
        total: mockTransactions.length
      })
    });

    render(<TransactionList />);

    // 等待第一页加载完成
    await waitFor(() => {
      expect(screen.getByText('0x0000')).toBeInTheDocument();
    });

    // 点击下一页
    fireEvent.click(screen.getByText('下一页'));

    // 等待第二页加载完成
    await waitFor(() => {
      expect(screen.getByText('0x0010')).toBeInTheDocument();
      expect(screen.queryByText('0x0000')).not.toBeInTheDocument();
    });
  });

  // 测试4：加载状态显示
  test('显示加载状态', async () => {
    // 延迟API响应
    fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({ transactions: [] })
        });
      }, 100);
    }));

    render(<TransactionList />);

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

    render(<TransactionList />);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText('加载交易失败')).toBeInTheDocument();
    });
  });

  // 测试6：交易详情
  test('点击交易显示详情', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [
          { 
            hash: '0x1234', 
            from: '0xA', 
            to: '0xB', 
            value: '10 ETH',
            timestamp: '2023-03-17T10:15:30Z',
            status: 'confirmed'
          }
        ]
      })
    });

    // 模拟交易详情API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transaction: {
          hash: '0x1234',
          from: '0xA',
          to: '0xB',
          value: '10 ETH',
          gasUsed: '21000',
          gasPrice: '25',
          timestamp: '2023-03-17T10:15:30Z',
          status: 'confirmed',
          blockNumber: 15678901
        }
      })
    });

    render(<TransactionList />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234')).toBeInTheDocument();
    });

    // 点击交易
    fireEvent.click(screen.getByText('0x1234'));

    // 等待详情加载
    await waitFor(() => {
      expect(screen.getByText('交易详情')).toBeInTheDocument();
      expect(screen.getByText('区块号:')).toBeInTheDocument();
      expect(screen.getByText('15678901')).toBeInTheDocument();
    });
  });

  // 测试7：筛选交易状态
  test('筛选交易状态', async () => {
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [
          { hash: '0x1234', status: 'confirmed', value: '10 ETH', timestamp: '2023-03-17T10:15:30Z' },
          { hash: '0x5678', status: 'pending', value: '5 ETH', timestamp: '2023-03-17T09:45:12Z' },
          { hash: '0x9abc', status: 'failed', value: '3 ETH', timestamp: '2023-03-17T09:30:45Z' }
        ]
      })
    });

    render(<TransactionList />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('0x1234')).toBeInTheDocument();
    });

    // 筛选确认状态
    fireEvent.click(screen.getByText('已确认'));

    // 验证只显示确认交易
    expect(screen.getByText('0x1234')).toBeInTheDocument();
    expect(screen.queryByText('0x5678')).not.toBeInTheDocument();
    expect(screen.queryByText('0x9abc')).not.toBeInTheDocument();
  });

  // 边缘情况测试
  it('当没有交易数据时应显示占位符', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ transactions: [], total: 0 }),
      })
    );

    render(<TransactionList />);
    
    await waitFor(() => {
      expect(screen.getByText('没有找到交易数据')).toBeInTheDocument();
    });
  });

  it('搜索结果为空时应显示未找到结果提示', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ transactions: [], total: 0 }),
      })
    );

    render(<TransactionList />);
    
    const searchInput = screen.getByPlaceholderText('搜索交易');
    fireEvent.change(searchInput, { target: { value: '不存在的交易' } });
    fireEvent.click(screen.getByText('搜索'));
    
    await waitFor(() => {
      expect(screen.getByText('没有找到匹配的交易')).toBeInTheDocument();
    });
  });

  it('应处理超大数据集而不导致性能问题', async () => {
    // 创建一个包含1000条交易的大数据集
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `tx-${i}`,
      hash: `0x${i.toString().padStart(64, '0')}`,
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: '1.0 ETH',
      timestamp: new Date().toISOString(),
      status: i % 3 === 0 ? 'confirmed' : i % 3 === 1 ? 'pending' : 'failed',
    }));

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ transactions: largeDataset.slice(0, 10), total: largeDataset.length }),
      })
    );

    // 使用性能计时API测量渲染时间
    const startTime = performance.now();
    render(<TransactionList />);
    const endTime = performance.now();

    // 确保渲染时间在合理范围内（小于500ms）
    expect(endTime - startTime).toBeLessThan(500);
    
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1); // 表头 + 至少一行数据
    });
  });

  // 无障碍测试
  it('交易行应支持键盘导航', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ transactions: mockTransactions, total: mockTransactions.length }),
      })
    );

    render(<TransactionList />);
    
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    // 获取所有可聚焦元素
    const focusableElements = screen.getAllByRole('button');
    
    // 第一个元素应该可以聚焦
    focusableElements[0].focus();
    expect(document.activeElement).toBe(focusableElements[0]);
    
    // 模拟Tab键按下，焦点应该移动到下一个元素
    userEvent.tab();
    expect(document.activeElement).toBe(focusableElements[1]);
  });

  it('应包含正确的ARIA属性', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ transactions: mockTransactions, total: mockTransactions.length }),
      })
    );

    render(<TransactionList />);
    
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    // 表格应该有正确的ARIA角色
    expect(screen.getByRole('table')).toHaveAttribute('aria-label', '交易列表');
    
    // 表头应该有正确的scope属性
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });
    
    // 状态应该有正确的aria-label
    const statusElements = screen.getAllByLabelText(/状态:/);
    expect(statusElements.length).toBeGreaterThan(0);
  });
}); 