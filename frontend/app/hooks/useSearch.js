'use client';

import { useState } from 'react';

/**
 * 搜索 hook，用于处理搜索功能
 * @param {Function} searchFunction 搜索函数
 * @param {Object} initialParams 初始参数
 * @returns {Object} 搜索状态和函数
 */
export default function useSearch(searchFunction, initialParams = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 执行搜索
   * @param {string} query 搜索查询
   */
  const handleSearch = async (query) => {
    if (!query) return;
    
    setSearchQuery(query);
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchFunction({ ...initialParams, query });
      setSearchResults(results);
    } catch (err) {
      setError(err.message || '搜索失败');
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 清除搜索结果
   */
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setError(null);
  };

  return {
    searchQuery,
    searchResults,
    isLoading,
    error,
    handleSearch,
    clearSearch,
  };
} 