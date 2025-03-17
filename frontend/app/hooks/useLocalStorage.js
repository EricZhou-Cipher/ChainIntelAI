'use client';

import { useState, useEffect } from 'react';

/**
 * 自定义Hook，用于管理本地存储
 * @param {string} key - 存储键名
 * @param {any} initialValue - 初始值
 * @returns {Array} [storedValue, setValue] - 存储的值和设置值的函数
 */
export function useLocalStorage(key, initialValue) {
  // 获取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // 在客户端环境中获取存储的值
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        // 如果存在则解析，否则返回初始值
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 设置值到本地存储
  const setValue = (value) => {
    try {
      // 允许值是一个函数，类似于useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // 保存到state
      setStoredValue(valueToStore);
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // 监听其他窗口的存储变化
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        try {
          setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    // 添加事件监听器
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    // 清理事件监听器
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
} 