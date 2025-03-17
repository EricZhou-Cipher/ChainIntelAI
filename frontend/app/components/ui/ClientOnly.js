'use client';

import { useEffect, useState } from 'react';

/**
 * ClientOnly组件，用于解决Next.js中的水合问题
 * 确保组件只在客户端渲染，避免服务器端渲染与客户端渲染不一致的问题
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @param {React.ReactNode} props.fallback - 加载时显示的内容
 * @returns {JSX.Element|null} 客户端渲染的组件
 */
export default function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  // 在组件挂载后设置hasMounted为true
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 如果组件尚未挂载，返回fallback或null
  if (!hasMounted) {
    return fallback;
  }

  // 组件已挂载，返回子组件
  return children;
} 