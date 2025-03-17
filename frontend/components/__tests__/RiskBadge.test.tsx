import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import RiskBadge from '../RiskBadge';

describe('RiskBadge 组件', () => {
  test('渲染低风险徽章', () => {
    render(<RiskBadge level="low" />);
    const badge = screen.getByText('低风险');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  test('渲染中风险徽章', () => {
    render(<RiskBadge level="medium" />);
    const badge = screen.getByText('中风险');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
  });

  test('渲染高风险徽章', () => {
    render(<RiskBadge level="high" />);
    const badge = screen.getByText('高风险');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-orange-100');
    expect(badge).toHaveClass('text-orange-800');
  });

  test('渲染严重风险徽章', () => {
    render(<RiskBadge level="critical" />);
    const badge = screen.getByText('严重风险');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  test('显示风险分数', () => {
    render(<RiskBadge level="high" score={85} showScore={true} />);
    expect(screen.getByText('高风险')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  test('不显示风险分数', () => {
    render(<RiskBadge level="high" score={85} showScore={false} />);
    expect(screen.getByText('高风险')).toBeInTheDocument();
    expect(screen.queryByText('85')).not.toBeInTheDocument();
  });

  test('应用自定义类名', () => {
    render(<RiskBadge level="low" className="custom-class" />);
    const badge = screen.getByText('低风险');
    expect(badge).toHaveClass('custom-class');
  });
}); 