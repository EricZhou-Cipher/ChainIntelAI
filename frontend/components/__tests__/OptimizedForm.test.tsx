import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptimizedForm from '../OptimizedForm';

// 模拟表单提交处理函数
const mockSubmitHandler = jest.fn();

describe('OptimizedForm 组件', () => {
  beforeEach(() => {
    mockSubmitHandler.mockClear();
  });

  test('渲染表单字段', () => {
    render(<OptimizedForm onSubmit={mockSubmitHandler} />);
    
    // 检查表单字段是否存在
    expect(screen.getByLabelText(/地址/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/金额/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/备注/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /提交/i })).toBeInTheDocument();
  });

  test('输入验证 - 必填字段', async () => {
    render(<OptimizedForm onSubmit={mockSubmitHandler} />);
    
    // 点击提交按钮但不填写任何字段
    const submitButton = screen.getByRole('button', { name: /提交/i });
    fireEvent.click(submitButton);
    
    // 验证错误消息
    await waitFor(() => {
      expect(screen.getByText(/地址是必填项/i)).toBeInTheDocument();
      expect(screen.getByText(/金额是必填项/i)).toBeInTheDocument();
    });
    
    // 确认表单没有提交
    expect(mockSubmitHandler).not.toHaveBeenCalled();
  });

  test('输入验证 - 地址格式', async () => {
    render(<OptimizedForm onSubmit={mockSubmitHandler} />);
    
    // 输入无效的地址
    const addressInput = screen.getByLabelText(/地址/i);
    await userEvent.type(addressInput, 'invalid-address');
    
    // 输入有效的金额
    const amountInput = screen.getByLabelText(/金额/i);
    await userEvent.type(amountInput, '100');
    
    // 点击提交按钮
    const submitButton = screen.getByRole('button', { name: /提交/i });
    fireEvent.click(submitButton);
    
    // 验证地址错误消息
    await waitFor(() => {
      expect(screen.getByText(/地址格式无效/i)).toBeInTheDocument();
    });
    
    // 确认表单没有提交
    expect(mockSubmitHandler).not.toHaveBeenCalled();
  });

  test('输入验证 - 金额格式', async () => {
    render(<OptimizedForm onSubmit={mockSubmitHandler} />);
    
    // 输入有效的地址
    const addressInput = screen.getByLabelText(/地址/i);
    await userEvent.type(addressInput, '0x1234567890abcdef1234567890abcdef12345678');
    
    // 输入无效的金额
    const amountInput = screen.getByLabelText(/金额/i);
    await userEvent.type(amountInput, 'abc');
    
    // 点击提交按钮
    const submitButton = screen.getByRole('button', { name: /提交/i });
    fireEvent.click(submitButton);
    
    // 验证金额错误消息
    await waitFor(() => {
      expect(screen.getByText(/金额必须是数字/i)).toBeInTheDocument();
    });
    
    // 确认表单没有提交
    expect(mockSubmitHandler).not.toHaveBeenCalled();
  });

  test('成功提交表单', async () => {
    render(<OptimizedForm onSubmit={mockSubmitHandler} />);
    
    // 输入有效的地址
    const addressInput = screen.getByLabelText(/地址/i);
    await userEvent.type(addressInput, '0x1234567890abcdef1234567890abcdef12345678');
    
    // 输入有效的金额
    const amountInput = screen.getByLabelText(/金额/i);
    await userEvent.type(amountInput, '100');
    
    // 输入备注
    const noteInput = screen.getByLabelText(/备注/i);
    await userEvent.type(noteInput, '测试交易');
    
    // 点击提交按钮
    const submitButton = screen.getByRole('button', { name: /提交/i });
    fireEvent.click(submitButton);
    
    // 验证表单提交
    await waitFor(() => {
      expect(mockSubmitHandler).toHaveBeenCalledTimes(1);
      expect(mockSubmitHandler).toHaveBeenCalledWith({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        amount: '100',
        note: '测试交易'
      });
    });
  });

  test('处理表单提交错误', async () => {
    // 模拟提交处理函数抛出错误
    mockSubmitHandler.mockImplementation(() => {
      throw new Error('提交失败');
    });
    
    render(<OptimizedForm onSubmit={mockSubmitHandler} />);
    
    // 输入有效的地址和金额
    const addressInput = screen.getByLabelText(/地址/i);
    await userEvent.type(addressInput, '0x1234567890abcdef1234567890abcdef12345678');
    
    const amountInput = screen.getByLabelText(/金额/i);
    await userEvent.type(amountInput, '100');
    
    // 点击提交按钮
    const submitButton = screen.getByRole('button', { name: /提交/i });
    fireEvent.click(submitButton);
    
    // 验证错误消息
    await waitFor(() => {
      expect(screen.getByText(/提交失败/i)).toBeInTheDocument();
    });
  });
}); 