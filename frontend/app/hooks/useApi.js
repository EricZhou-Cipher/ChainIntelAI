'use client';

import { useState, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';

// API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * 自定义Hook，用于处理API请求
 * @returns {Object} 包含fetchData, postData, putData, deleteData方法的对象
 */
export function useApi() {
  const { addNotification, setLoading, setError } = useApp();
  const [data, setData] = useState(null);

  /**
   * 处理API响应
   * @param {Response} response - Fetch API响应对象
   * @param {string} endpoint - API端点
   * @returns {Promise<any>} 解析后的响应数据
   */
  const handleResponse = async (response, endpoint) => {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      const errorMessage = isJson && errorData.message 
        ? errorData.message 
        : `请求失败: ${response.status} ${response.statusText}`;
      
      throw new Error(errorMessage);
    }
    
    return isJson ? await response.json() : await response.text();
  };

  /**
   * 执行API请求
   * @param {string} endpoint - API端点
   * @param {Object} options - Fetch API选项
   * @param {string} loadingKey - 加载状态的键
   * @param {string} errorKey - 错误状态的键
   * @returns {Promise<any>} 解析后的响应数据
   */
  const executeRequest = useCallback(async (endpoint, options, loadingKey, errorKey) => {
    setLoading(loadingKey, true);
    setError(errorKey, null);
    
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      const result = await handleResponse(response, endpoint);
      setData(result);
      return result;
    } catch (error) {
      setError(errorKey, error.message);
      addNotification({
        type: 'error',
        title: '请求错误',
        message: error.message,
      });
      throw error;
    } finally {
      setLoading(loadingKey, false);
    }
  }, [addNotification, setLoading, setError]);

  /**
   * 获取数据
   * @param {string} endpoint - API端点
   * @param {Object} options - 额外的Fetch API选项
   * @param {string} loadingKey - 加载状态的键
   * @param {string} errorKey - 错误状态的键
   * @returns {Promise<any>} 解析后的响应数据
   */
  const fetchData = useCallback((endpoint, options = {}, loadingKey = 'general', errorKey = 'general') => {
    return executeRequest(endpoint, { method: 'GET', ...options }, loadingKey, errorKey);
  }, [executeRequest]);

  /**
   * 发送POST请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 要发送的数据
   * @param {Object} options - 额外的Fetch API选项
   * @param {string} loadingKey - 加载状态的键
   * @param {string} errorKey - 错误状态的键
   * @returns {Promise<any>} 解析后的响应数据
   */
  const postData = useCallback((endpoint, data, options = {}, loadingKey = 'general', errorKey = 'general') => {
    return executeRequest(
      endpoint, 
      { 
        method: 'POST', 
        body: JSON.stringify(data), 
        ...options 
      }, 
      loadingKey, 
      errorKey
    );
  }, [executeRequest]);

  /**
   * 发送PUT请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 要发送的数据
   * @param {Object} options - 额外的Fetch API选项
   * @param {string} loadingKey - 加载状态的键
   * @param {string} errorKey - 错误状态的键
   * @returns {Promise<any>} 解析后的响应数据
   */
  const putData = useCallback((endpoint, data, options = {}, loadingKey = 'general', errorKey = 'general') => {
    return executeRequest(
      endpoint, 
      { 
        method: 'PUT', 
        body: JSON.stringify(data), 
        ...options 
      }, 
      loadingKey, 
      errorKey
    );
  }, [executeRequest]);

  /**
   * 发送DELETE请求
   * @param {string} endpoint - API端点
   * @param {Object} options - 额外的Fetch API选项
   * @param {string} loadingKey - 加载状态的键
   * @param {string} errorKey - 错误状态的键
   * @returns {Promise<any>} 解析后的响应数据
   */
  const deleteData = useCallback((endpoint, options = {}, loadingKey = 'general', errorKey = 'general') => {
    return executeRequest(endpoint, { method: 'DELETE', ...options }, loadingKey, errorKey);
  }, [executeRequest]);

  return {
    data,
    fetchData,
    postData,
    putData,
    deleteData
  };
} 