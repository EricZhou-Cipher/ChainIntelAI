'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// 简化版交易页面
export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      const mockTransactions = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          chainId: '1',
          blockNumber: 12345678,
          from: '0xabcdef1234567890abcdef1234567890abcdef12',
          to: '0x7890abcdef1234567890abcdef1234567890abcd',
          value: '1.5',
          timestamp: 1634567890000,
          risk: { score: 0.75, level: 'medium' },
        },
        {
          hash: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
          chainId: '1',
          blockNumber: 12345679,
          from: '0xbcdef1234567890abcdef1234567890abcdef123',
          to: '0x890abcdef1234567890abcdef1234567890abcde',
          value: '0.5',
          timestamp: 1634567900000,
          risk: { score: 0.2, level: 'low' },
        },
        {
          hash: '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
          chainId: '56',
          blockNumber: 8765432,
          from: '0xcdef1234567890abcdef1234567890abcdef1234',
          to: '0x90abcdef1234567890abcdef1234567890abcdef',
          value: '10.0',
          timestamp: 1634567910000,
          risk: { score: 0.9, level: 'high' },
        },
      ];

      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 1000);
  }, []);

  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getRiskBadgeClass = level => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">交易监控</h1>
          <p className="mt-1 text-gray-600">监控和分析区块链交易</p>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="search" className="block mb-2 text-sm font-medium text-gray-700">
                交易哈希或地址
              </label>
              <input
                type="text"
                id="search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="输入交易哈希或地址..."
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
              >
                搜索
              </button>
            </div>
          </div>
        </div>

        {/* 筛选面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">筛选条件</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* 时间筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* 金额筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最小金额</label>
              <input
                type="number"
                placeholder="0.0"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大金额</label>
              <input
                type="number"
                placeholder="100.0"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* 地址筛选 */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">交易对手地址</label>
              <input
                type="text"
                placeholder="0x..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              重置
            </button>
            <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              应用
            </button>
          </div>
        </div>

        {/* 交易列表 */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">最近交易</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      交易哈希
                    </th>
                    <th scope="col" className="px-6 py-3">
                      区块链
                    </th>
                    <th scope="col" className="px-6 py-3">
                      发送方
                    </th>
                    <th scope="col" className="px-6 py-3">
                      接收方
                    </th>
                    <th scope="col" className="px-6 py-3">
                      金额
                    </th>
                    <th scope="col" className="px-6 py-3">
                      时间
                    </th>
                    <th scope="col" className="px-6 py-3">
                      风险等级
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.hash} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">
                        {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 6)}
                      </td>
                      <td className="px-6 py-4">
                        {tx.chainId === '1'
                          ? '以太坊'
                          : tx.chainId === '56'
                            ? '币安智能链'
                            : tx.chainId}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {tx.from.substring(0, 6)}...{tx.from.substring(tx.from.length - 4)}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {tx.to.substring(0, 6)}...{tx.to.substring(tx.to.length - 4)}
                      </td>
                      <td className="px-6 py-4">
                        {tx.value} {tx.chainId === '1' ? 'ETH' : tx.chainId === '56' ? 'BNB' : ''}
                      </td>
                      <td className="px-6 py-4">{formatDate(tx.timestamp)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeClass(tx.risk.level)}`}
                        >
                          {tx.risk.level === 'high'
                            ? '高风险'
                            : tx.risk.level === 'medium'
                              ? '中风险'
                              : '低风险'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
