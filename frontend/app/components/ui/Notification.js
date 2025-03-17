'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/solid';

/**
 * 通知组件
 * @param {Object} props - 组件属性
 * @param {string} props.id - 通知ID
 * @param {string} props.type - 通知类型 (success, error, warning, info)
 * @param {string} props.title - 通知标题
 * @param {string} props.message - 通知消息
 * @param {number} props.duration - 通知显示时长（毫秒）
 * @param {Function} props.onClose - 关闭通知的回调函数
 * @returns {JSX.Element} 通知组件
 */
export default function Notification({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState(null);

  // 根据类型获取图标和样式
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          textColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: <ExclamationCircleIcon className="h-6 w-6 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-800'
        };
      case 'info':
      default:
        return {
          icon: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-800'
        };
    }
  };

  const { icon, bgColor, borderColor, textColor } = getTypeConfig();

  // 关闭通知
  const handleClose = () => {
    setIsVisible(false);
    if (intervalId) {
      clearInterval(intervalId);
    }
    setTimeout(() => {
      onClose(id);
    }, 300); // 等待淡出动画完成
  };

  // 设置自动关闭计时器
  useEffect(() => {
    if (duration > 0) {
      // 计算进度条更新间隔
      const interval = 10; // 每10毫秒更新一次
      const steps = duration / interval;
      const decrementPerStep = 100 / steps;

      const id = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress - decrementPerStep;
          if (newProgress <= 0) {
            clearInterval(id);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      setIntervalId(id);

      return () => {
        clearInterval(id);
      };
    }
  }, [duration]);

  return (
    <div 
      className={`max-w-sm w-full ${bgColor} border-l-4 ${borderColor} rounded-md shadow-md transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {title && <p className={`text-sm font-medium ${textColor}`}>{title}</p>}
            {message && <p className="mt-1 text-sm text-gray-600">{message}</p>}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">关闭</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {/* 进度条 */}
      <div 
        className={`h-1 rounded-b-md transition-all duration-100 ease-linear ${borderColor.replace('border', 'bg')}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
} 