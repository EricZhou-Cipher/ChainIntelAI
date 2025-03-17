/**
 * 第三方库类型声明文件
 * 解决与 Recharts 相关的类型错误
 */

// 声明 Recharts 模块
declare module 'recharts' {
  import * as React from 'react';

  // 基本图表组件
  export const AreaChart: React.ComponentType<any>;
  export const BarChart: React.ComponentType<any>;
  export const LineChart: React.ComponentType<any>;
  export const ComposedChart: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const RadarChart: React.ComponentType<any>;
  export const RadialBarChart: React.ComponentType<any>;
  export const ScatterChart: React.ComponentType<any>;
  export const Treemap: React.ComponentType<any>;
  export const Sankey: React.ComponentType<any>;
  export const SunburstChart: React.ComponentType<any>;

  // 坐标轴组件
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const ZAxis: React.ComponentType<any>;
  export const CartesianGrid: React.ComponentType<any>;
  export const CartesianAxis: React.ComponentType<any>;
  export const PolarGrid: React.ComponentType<any>;
  export const PolarAngleAxis: React.ComponentType<any>;
  export const PolarRadiusAxis: React.ComponentType<any>;

  // 图形组件
  export const Area: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export const Scatter: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Radar: React.ComponentType<any>;
  export const RadialBar: React.ComponentType<any>;

  // 特殊组件
  export const Brush: React.ComponentType<any>;
  export const ReferenceLine: React.ComponentType<any>;
  export const ReferenceDot: React.ComponentType<any>;
  export const ReferenceArea: React.ComponentType<any>;
  export const ErrorBar: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const ResponsiveContainer: React.ComponentType<any>;
  export const Label: React.ComponentType<any>;
  export const LabelList: React.ComponentType<any>;

  // 图形
  export const Rectangle: React.ComponentType<any>;
  export const Polygon: React.ComponentType<any>;
  export const Dot: React.ComponentType<any>;
  export const Cross: React.ComponentType<any>;
  export const Sector: React.ComponentType<any>;
  export const Curve: React.ComponentType<any>;
  export const Symbols: React.ComponentType<any>;
  export const Trapezoid: React.ComponentType<any>;
} 