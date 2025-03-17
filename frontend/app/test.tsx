"use client";

import React, { useEffect, useState } from 'react';

export default function TestPage() {
  const [backendStatus, setBackendStatus] = useState<string>('正在检查...');
  const [mongoStatus, setMongoStatus] = useState<string>('正在检查...');
  const [redisStatus, setRedisStatus] = useState<string>('正在检查...');

  useEffect(() => {
    // 检查后端健康状态
    fetch('http://localhost:3001/health')
      .then(response => response.json())
      .then(data => {
        setBackendStatus(`正常 (${data.timestamp})`);
      })
      .catch(error => {
        setBackendStatus(`错误: ${error.message}`);
      });
    
    // 检查数据库状态
    fetch('http://localhost:3001/api/status')
      .then(response => response.json())
      .then(data => {
        setMongoStatus(data.mongodb === 'connected' ? '已连接' : '未连接');
        setRedisStatus(data.redis === 'connected' ? '已连接' : '未连接');
      })
      .catch(error => {
        setMongoStatus(`检查失败: ${error.message}`);
        setRedisStatus(`检查失败: ${error.message}`);
      });
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">系统状态检查</h1>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">后端服务</h2>
            <p className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                backendStatus.includes('正常') ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              状态: {backendStatus}
            </p>
          </div>
          
          <div className="p-4 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">MongoDB</h2>
            <p className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                mongoStatus === '已连接' ? 'bg-green-500' : 
                mongoStatus === '正在检查...' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></span>
              状态: {mongoStatus}
            </p>
          </div>
          
          <div className="p-4 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">Redis</h2>
            <p className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                redisStatus === '已连接' ? 'bg-green-500' : 
                redisStatus === '正在检查...' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></span>
              状态: {redisStatus}
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">系统信息</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>前端运行在: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3002</code></li>
            <li>后端运行在: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3001</code></li>
            <li>MongoDB 连接: <code className="bg-gray-100 px-2 py-1 rounded">mongodb://localhost:27017/chainintelai</code></li>
            <li>Redis 连接: <code className="bg-gray-100 px-2 py-1 rounded">redis://localhost:6379</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 