"use client";

import React from 'react';

export default function SimpleTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">简单测试页面</h1>
      <p className="mb-4">这是一个简单的测试页面，用于验证Next.js配置是否正常工作。</p>
      <button 
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        onClick={() => alert('按钮点击事件正常工作！')}
      >
        点击测试
      </button>
    </div>
  );
} 