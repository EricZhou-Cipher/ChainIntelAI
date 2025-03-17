'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function GlobalSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 处理搜索
  const handleSearch = () => {
    if (!query.trim()) return;
    
    // 根据输入内容判断是地址还是交易哈希
    if (query.startsWith('0x') && query.length >= 40) {
      // 如果以0x开头且长度大于等于40，认为是地址
      router.push(`/addresses?address=${query}`);
    } else {
      // 否则认为是交易哈希
      router.push(`/transactions?hash=${query}`);
    }
    
    // 搜索后收起搜索框
    setIsExpanded(false);
    setQuery('');
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  // 点击外部区域关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 当展开时自动聚焦输入框
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="relative" ref={inputRef}>
      {isExpanded ? (
        <div className="absolute right-0 top-0 flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('globalSearch.placeholder') || '搜索地址或交易哈希...'}
            className="w-64 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-lg transition-colors duration-200"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={t('globalSearch.label') || '搜索'}
        >
          <MagnifyingGlassIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
} 