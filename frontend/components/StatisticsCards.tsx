import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// 统计数据类型
interface StatData {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const StatisticsCards: React.FC = () => {
  const { t } = useTranslation();
  
  // 使用useMemo缓存统计数据计算结果
  const stats: StatData[] = useMemo(() => [
    {
      title: '监控地址',
      value: '12,345',
      change: 5.2,
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      title: '今日交易',
      value: '1,234',
      change: 2.1,
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      title: '风险警报',
      value: '23',
      change: -8.4,
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: 'bg-red-500'
    },
    {
      title: '资金流出',
      value: '$2.3M',
      change: 12.5,
      icon: <ArrowTrendingDownIcon className="h-6 w-6" />,
      color: 'bg-purple-500'
    }
  ], []);

  // 容器动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // 卡片动画变体
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-lg shadow p-5"
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <div className="flex items-center mt-2">
                <span className={`text-sm ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </span>
                <span className="text-gray-400 text-xs ml-1">vs 上月</span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${stat.color} text-white`}>
              {stat.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default React.memo(StatisticsCards); 