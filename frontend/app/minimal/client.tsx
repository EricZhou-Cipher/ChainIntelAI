"use client";

import React, { useState } from 'react';

export default function ClientPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">客户端组件页面</h2>
      <p className="mb-4">这是一个使用React hooks的客户端组件页面。</p>
      
      <div className="mb-4">
        <p className="text-lg">当前计数: <span className="font-bold">{count}</span></p>
        <button 
          onClick={() => setCount(count + 1)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          增加计数
        </button>
      </div>
    </div>
  );
} 