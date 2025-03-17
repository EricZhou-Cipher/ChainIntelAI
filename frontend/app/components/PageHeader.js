'use client';

import { motion } from 'framer-motion';

/**
 * 页面标题组件
 * @param {Object} props - 组件属性
 * @param {string} props.title - 页面标题
 * @param {string} props.subtitle - 页面副标题
 * @param {React.ReactNode} props.actions - 操作按钮区域
 * @param {string} props.className - 额外的CSS类名
 * @returns {JSX.Element} 页面标题组件
 */
export default function PageHeader({ 
  title, 
  subtitle, 
  actions,
  className = '' 
}) {
  return (
    <motion.div 
      className={`mb-6 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="mt-4 md:mt-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
} 