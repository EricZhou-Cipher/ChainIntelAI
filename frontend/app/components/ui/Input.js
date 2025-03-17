'use client';

/**
 * 输入框组件
 * @param {Object} props - 组件属性
 * @param {string} props.type - 输入框类型
 * @param {string} props.placeholder - 占位符文本
 * @param {string} props.value - 输入框值
 * @param {Function} props.onChange - 值变化事件处理函数
 * @param {string} props.label - 标签文本
 * @param {string} props.error - 错误信息
 * @param {string} props.size - 输入框尺寸 (sm, md, lg)
 * @param {boolean} props.fullWidth - 是否占满宽度
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.disabled - 是否禁用
 * @returns {JSX.Element} 输入框组件
 */
export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) {
  // 基础样式
  const baseStyle = "border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary";
  
  // 尺寸样式
  const sizeStyles = {
    sm: "text-sm px-3 py-1.5 rounded-lg",
    md: "text-base px-4 py-2 rounded-xl",
    lg: "text-lg px-5 py-3 rounded-xl",
  };
  
  // 错误样式
  const errorStyle = error ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : "border-gray-300 dark:border-gray-600";
  
  // 禁用样式
  const disabledStyle = disabled ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60" : "bg-white dark:bg-gray-700";
  
  // 宽度样式
  const widthStyle = fullWidth ? "w-full" : "";
  
  // 组合所有样式
  const inputStyle = `${baseStyle} ${sizeStyles[size]} ${errorStyle} ${disabledStyle} ${widthStyle} ${className}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={inputStyle}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 