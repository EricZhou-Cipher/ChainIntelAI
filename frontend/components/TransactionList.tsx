import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import RiskBadge, { RiskLevel } from './RiskBadge';

// 交易数据类型
interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  riskLevel: RiskLevel;
  riskScore?: number;
}

// 模拟数据获取函数
const fetchTransactions = async (): Promise<Transaction[]> => {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 模拟数据
  return [
    {
      id: 'tx1',
      from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      to: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
      amount: '1.5 ETH',
      timestamp: Date.now() - 1000 * 60 * 5, // 5分钟前
      riskLevel: 'low'
    },
    {
      id: 'tx2',
      from: '0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e',
      to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      amount: '5000 USDC',
      timestamp: Date.now() - 1000 * 60 * 15, // 15分钟前
      riskLevel: 'medium',
      riskScore: 45
    },
    {
      id: 'tx3',
      from: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      to: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      amount: '10 ETH',
      timestamp: Date.now() - 1000 * 60 * 30, // 30分钟前
      riskLevel: 'high',
      riskScore: 75
    },
    {
      id: 'tx4',
      from: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
      to: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
      amount: '50,000 USDT',
      timestamp: Date.now() - 1000 * 60 * 60, // 1小时前
      riskLevel: 'critical',
      riskScore: 95
    }
  ];
};

// 格式化地址显示
const formatAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用useCallback优化数据加载函数
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('加载交易数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // 加载状态
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-md mb-2"></div>
        ))}
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={loadTransactions}
          className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
        <div>发送方</div>
        <div>接收方</div>
        <div>金额</div>
        <div>时间</div>
        <div>风险等级</div>
      </div>
      
      <AnimatePresence>
        {transactions.map(tx => (
          <motion.div 
            key={tx.id}
            className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-blue-600 font-mono text-sm">{formatAddress(tx.from)}</div>
            <div className="text-blue-600 font-mono text-sm">{formatAddress(tx.to)}</div>
            <div>{tx.amount}</div>
            <div className="text-gray-500 text-sm">
              {format(new Date(tx.timestamp), 'HH:mm:ss')}
            </div>
            <div>
              <RiskBadge level={tx.riskLevel} score={tx.riskScore} showScore />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(TransactionList); 