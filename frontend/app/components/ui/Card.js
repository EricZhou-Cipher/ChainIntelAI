'use client';

import { motion } from 'framer-motion';

/**
 * 卡片组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 卡片内容
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.hover - 是否启用悬停动画
 * @param {boolean} props.tap - 是否启用点击动画
 * @param {Object} props.initial - 初始动画状态
 * @param {Object} props.animate - 目标动画状态
 * @param {Object} props.transition - 动画过渡配置
 * @returns {JSX.Element} 卡片组件
 */
export default function Card({
  children,
  className = '',
  hover = true,
  tap = true,
  initial,
  animate,
  transition,
  ...props
}) {
  // 基础样式
  const baseStyle = "bg-white dark:bg-darkBackground shadow-custom p-6 rounded-xl";
  
  // 组合所有样式
  const cardStyle = `${baseStyle} ${className}`;
  
  // 动画配置
  const animations = {
    whileHover: hover ? { scale: 1.02, boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.12)' } : undefined,
    whileTap: tap ? { scale: 0.98 } : undefined,
    initial: initial,
    animate: animate,
    transition: transition || { type: 'spring', stiffness: 300, damping: 20 }
  };
  
  return (
    <motion.div
      className={cardStyle}
      {...animations}
      {...props}
    >
      {children}
    </motion.div>
  );
} 