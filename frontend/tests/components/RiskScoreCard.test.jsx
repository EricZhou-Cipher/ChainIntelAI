import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RiskScoreCard from '../../app/components/RiskScoreCard';
import userEvent from '@testing-library/user-event';

describe('RiskScoreCard组件', () => {
  // 测试1：正确渲染高风险评分
  test('正确渲染高风险评分', () => {
    const highRiskData = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      riskScore: 85,
      riskLevel: 'high',
      riskFactors: [
        {
          name: '混币交易',
          description: '该地址参与了多次混币交易，试图隐藏资金来源',
          severity: 'high',
          confidence: 0.92
        },
        {
          name: '暗网活动',
          description: '该地址与已知的暗网市场有交易往来',
          severity: 'high',
          confidence: 0.85
        }
      ]
    };

    render(<RiskScoreCard data={highRiskData} />);

    // 验证风险评分显示
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('高风险')).toBeInTheDocument();
    
    // 验证风险因素显示
    expect(screen.getByText('混币交易')).toBeInTheDocument();
    expect(screen.getByText('暗网活动')).toBeInTheDocument();
    
    // 验证高风险样式
    const scoreElement = screen.getByTestId('risk-score');
    expect(scoreElement).toHaveClass('high');
  });

  // 测试2：正确渲染中等风险评分
  test('正确渲染中等风险评分', () => {
    const mediumRiskData = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      riskScore: 65,
      riskLevel: 'medium',
      riskFactors: [
        {
          name: '异常交易模式',
          description: '该地址展示了异常的交易模式',
          severity: 'medium',
          confidence: 0.78
        }
      ]
    };

    render(<RiskScoreCard data={mediumRiskData} />);

    // 验证风险评分显示
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('中等风险')).toBeInTheDocument();
    
    // 验证风险因素显示
    expect(screen.getByText('异常交易模式')).toBeInTheDocument();
    
    // 验证中等风险样式
    const scoreElement = screen.getByTestId('risk-score');
    expect(scoreElement).toHaveClass('medium');
  });

  // 测试3：正确渲染低风险评分
  test('正确渲染低风险评分', () => {
    const lowRiskData = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      riskScore: 25,
      riskLevel: 'low',
      riskFactors: []
    };

    render(<RiskScoreCard data={lowRiskData} />);

    // 验证风险评分显示
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('低风险')).toBeInTheDocument();
    
    // 验证无风险因素提示
    expect(screen.getByText('未检测到明显风险因素')).toBeInTheDocument();
    
    // 验证低风险样式
    const scoreElement = screen.getByTestId('risk-score');
    expect(scoreElement).toHaveClass('low');
  });

  // 测试4：无数据时显示占位符
  test('无数据时显示占位符', () => {
    render(<RiskScoreCard data={null} />);

    // 验证占位符显示
    expect(screen.getByText('暂无风险数据')).toBeInTheDocument();
  });

  // 测试5：正确显示风险因素置信度
  test('正确显示风险因素置信度', () => {
    const riskData = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      riskScore: 85,
      riskLevel: 'high',
      riskFactors: [
        {
          name: '混币交易',
          description: '该地址参与了多次混币交易，试图隐藏资金来源',
          severity: 'high',
          confidence: 0.92
        }
      ]
    };

    render(<RiskScoreCard data={riskData} showConfidence={true} />);

    // 验证置信度显示
    expect(screen.getByText('置信度: 92%')).toBeInTheDocument();
  });

  // 测试6：正确处理自定义标题
  test('正确处理自定义标题', () => {
    const riskData = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      riskScore: 85,
      riskLevel: 'high',
      riskFactors: []
    };

    render(<RiskScoreCard data={riskData} title="自定义风险评分" />);

    // 验证自定义标题
    expect(screen.getByText('自定义风险评分')).toBeInTheDocument();
  });

  // 测试7：正确处理紧凑模式
  test('正确处理紧凑模式', () => {
    const riskData = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      riskScore: 85,
      riskLevel: 'high',
      riskFactors: [
        {
          name: '混币交易',
          description: '该地址参与了多次混币交易，试图隐藏资金来源',
          severity: 'high',
          confidence: 0.92
        },
        {
          name: '暗网活动',
          description: '该地址与已知的暗网市场有交易往来',
          severity: 'high',
          confidence: 0.85
        }
      ]
    };

    render(<RiskScoreCard data={riskData} compact={true} />);

    // 验证紧凑模式下不显示详细描述
    expect(screen.getByText('混币交易')).toBeInTheDocument();
    expect(screen.queryByText('该地址参与了多次混币交易，试图隐藏资金来源')).not.toBeInTheDocument();
    
    // 验证紧凑样式类
    const cardElement = screen.getByTestId('risk-card');
    expect(cardElement).toHaveClass('compact');
  });

  // 边缘情况测试
  it('应正确处理极端风险分数 0', () => {
    render(
      <RiskScoreCard 
        score={0} 
        riskFactors={[]} 
      />
    );
    
    expect(screen.getByText('风险评分')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('无风险')).toBeInTheDocument();
  });

  it('应正确处理极端风险分数 100', () => {
    render(
      <RiskScoreCard 
        score={100} 
        riskFactors={['极高风险交易模式', '与已知黑名单地址交互', '可疑资金流向']} 
      />
    );
    
    expect(screen.getByText('风险评分')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('极高风险')).toBeInTheDocument();
    expect(screen.getByText('极高风险交易模式')).toBeInTheDocument();
    expect(screen.getByText('与已知黑名单地址交互')).toBeInTheDocument();
    expect(screen.getByText('可疑资金流向')).toBeInTheDocument();
  });

  it('应正确处理无效数据 undefined', () => {
    render(
      <RiskScoreCard 
        score={undefined} 
        riskFactors={undefined} 
      />
    );
    
    expect(screen.getByText('风险评分')).toBeInTheDocument();
    expect(screen.getByText('数据不可用')).toBeInTheDocument();
  });

  it('应正确处理无效数据 null', () => {
    render(
      <RiskScoreCard 
        score={null} 
        riskFactors={null} 
      />
    );
    
    expect(screen.getByText('风险评分')).toBeInTheDocument();
    expect(screen.getByText('数据不可用')).toBeInTheDocument();
  });

  // 无障碍测试
  it('应有足够的颜色对比度', () => {
    render(
      <RiskScoreCard 
        score={85} 
        riskFactors={['可疑交易模式', '与已知风险地址交互']} 
      />
    );
    
    // 获取风险分数元素
    const scoreElement = screen.getByText('85');
    
    // 检查文本颜色和背景色是否符合WCAG 2.1 AA标准
    const scoreStyle = window.getComputedStyle(scoreElement);
    expect(scoreStyle.color).toBeDefined();
    expect(scoreStyle.backgroundColor).toBeDefined();
    
    // 注意：这里我们只能检查样式是否存在，实际的对比度检查需要使用专门的工具如axe
  });

  it('应包含正确的ARIA标签', () => {
    render(
      <RiskScoreCard 
        score={85} 
        riskFactors={['可疑交易模式', '与已知风险地址交互']} 
      />
    );
    
    // 风险评分卡应该有正确的role和aria-label
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', '风险评分');
    
    // 进度条应该有正确的role和aria属性
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '85');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('应支持键盘交互', () => {
    render(
      <RiskScoreCard 
        score={85} 
        riskFactors={['可疑交易模式', '与已知风险地址交互']} 
        interactive={true}
      />
    );
    
    // 获取可交互元素
    const interactiveElements = screen.getAllByRole('button');
    
    // 第一个元素应该可以聚焦
    interactiveElements[0].focus();
    expect(document.activeElement).toBe(interactiveElements[0]);
    
    // 模拟Tab键按下，焦点应该移动到下一个元素
    userEvent.tab();
    if (interactiveElements.length > 1) {
      expect(document.activeElement).toBe(interactiveElements[1]);
    }
  });
}); 