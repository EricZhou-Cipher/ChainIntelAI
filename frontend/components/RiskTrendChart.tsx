import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Brush
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { asJsxComponent } from '../utils/chartUtils';

// 定义组件属性类型
const timeRangeOptions = ['7d', '30d', '90d', '1y'];

// 风险趋势数据类型
export interface RiskTrendData {
  date: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

interface RiskTrendChartProps {
  data: RiskTrendData[];
  timeRange?: string;
  className?: string;
}

// 使用类型断言修复组件类型
const SafeResponsiveContainer = asJsxComponent(ResponsiveContainer);
const SafeAreaChart = asJsxComponent(AreaChart);
const SafeXAxis = asJsxComponent(XAxis);
const SafeYAxis = asJsxComponent(YAxis);
const SafeTooltip = asJsxComponent(Tooltip);
const SafeLegend = asJsxComponent(Legend);
const SafeArea = asJsxComponent(Area);
const SafeBrush = asJsxComponent(Brush);

/**
 * 风险趋势图表组件 - 使用 Recharts 实现交互式图表
 */
const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ 
  data, 
  timeRange = '7d',
  className = '' 
}) => {
  const { t } = useTranslation();
  const [activeTimeRange, setActiveTimeRange] = useState(timeRange);
  
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
                <span className="font-medium ml-1">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }, [formatDate]);

  // 处理时间范围变化
  const handleTimeRangeChange = useCallback((range: string) => {
    setActiveTimeRange(range);
    // 在实际应用中，这里可能需要调用API获取不同时间范围的数据
    console.log(`切换到${range}时间范围`);
  }, []);

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {t('dashboardPage.charts.riskTrend')}
        </h2>
        <div className="flex space-x-2">
          {timeRangeOptions.map(range => (
            <button
              key={range}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTimeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => handleTimeRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <SafeResponsiveContainer width="100%" height="100%">
          <SafeAreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorMediumRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorLowRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <SafeXAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <SafeYAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <SafeTooltip content={CustomTooltip} />
            <SafeLegend
              wrapperStyle={{ bottom: 0, left: 25, fontSize: 12 }}
              iconSize={10}
              iconType="circle"
            />
            <SafeArea
              type="monotone"
              dataKey="highRisk"
              name="highRisk"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorHighRisk)"
              activeDot={{ r: 6 }}
            />
            <SafeArea
              type="monotone"
              dataKey="mediumRisk"
              name="mediumRisk"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorMediumRisk)"
              activeDot={{ r: 6 }}
            />
            <SafeArea
              type="monotone"
              dataKey="lowRisk"
              name="lowRisk"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorLowRisk)"
              activeDot={{ r: 6 }}
            />
            <SafeBrush 
              dataKey="date" 
              height={30} 
              stroke="#8884d8"
              tickFormatter={formatDate}
            />
          </SafeAreaChart>
        </SafeResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskTrendChart; 