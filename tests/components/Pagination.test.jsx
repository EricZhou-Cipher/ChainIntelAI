import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../../components/Pagination';
import userEvent from '@testing-library/user-event';

describe('Pagination组件', () => {
  test('正确渲染分页控件', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 检查当前页码是否高亮显示
    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    
    // 检查上一页和下一页按钮是否存在
    expect(screen.getByText('上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页')).toBeInTheDocument();
  });
  
  test('点击页码按钮触发回调', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 点击第5页
    fireEvent.click(screen.getByText('5'));
    
    // 验证回调被调用，且参数正确
    expect(mockPageChange).toHaveBeenCalledTimes(1);
    expect(mockPageChange).toHaveBeenCalledWith(5);
  });
  
  test('点击上一页按钮触发回调', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 点击上一页按钮
    fireEvent.click(screen.getByText('上一页'));
    
    // 验证回调被调用，且参数正确
    expect(mockPageChange).toHaveBeenCalledTimes(1);
    expect(mockPageChange).toHaveBeenCalledWith(2);
  });
  
  test('点击下一页按钮触发回调', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 点击下一页按钮
    fireEvent.click(screen.getByText('下一页'));
    
    // 验证回调被调用，且参数正确
    expect(mockPageChange).toHaveBeenCalledTimes(1);
    expect(mockPageChange).toHaveBeenCalledWith(4);
  });
  
  test('在第一页时上一页按钮被禁用', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 验证上一页按钮被禁用
    const prevButton = screen.getByText('上一页');
    expect(prevButton).toBeDisabled();
    
    // 点击上一页按钮
    fireEvent.click(prevButton);
    
    // 验证回调没有被调用
    expect(mockPageChange).not.toHaveBeenCalled();
  });
  
  test('在最后一页时下一页按钮被禁用', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={10} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 验证下一页按钮被禁用
    const nextButton = screen.getByText('下一页');
    expect(nextButton).toBeDisabled();
    
    // 点击下一页按钮
    fireEvent.click(nextButton);
    
    // 验证回调没有被调用
    expect(mockPageChange).not.toHaveBeenCalled();
  });
  
  test('当没有数据时不显示分页', () => {
    const mockPageChange = jest.fn();
    const { container } = render(
      <Pagination 
        currentPage={1} 
        totalItems={0} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 验证分页控件不存在
    expect(container.firstChild).toBeNull();
  });
  
  test('正确处理大量页码', () => {
    const mockPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={50} 
        totalItems={1000} 
        pageSize={10} 
        onPageChange={mockPageChange} 
      />
    );
    
    // 验证省略号存在
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBe(2);
    
    // 验证当前页码及其相邻页码显示
    expect(screen.getByText('49')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('51')).toBeInTheDocument();
    
    // 验证首页和尾页显示
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
  
  test('自定义样式正确应用', () => {
    const mockPageChange = jest.fn();
    const customClass = 'custom-pagination';
    
    render(
      <Pagination 
        currentPage={3} 
        totalItems={100} 
        pageSize={10} 
        onPageChange={mockPageChange} 
        className={customClass}
      />
    );
    
    // 验证自定义样式应用到了分页容器
    const paginationContainer = screen.getByRole('navigation');
    expect(paginationContainer).toHaveClass(customClass);
  });
}); 