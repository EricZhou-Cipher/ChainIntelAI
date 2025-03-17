'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// 创建上下文
const LocalStorageContext = createContext();

// 本地存储提供者组件
export function LocalStorageProvider({ children }) {
  // 获取本地存储中的值
  const getStorageValue = (key, defaultValue) => {
    // 在客户端环境中才能访问 localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      try {
        const initial = saved !== null ? JSON.parse(saved) : defaultValue;
        return initial;
      } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  };

  // 设置本地存储中的值
  const setStorageValue = (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
        // 触发自定义事件，以便其他组件可以监听到存储变化
        window.dispatchEvent(new Event('local-storage-change'));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // 移除本地存储中的值
  const removeStorageValue = (key) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        // 触发自定义事件
        window.dispatchEvent(new Event('local-storage-change'));
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // 清除所有本地存储
  const clearStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        // 触发自定义事件
        window.dispatchEvent(new Event('local-storage-change'));
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // 提供的值
  const value = {
    getStorageValue,
    setStorageValue,
    removeStorageValue,
    clearStorage
  };

  return (
    <LocalStorageContext.Provider value={value}>
      {children}
    </LocalStorageContext.Provider>
  );
}

// 自定义 Hook 用于访问本地存储上下文
export function useLocalStorage() {
  const context = useContext(LocalStorageContext);
  if (context === undefined) {
    throw new Error('useLocalStorage 必须在 LocalStorageProvider 内部使用');
  }
  return context;
}

// 自定义 Hook 用于管理特定键的本地存储值
export function useLocalStorageState(key, defaultValue) {
  const { getStorageValue, setStorageValue } = useLocalStorage();
  const [value, setValue] = useState(() => getStorageValue(key, defaultValue));

  // 当值变化时更新本地存储
  useEffect(() => {
    setStorageValue(key, value);
  }, [key, value, setStorageValue]);

  // 监听其他组件对同一键的更改
  useEffect(() => {
    const handleStorageChange = () => {
      setValue(getStorageValue(key, defaultValue));
    };

    window.addEventListener('local-storage-change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('local-storage-change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, getStorageValue]);

  return [value, setValue];
} 