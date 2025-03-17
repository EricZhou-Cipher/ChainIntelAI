import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInfiniteScroll } from '../hooks/useIntersectionObserver';
import RiskBadge, { RiskLevel } from './RiskBadge';

// 地址数据类型
interface AddressData {
  id: string;
  address: string;
  label?: string;
  balance: string;
  txCount: number;
  riskLevel: RiskLevel;
  lastActivity: number;
}

// 模拟数据生成函数
const generateMockAddresses = (page: number, limit: number): AddressData[] => {
  const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
  
  return Array.from({ length: limit }, (_, i) => {
    const index = page * limit + i;
    return {
      id: `addr-${index}`,
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      label: index % 3 === 0 ? `标记地址 ${index}` : undefined,
      balance: `${(Math.random() * 100).toFixed(4)} ETH`,
      txCount: Math.floor(Math.random() * 1000),
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      lastActivity: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
    };
  });
};

// 格式化地址显示
const formatAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// 格式化日期显示
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN');
};

const InfiniteAddressList: React.FC = () => {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // 使用useMemo缓存每页数量
  const limit = useMemo(() => 10, []);
  
  // 加载更多数据的回调函数
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      const newAddresses = generateMockAddresses(page, limit);
      setAddresses(prev => [...prev, ...newAddresses]);
      setPage(prev => prev + 1);
      
      // 模拟数据加载完毕的情况
      if (page >= 5) {
        setHasMore(false);
      }
      
      setLoading(false);
    }, 800);
  }, [loading, hasMore, page, limit]);
  
  // 初始加载
  React.useEffect(() => {
    loadMore();
  }, []);
  
  // 使用自定义Hook实现无限滚动
  const loaderRef = useInfiniteScroll(loadMore);
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
        <div>地址</div>
        <div>标签</div>
        <div>余额</div>
        <div>交易数</div>
        <div>风险等级</div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {addresses.map((addr, index) => (
          <motion.div 
            key={addr.id}
            className="grid grid-cols-5 gap-4 px-6 py-4 hover:bg-gray-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index % limit * 0.05 }}
          >
            <div className="text-blue-600 font-mono text-sm truncate">
              {formatAddress(addr.address)}
            </div>
            <div className="text-gray-600 truncate">
              {addr.label || '-'}
            </div>
            <div>{addr.balance}</div>
            <div>{addr.txCount.toLocaleString()}</div>
            <div className="flex items-center">
              <RiskBadge level={addr.riskLevel} />
              <span className="text-xs text-gray-500 ml-2">
                {formatDate(addr.lastActivity)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* 加载更多指示器 */}
      {hasMore && (
        <div 
          ref={loaderRef} 
          className="py-4 text-center text-gray-500"
        >
          {loading ? (
            <div className="flex justify-center items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : (
            <span>向下滚动加载更多</span>
          )}
        </div>
      )}
      
      {/* 没有更多数据提示 */}
      {!hasMore && (
        <div className="py-4 text-center text-gray-500">
          没有更多数据了
        </div>
      )}
    </div>
  );
};

export default React.memo(InfiniteAddressList); 