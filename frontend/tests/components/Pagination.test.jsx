import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../../app/components/Pagination';
import userEvent from '@testing-library/user-event';

describe('Pagination组件', () => {
  // 测试1：正确渲染分页控件
  test('正确渲染分页控件', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 验证页码显示
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // 验证上一页/下一页按钮
    expect(screen.getByText('上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页')).toBeInTheDocument();
    
    // 验证当前页高亮
    const currentPageButton = screen.getByText('1').closest('button');
    expect(currentPageButton).toHaveClass('active');
    
    // 验证上一页按钮禁用（因为当前是第一页）
    const prevButton = screen.getByText('上一页').closest('button');
    expect(prevButton).toBeDisabled();
  });

  // 测试2：点击下一页
  test('点击下一页', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 点击下一页
    fireEvent.click(screen.getByText('下一页'));
    
    // 验证回调函数被调用，并传入正确的页码
    expect(mockPageChange).toHaveBeenCalledWith(2);
  });

  // 测试3：点击上一页
  test('点击上一页', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={2} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 点击上一页
    fireEvent.click(screen.getByText('上一页'));
    
    // 验证回调函数被调用，并传入正确的页码
    expect(mockPageChange).toHaveBeenCalledWith(1);
  });

  // 测试4：点击特定页码
  test('点击特定页码', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 点击第3页
    fireEvent.click(screen.getByText('3'));
    
    // 验证回调函数被调用，并传入正确的页码
    expect(mockPageChange).toHaveBeenCalledWith(3);
  });

  // 测试5：处理最后一页
  test('处理最后一页', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={10} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 验证下一页按钮禁用（因为当前是最后一页）
    const nextButton = screen.getByText('下一页').closest('button');
    expect(nextButton).toBeDisabled();
  });

  // 测试6：处理自定义页面大小
  test('处理自定义页面大小', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalItems={100} 
        pageSize={20} 
        onPageChange={mockPageChange} 
      />
    );

    // 验证总页数正确（100项，每页20项，共5页）
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('6')).not.toBeInTheDocument();
  });

  // 测试7：处理无数据情况
  test('处理无数据情况', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalItems={0} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 验证只显示第1页，且按钮禁用
    expect(screen.getByText('1')).toBeInTheDocument();
    
    const pageButton = screen.getByText('1').closest('button');
    expect(pageButton).toBeDisabled();
    
    const prevButton = screen.getByText('上一页').closest('button');
    expect(prevButton).toBeDisabled();
    
    const nextButton = screen.getByText('下一页').closest('button');
    expect(nextButton).toBeDisabled();
  });

  // 测试8：处理大量页面的省略显示
  test('处理大量页面的省略显示', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={5} 
        totalItems={500} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 验证显示省略号
    expect(screen.getByText('...')).toBeInTheDocument();
    
    // 验证只显示部分页码
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // 当前页
    expect(screen.getByText('50')).toBeInTheDocument(); // 最后一页
    
    // 验证不显示所有页码
    expect(screen.queryByText('25')).not.toBeInTheDocument();
  });

  // 边缘情况测试
  it('应处理极端大量的页面数', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalItems={10000} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 验证总页数正确（10000项，每页10项，共1000页）
    expect(screen.getByText('1000')).toBeInTheDocument();
    
    // 验证省略号显示
    expect(screen.getByText('...')).toBeInTheDocument();
    
    // 验证性能 - 不应该渲染所有1000个页码按钮
    const pageButtons = screen.getAllByRole('button').filter(button => 
      !isNaN(parseInt(button.textContent)) && 
      parseInt(button.textContent) > 0
    );
    expect(pageButtons.length).toBeLessThan(20); // 应该只渲染有限数量的页码按钮
  });

  it('应处理页码为0的情况', () => {
    const mockPageChange = jest.fn();
    // 故意传入无效的currentPage=0
    render(
      <Pagination 
        currentPage={0} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 应该自动修正为第1页
    const pageButton = screen.getByText('1').closest('button');
    expect(pageButton).toHaveClass('active');
  });

  it('应处理负数页码的情况', () => {
    const mockPageChange = jest.fn();
    // 故意传入无效的currentPage=-1
    render(
      <Pagination 
        currentPage={-1} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 应该自动修正为第1页
    const pageButton = screen.getByText('1').closest('button');
    expect(pageButton).toHaveClass('active');
  });

  it('应处理超出最大页码的情况', () => {
    const mockPageChange = jest.fn();
    // 故意传入超出范围的currentPage=15（最大只有10页）
    render(
      <Pagination 
        currentPage={15} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 应该自动修正为最大页码
    const pageButton = screen.getByText('10').closest('button');
    expect(pageButton).toHaveClass('active');
  });

  // 无障碍测试
  it('应包含正确的ARIA属性', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={() => {}} 
      />
    );

    // 验证导航元素有正确的role和aria-label
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', '分页导航');
    
    // 验证当前页按钮有正确的aria-current属性
    const currentPageButton = screen.getByText('3').closest('button');
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    
    // 验证上一页/下一页按钮有正确的aria-label
    const prevButton = screen.getByText('上一页').closest('button');
    expect(prevButton).toHaveAttribute('aria-label', '前往上一页');
    
    const nextButton = screen.getByText('下一页').closest('button');
    expect(nextButton).toHaveAttribute('aria-label', '前往下一页');
  });

  it('应支持键盘导航', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={() => {}} 
      />
    );

    // 获取所有页码按钮
    const pageButtons = screen.getAllByRole('button').filter(button => 
      !isNaN(parseInt(button.textContent)) && 
      parseInt(button.textContent) > 0
    );
    
    // 第一个按钮应该可以聚焦
    pageButtons[0].focus();
    expect(document.activeElement).toBe(pageButtons[0]);
    
    // 模拟Tab键按下，焦点应该移动到下一个按钮
    userEvent.tab();
    expect(document.activeElement).toBe(pageButtons[1]);
    
    // 继续Tab，焦点应该继续移动
    userEvent.tab();
    expect(document.activeElement).toBe(pageButtons[2]);
  });

  it('应支持键盘操作', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );

    // 获取当前页按钮
    const currentPageButton = screen.getByText('3').closest('button');
    
    // 聚焦到当前页按钮
    currentPageButton.focus();
    expect(document.activeElement).toBe(currentPageButton);
    
    // 模拟右箭头键按下，应该移动到下一页
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(mockPageChange).toHaveBeenCalledWith(4);
    
    // 重置mock并模拟左箭头键按下，应该移动到上一页
    mockPageChange.mockClear();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
    expect(mockPageChange).toHaveBeenCalledWith(2);
  });

  it('应有足够的颜色对比度', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={() => {}} 
      />
    );

    // 获取当前页按钮
    const currentPageButton = screen.getByText('3').closest('button');
    
    // 检查按钮文本颜色和背景色
    const buttonStyle = window.getComputedStyle(currentPageButton);
    expect(buttonStyle.color).toBeDefined();
    expect(buttonStyle.backgroundColor).toBeDefined();
    
    // 注意：这里我们只能检查样式是否存在，实际的对比度检查需要使用专门的工具如axe
  });
}); 