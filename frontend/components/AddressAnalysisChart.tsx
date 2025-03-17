import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Scatter,
  ZAxis,
  Brush
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { asJsxComponent } from '../utils/chartUtils';

// 定义数据类型
export interface AddressActivityData {
  date: string;
  transactionCount: number;
  volume: number;
  avgValue: number;
  riskScore?: number;
}

// 定义图表类型
type ChartType = 'activity' | 'volume' | 'risk';

// 定义组件属性类型
interface AddressAnalysisChartProps {
  data: AddressActivityData[];
  className?: string;
}

// 使用类型断言修复组件类型
const SafeResponsiveContainer = asJsxComponent(ResponsiveContainer);
const SafeComposedChart = asJsxComponent(ComposedChart);
const SafeXAxis = asJsxComponent(XAxis);
const SafeYAxis = asJsxComponent(YAxis);
const SafeCartesianGrid = asJsxComponent(CartesianGrid);
const SafeTooltip = asJsxComponent(Tooltip);
const SafeLegend = asJsxComponent(Legend);
const SafeBar = asJsxComponent(Bar);
const SafeLine = asJsxComponent(Line);
const SafeBrush = asJsxComponent(Brush);

/**
 * 地址分析图表组件 - 使用 Recharts 实现交互式图表
 */
const AddressAnalysisChart: React.FC<AddressAnalysisChartProps> = ({ 
  data, 
  className = '' 
}) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<ChartType>('activity');
  
  // 格式化日期显示
  const formatDate = useCallback((dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MM/dd');
    } catch (e) {
      return dateStr;
    }
  }, []);
  
  // 格式化工具提示内容
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
          <p className="font-medium text-gray-800">{formatDate(label)}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700">{entry.name}: </span>
                <span className="font-medium ml-1">
                  {entry.name === 'volume' ? `${entry.value} ETH` : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }, [formatDate]);
  
  // 处理图表类型变化
  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type);
  }, []);
  
  // 根据图表类型渲染不同的图表
  const renderChart = useCallback(() => {
    switch (chartType) {
      case 'activity':
        return (
          <SafeComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <SafeCartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <SafeXAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <SafeYAxis 
              yAxisId="left"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: t('charts.addressAnalysis.transactionCount'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <SafeYAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: t('charts.addressAnalysis.avgValue'), angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <SafeTooltip content={CustomTooltip} />
            <SafeLegend />
            <SafeBar 
              yAxisId="left"
              dataKey="transactionCount" 
              name={t('charts.addressAnalysis.transactionCount')}
              fill="#3b82f6" 
              barSize={20} 
            />
            <SafeLine 
              yAxisId="right"
              type="monotone" 
              dataKey="avgValue" 
              name={t('charts.addressAnalysis.avgValue')}
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <SafeBrush 
              dataKey="date" 
              height={30} 
              stroke="#8884d8"
              tickFormatter={formatDate}
            />
          </SafeComposedChart>
        );
      
      case 'volume':
        return (
          <SafeComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <SafeCartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <SafeXAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <SafeYAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: t('charts.addressAnalysis.volume'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <SafeTooltip content={CustomTooltip} />
            <SafeLegend />
            <SafeBar 
              dataKey="volume" 
              name={t('charts.addressAnalysis.volume')}
              fill="#8b5cf6" 
              barSize={20} 
            />
            <SafeBrush 
              dataKey="date" 
              height={30} 
              stroke="#8884d8"
              tickFormatter={formatDate}
            />
          </SafeComposedChart>
        );
      
      case 'risk':
        return (
          <SafeComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <SafeCartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <SafeXAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <SafeYAxis 
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: t('charts.addressAnalysis.riskScore'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <SafeYAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: t('charts.addressAnalysis.transactionCount'), angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <SafeTooltip content={CustomTooltip} />
            <SafeLegend />
            <SafeLine 
              yAxisId="left"
              type="monotone" 
              dataKey="riskScore" 
              name={t('charts.addressAnalysis.riskScore')}
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <SafeBar 
              yAxisId="right"
              dataKey="transactionCount" 
              name={t('charts.addressAnalysis.transactionCount')}
              fill="#3b82f6" 
              barSize={20} 
              opacity={0.6}
            />
            <SafeBrush 
              dataKey="date" 
              height={30} 
              stroke="#8884d8"
              tickFormatter={formatDate}
            />
          </SafeComposedChart>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">{t('charts.addressAnalysis.noData')}</p>
          </div>
        );
    }
  }, [chartType, data, formatDate, t, CustomTooltip]);
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {t('charts.addressAnalysis.title')}
        </h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'activity'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => handleChartTypeChange('activity')}
          >
            {t('charts.addressAnalysis.activity')}
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'volume'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => handleChartTypeChange('volume')}
          >
            {t('charts.addressAnalysis.volume')}
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'risk'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => handleChartTypeChange('risk')}
          >
            {t('charts.addressAnalysis.risk')}
          </button>
        </div>
      </div>
      
      <div className="h-80">
        <SafeResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </SafeResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>{t('charts.addressAnalysis.instructions')}</p>
      </div>
    </div>
  );
};

export default AddressAnalysisChart; 