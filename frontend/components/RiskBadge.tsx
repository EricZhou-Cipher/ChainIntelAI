import React, { useMemo } from 'react';
import { arePropsEqual } from '../utils/performance';

// 风险等级类型
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// 组件属性类型
interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  className?: string;
}

/**
 * 风险徽章组件 - 使用React.memo优化渲染性能
 */
const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = false, className = '' }) => {
  // 使用useMemo缓存颜色计算结果
  const badgeStyles = useMemo(() => {
    // 根据风险等级返回不同的样式
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, [level]);

  // 使用useMemo缓存风险文本
  const riskText = useMemo(() => {
    const texts = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '严重风险'
    };
    return texts[level] || '未知风险';
  }, [level]);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles} ${className}`}>
      {riskText}
      {showScore && score !== undefined && (
        <span className="ml-1 font-bold">{score}</span>
      )}
    </span>
  );
};

// 使用React.memo包装组件，并使用自定义比较函数
export default React.memo(RiskBadge, arePropsEqual); 