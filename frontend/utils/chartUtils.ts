/**
 * 图表工具函数，用于修复 Recharts 组件的类型问题
 */

import React from 'react';

/**
 * 允许组件作为 JSX 元素使用的类型断言函数
 * 这是一个解决方案，用于处理 Recharts 组件的类型问题
 */
export function asJsxComponent<T>(component: T): React.ComponentType<any> {
  return component as unknown as React.ComponentType<any>;
} 