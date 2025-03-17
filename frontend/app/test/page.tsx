"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TestPage() {
  const [backendStatus, setBackendStatus] = useState<string>('正在检查...');
  const [mongoStatus, setMongoStatus] = useState<string>('正在检查...');
  const [redisStatus, setRedisStatus] = useState<string>('正在检查...');
  const [frontendPort, setFrontendPort] = useState<string>('3000');

  useEffect(() => {
    // 获取当前前端端口
    setFrontendPort(window.location.port);

    // 检查后端健康状态
    fetch('http://localhost:3001/health')
      .then(response => {
        if (!response.ok) {
          throw new Error(`状态码 ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setBackendStatus(`正常 (${data.timestamp})`);
      })
      .catch(error => {
        setBackendStatus(`错误: ${error.message}`);
      });
    
    // 检查数据库状态
    fetch('http://localhost:3001/api/status')
      .then(response => {
        if (!response.ok) {
          throw new Error(`状态码 ${response.status}`);
        }
        return response.json();
      })
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
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">ChainIntelAI 系统状态</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <h2 className="text-xl font-semibold mb-2">前端服务</h2>
            <p className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500"></span>
              状态: 正常运行 (端口: {frontendPort})
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">连接信息</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>前端运行在: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:{frontendPort}</code></li>
                <li>后端运行在: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3001</code></li>
                <li>MongoDB 连接: <code className="bg-gray-100 px-2 py-1 rounded text-xs">mongodb://localhost:27017/chainintelai</code></li>
                <li>Redis 连接: <code className="bg-gray-100 px-2 py-1 rounded">redis://localhost:6379</code></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">可用功能</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>区块链数据分析
                  <ul className="list-circle pl-5 mt-1 space-y-1 text-sm">
                    <li>地址分析</li>
                    <li>交易流程图</li>
                    <li>风险趋势图</li>
                    <li>相似地址分析</li>
                  </ul>
                </li>
                <li>风险监控
                  <ul className="list-circle pl-5 mt-1 space-y-1 text-sm">
                    <li>风险警报</li>
                    <li>风险标识</li>
                    <li>交易监控</li>
                  </ul>
                </li>
                <li>优化组件
                  <ul className="list-circle pl-5 mt-1 space-y-1 text-sm">
                    <li>全局搜索</li>
                    <li>语言切换</li>
                    <li>性能监控</li>
                    <li>懒加载图片</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-6">
          <h2 className="text-2xl font-semibold mb-4">功能导航</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold text-blue-700">首页</h3>
              <p className="text-sm text-gray-600 mt-1">React性能优化演示</p>
            </Link>
            
            <Link href="/dashboard" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold text-green-700">仪表盘</h3>
              <p className="text-sm text-gray-600 mt-1">系统概览和性能指标</p>
            </Link>
            
            <Link href="/network-analysis" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold text-purple-700">网络分析</h3>
              <p className="text-sm text-gray-600 mt-1">区块链网络可视化</p>
            </Link>
            
            <Link href="/addresses" className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold text-yellow-700">地址分析</h3>
              <p className="text-sm text-gray-600 mt-1">区块链地址详情</p>
            </Link>
            
            <Link href="/transactions" className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold text-red-700">交易监控</h3>
              <p className="text-sm text-gray-600 mt-1">交易历史和分析</p>
            </Link>
            
            <Link href="/alerts" className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <h3 className="text-lg font-semibold text-orange-700">风险警报</h3>
              <p className="text-sm text-gray-600 mt-1">安全事件和风险提醒</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 