import React from 'react';
import Link from 'next/link';

// 简化版网络组件 (使用纯静态HTML和CSS)
const SimpleNetworkView = ({
  nodes,
  links
}: {
  nodes: Array<any>;
  links: Array<any>;
}) => {
  return (
    <div className="h-64 bg-gray-100 rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">简化网络视图</h3>
        <div className="text-sm text-gray-500">
          {nodes.length} 个节点 • {links.length} 个连接
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 text-sm font-medium">活跃节点</div>
          <div className="space-y-2">
            {nodes.slice(0, 3).map(node => (
              <div key={node.id} className="flex items-center p-2 bg-white rounded shadow-sm">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${
                    node.type === 'exchange' ? 'bg-blue-500' : 
                    node.type === 'contract' ? 'bg-purple-500' : 
                    node.riskLevel === 'high' ? 'bg-red-500' :
                    node.riskLevel === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                />
                <span className="text-sm">{node.name || node.id}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="mb-2 text-sm font-medium">最近交易</div>
          <div className="space-y-2">
            {links.slice(0, 3).map((link, index) => {
              const source = nodes.find(n => n.id === link.source) || { name: link.source };
              const target = nodes.find(n => n.id === link.target) || { name: link.target };
              
              return (
                <div key={index} className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center text-xs">
                    <span className="text-gray-700">{source.name}</span>
                    <svg className="w-4 h-4 mx-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-gray-700">{target.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">值: {link.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-x-2 text-xs text-center">
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mb-1"></div>
          <span>交易所</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mb-1"></div>
          <span>智能合约</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mb-1"></div>
          <span>高风险地址</span>
        </div>
      </div>
    </div>
  );
};

// 生成模拟数据
function generateNetworkData() {
  // 生成节点
  const nodes = [
    { id: '1', name: '交易所A', type: 'exchange', riskLevel: 'low' },
    { id: '2', name: '智能合约B', type: 'contract', riskLevel: 'medium' },
    { id: '3', name: '钱包C', type: 'wallet', riskLevel: 'high' },
    { id: '4', name: '地址D', type: 'address', riskLevel: 'low' },
    { id: '5', name: '地址E', type: 'address', riskLevel: 'medium' },
  ];
  
  // 生成连接
  const links = [
    { source: '1', target: '2', value: 5 },
    { source: '2', target: '3', value: 3 },
    { source: '1', target: '4', value: 2 },
    { source: '3', target: '5', value: 1 },
    { source: '4', target: '5', value: 1 },
  ];
  
  return { nodes, links };
}

// 静态风险分布图表组件
const StaticRiskDistribution = () => {
  return (
    <div className="h-64 bg-gray-100 rounded p-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">风险分布统计</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-sm text-gray-500">低风险</div>
          <div className="mt-1 text-xl font-semibold text-green-500">35</div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-sm text-gray-500">中风险</div>
          <div className="mt-1 text-xl font-semibold text-yellow-500">18</div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-sm text-gray-500">高风险</div>
          <div className="mt-1 text-xl font-semibold text-red-500">7</div>
        </div>
      </div>
      
      <div className="mt-4 bg-white p-3 rounded shadow-sm">
        <div className="text-sm font-medium mb-2">风险趋势</div>
        <div className="relative h-8">
          <div className="absolute inset-0 flex">
            <div className="h-full bg-green-100 flex-grow-[35]"></div>
            <div className="h-full bg-yellow-100 flex-grow-[18]"></div>
            <div className="h-full bg-red-100 flex-grow-[7]"></div>
          </div>
          <div className="absolute inset-0 flex">
            <div className="h-full bg-green-400 w-[35%] opacity-50"></div>
            <div className="h-full bg-yellow-400 w-[18%] opacity-50"></div>
            <div className="h-full bg-red-400 w-[7%] opacity-50"></div>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>上周: 45 低 / 21 中 / 9 高</span>
          <span>总计: 60 个地址</span>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  // 生成静态网络数据
  const networkData = generateNetworkData();
  
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ChainIntelAI 仪表盘</h1>
          <p className="text-gray-600 mt-2">区块链数据智能分析平台</p>
        </header>

        {/* 系统状态面板 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">系统状态</h2>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2 bg-yellow-500"></span>
              <span>检查中...</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">MongoDB</h2>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2 bg-yellow-500"></span>
              <span>检查中...</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Redis</h2>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2 bg-yellow-500"></span>
              <span>检查中...</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">今日分析</h2>
            <div className="text-2xl font-bold">87</div>
            <div className="text-sm text-gray-500">已分析交易</div>
          </div>
        </div>

        {/* 主要功能区域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/addresses" className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-blue-600">地址分析</h2>
            <p className="text-gray-600 mb-4">分析区块链地址的交易历史、关联地址和风险评估。</p>
            <div className="text-blue-500">查看详情 →</div>
          </Link>
          
          <Link href="/transactions" className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-green-600">交易监控</h2>
            <p className="text-gray-600 mb-4">监控实时交易，识别可疑活动和异常模式。</p>
            <div className="text-green-500">查看详情 →</div>
          </Link>
          
          <Link href="/alerts" className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-red-600">风险警报</h2>
            <p className="text-gray-600 mb-4">接收有关高风险活动的实时警报和通知。</p>
            <div className="text-red-500">查看详情 →</div>
          </Link>
        </div>

        {/* 分析图表区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">风险分布</h2>
            {/* 使用静态风险分布图表 */}
            <StaticRiskDistribution />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">实时网络活动</h2>
            {/* 直接渲染简化版网络视图（服务器端渲染） */}
            <SimpleNetworkView 
              nodes={networkData.nodes}
              links={networkData.links}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 