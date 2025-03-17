"use client";

import React, { useState } from 'react';

export default function ApiTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 调用真实API端点
      const response = await fetch('/api/test');
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError("请求失败: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const postData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 发送POST请求到API端点
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testData: '这是一个测试数据',
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError("请求失败: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">API测试页面</h2>
      <p className="mb-4">点击下方按钮测试API请求</p>
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={fetchData}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? '加载中...' : 'GET请求'}
        </button>
        
        <button
          onClick={postData}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {loading ? '加载中...' : 'POST请求'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {data && !error && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
          <h3 className="font-bold text-green-800">响应数据:</h3>
          <pre className="mt-2 bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 