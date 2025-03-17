'use client';

import { motion } from 'framer-motion';

/**
 * 按钮组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 按钮内容
 * @param {Function} props.onClick - 点击事件处理函数
 * @param {string} props.variant - 按钮变体 (primary, secondary, danger, outline, ghost)
 * @param {string} props.size - 按钮尺寸 (sm, md, lg)
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.disabled - 是否禁用
 * @param {boolean} props.fullWidth - 是否占满宽度
 * @param {string} props.type - 按钮类型 (button, submit, reset)
 * @returns {JSX.Element} 按钮组件
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button',
  ...props
}) {
  // 基础样式
  const baseStyle = "font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // 变体样式
  const variantStyles = {
    primary: "bg-primary hover:bg-primary/90 text-white focus:ring-primary/50",
    secondary: "bg-secondary hover:bg-secondary/90 text-white focus:ring-secondary/50",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary/50",
    ghost: "bg-transparent text-primary hover:bg-primary/10 focus:ring-primary/50",
    accent: "bg-accent hover:bg-accent/90 text-white focus:ring-accent/50",
  };
  
  // 尺寸样式
  const sizeStyles = {
    sm: "text-sm px-3 py-1.5 rounded-lg",
    md: "text-base px-4 py-2 rounded-xl",
    lg: "text-lg px-6 py-3 rounded-xl",
  };
  
  // 禁用样式
  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95";
  
  // 宽度样式
  const widthStyle = fullWidth ? "w-full" : "";
  
  // 组合所有样式
  const buttonStyle = `${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyle} ${widthStyle} ${className}`;
  
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      type={type}
      className={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
} 