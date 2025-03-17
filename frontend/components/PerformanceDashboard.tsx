'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChartIcon } from './icons';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  nodeCount: number;
  visibleNodeCount: number;
  memoryUsage?: number;
}

interface PerformanceDashboardProps {
  metrics: PerformanceMetrics;
  isExpanded?: boolean;
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  metrics,
  isExpanded = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(isExpanded);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [renderTimeHistory, setRenderTimeHistory] = useState<number[]>([]);
  const historyLength = 60; // 保持60个数据点的历史记录
  
  // 将性能指标添加到历史记录中
  useEffect(() => {
    setFpsHistory(prev => {
      const newHistory = [...prev, metrics.fps];
      if (newHistory.length > historyLength) {
        return newHistory.slice(-historyLength);
      }
      return newHistory;
    });
    
    setRenderTimeHistory(prev => {
      const newHistory = [...prev, metrics.renderTime];
      if (newHistory.length > historyLength) {
        return newHistory.slice(-historyLength);
      }
      return newHistory;
    });
  }, [metrics.fps, metrics.renderTime]);
  
  // 性能评级计算
  const getPerformanceRating = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (metrics.fps >= 55) return 'excellent';
    if (metrics.fps >= 40) return 'good';
    if (metrics.fps >= 25) return 'fair';
    return 'poor';
  };
  
  const performanceRating = getPerformanceRating();
  const performanceColor = {
    excellent: 'text-green-500',
    good: 'text-blue-500',
    fair: 'text-yellow-500',
    poor: 'text-red-500',
  }[performanceRating];
  
  // 性能图表渲染
  const renderPerformanceChart = (data: number[], maxValue: number, color: string) => {
    if (data.length < 2) return null;
    
    const chartHeight = 40;
    const chartWidth = 120;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - (value / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={chartWidth} height={chartHeight} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };
  
  return (
    <div className={`bg-white rounded-lg shadow ${expanded ? 'p-4' : 'p-2'} ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${performanceColor}`}></span>
          {t('performance.title')}
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          {expanded ? t('common.collapse') : t('common.expand')}
        </button>
      </div>
      
      {/* 基本性能信息，始终显示 */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div>
          <span className="font-medium">{Math.round(metrics.fps)}</span> FPS
        </div>
        <div>
          <span className="font-medium">{Math.round(metrics.renderTime)}</span> ms
        </div>
        <div>
          <span className="font-medium">{metrics.visibleNodeCount}</span>/{metrics.nodeCount} 节点
        </div>
      </div>
      
      {/* 详细信息，仅在展开时显示 */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* FPS 图表 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-500">FPS</span>
              <span className="text-xs text-gray-400">
                峰值: {Math.max(...fpsHistory) || 0} | 平均: {Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length) || 0}
              </span>
            </div>
            <div className="bg-gray-50 rounded p-2">
              {renderPerformanceChart(fpsHistory, 60, 'rgb(34, 197, 94)')}
            </div>
          </div>
          
          {/* 渲染时间图表 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-500">{t('performance.renderTime')}</span>
              <span className="text-xs text-gray-400">
                峰值: {Math.max(...renderTimeHistory) || 0}ms | 平均: {Math.round(renderTimeHistory.reduce((a, b) => a + b, 0) / renderTimeHistory.length) || 0}ms
              </span>
            </div>
            <div className="bg-gray-50 rounded p-2">
              {renderPerformanceChart(renderTimeHistory, Math.max(...renderTimeHistory, 30), 'rgb(59, 130, 246)')}
            </div>
          </div>
          
          {/* 性能建议 */}
          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-xs font-medium text-gray-600 mb-2">{t('performance.recommendations')}</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              {metrics.fps < 30 && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-1">•</span> 
                  {t(metrics.nodeCount > 200 
                    ? 'performance.recommendations.reduceDensity' 
                    : 'performance.recommendations.enableWebGL')}
                </li>
              )}
              {metrics.renderTime > 20 && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-1">•</span>
                  {t('performance.recommendations.enableCulling')}
                </li>
              )}
              {metrics.nodeCount > 500 && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-1">•</span>
                  {t('performance.recommendations.useHierarchical')}
                </li>
              )}
              {performanceRating === 'excellent' && (
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">•</span>
                  {t('performance.recommendations.performanceOptimal')}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard; 