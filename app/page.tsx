import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          ChainIntelAI - 区块链智能分析平台
        </h1>
        
        <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto">
          实时监控和分析区块链活动，智能识别潜在风险
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-blue-500 text-white font-medium">
              多链监控
            </div>
            <div className="p-4">
              <p className="text-gray-600">
                跟踪以太坊、BSC、Polygon和其他EVM兼容链上的交易
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-green-500 text-white font-medium">
              AI驱动的风险分析
            </div>
            <div className="p-4">
              <p className="text-gray-600">
                使用先进的机器学习模型检测可疑模式和潜在威胁
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
          <div className="p-4 bg-purple-500 text-white font-medium">
            实时警报
          </div>
          <div className="p-4">
            <p className="text-gray-600">
              接收高风险交易的即时通知
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-10">
          <h2 className="text-xl font-bold mb-4">技术栈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-2">前端</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>React</li>
                <li>TypeScript</li>
                <li>Next.js</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">后端</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Node.js</li>
                <li>Express</li>
                <li>MongoDB</li>
                <li>ethers.js / Web3.js</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 性能优化组件展示 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-10">
          <h2 className="text-xl font-bold mb-6">React 性能优化技术</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-blue-600">1. React.memo 优化</h3>
              <p className="text-gray-600">
                使用React.memo包裹组件，避免不必要的重新渲染。当组件的props没有变化时，React会跳过渲染过程。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-green-600">2. useCallback和useMemo</h3>
              <p className="text-gray-600">
                使用useCallback缓存函数引用，使用useMemo缓存计算结果，减少不必要的重新计算和渲染。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-purple-600">3. 虚拟化列表</h3>
              <p className="text-gray-600">
                对于长列表，只渲染可视区域内的元素，大幅提高性能。适用于展示大量数据的场景。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-red-600">4. 懒加载和代码分割</h3>
              <p className="text-gray-600">
                使用React.lazy和Suspense实现组件的懒加载，减少初始加载时间，提高应用响应速度。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-yellow-600">5. 防抖和节流</h3>
              <p className="text-gray-600">
                对于频繁触发的事件（如滚动、输入），使用防抖和节流技术限制处理函数的执行频率。
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 