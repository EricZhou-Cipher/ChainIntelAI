"use client";

import { motion } from 'framer-motion';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  ClockIcon,
  BanknotesIcon,
  ShieldExclamationIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

/**
 * 统计卡片组件
 * @param {Object} props - 组件属性
 * @param {string} props.title - 卡片标题
 * @param {string|number} props.value - 卡片值
 * @param {string} props.icon - 图标类型 (transaction, alert, clock, address)
 * @param {string} props.trend - 趋势方向 (up, down, neutral)
 * @param {string} props.trendValue - 趋势值
 * @param {string} props.className - 额外的CSS类名
 * @returns {JSX.Element} 统计卡片组件
 */
export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend = 'neutral', 
  trendValue,
  className = '' 
}) {
  // 获取图标组件
  const getIcon = () => {
    switch (icon) {
      case 'transaction':
        return <BanknotesIcon className="h-6 w-6" />;
      case 'alert':
        return <ShieldExclamationIcon className="h-6 w-6" />;
      case 'clock':
        return <ClockIcon className="h-6 w-6" />;
      case 'address':
        return <UserGroupIcon className="h-6 w-6" />;
      default:
        return null;
    }
  };

  // 获取趋势图标和样式
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <ArrowUpIcon className="h-4 w-4" />;
    } else if (trend === 'down') {
      return <ArrowDownIcon className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <motion.div 
      className={`rounded-xl p-6 shadow-custom ${className}`}
      whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.15)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          
          {trendValue && (
            <div className={`flex items-center mt-2 text-xs font-medium ${
              trend === 'up' ? 'text-green-100' : 
              trend === 'down' ? 'text-red-100' : 
              'text-gray-100'
            }`}>
              {getTrendIcon()}
              <span className="ml-1">{trendValue} 相比昨日</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-full bg-white/20">
          {getIcon()}
        </div>
      </div>
    </motion.div>
  );
} 