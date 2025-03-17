import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../../app/components/SearchBar';
import userEvent from '@testing-library/user-event';

describe('SearchBar组件', () => {
  test('正确渲染搜索栏', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} placeholder="搜索地址或交易" />);

    // 检查输入框和按钮是否正确渲染
    const input = screen.getByPlaceholderText('搜索地址或交易');
    expect(input).toBeInTheDocument();

    // 验证搜索按钮
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('点击搜索按钮触发回调', async () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} placeholder="搜索..." />);

    // 输入搜索词
    const input = screen.getByPlaceholderText('搜索...');
    await userEvent.type(input, 'test query');

    // 点击搜索按钮
    fireEvent.click(screen.getByRole('button'));

    // 验证回调被调用，且参数正确
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith('test query');
  });

  test('搜索为空时不触发回调', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);

    // 点击搜索按钮但没有输入内容
    fireEvent.click(screen.getByRole('button'));

    // 验证回调没有被调用
    expect(handleSearch).not.toHaveBeenCalled();
  });
});
