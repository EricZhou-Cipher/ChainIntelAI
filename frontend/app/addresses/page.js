'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import RiskBadge from '../components/RiskBadge';
import AddressFormatter from '../components/AddressFormatter';
import DateFormatter from '../components/DateFormatter';
import AddressAnalysis from '../../components/AddressAnalysis';
import SimilarAddresses from '../../components/SimilarAddresses';
import { getAddressProfile } from '../utils/api';
import { AddressSkeleton } from '../../components/Skeleton';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// 动态导入图表组件
const AddressAnalysisChart = dynamic(() => import('../../components/AddressAnalysisChart'), {
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
      <div className="text-center text-gray-500">
        <p>加载地址分析图表...</p>
      </div>
    </div>
  ),
  ssr: false,
});

const TransactionFlowChart = dynamic(() => import('../../components/TransactionFlowChart'), {
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
      <div className="text-center text-gray-500">
        <p>加载交易流图表...</p>
      </div>
    </div>
  ),
  ssr: false,
});

// 动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// 地址页面组件
export default function Addresses() {
  const { t } = useTranslation();
  const [addressProfile, setAddressProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSimilarAddressesLoading, setSimilarAddressesLoading] = useState(false);
  const [similarAddresses, setSimilarAddresses] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const searchParams = useSearchParams();

  // 地址活动数据
  const [addressActivityData, setAddressActivityData] = useState([]);

  // 交易流向图数据
  const [flowChartData, setFlowChartData] = useState({
    nodes: [],
    links: [],
  });

  // 模拟地址数据
  const addressData = [
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      label: '交易所钱包',
      balance: '1,234.56',
      transactionCount: 5678,
      lastActivity: Date.now() - 3600000,
      riskLevel: 'low',
      riskScore: 15,
      tags: ['exchange', 'high-volume'],
      chains: ['Ethereum', 'Polygon', 'Arbitrum'],
      contracts: [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'USDT',
          type: 'ERC20',
          balance: '500,000',
        },
        {
          address: '0x2345678901abcdef2345678901abcdef23456789',
          name: 'USDC',
          type: 'ERC20',
          balance: '750,000',
        },
      ],
    },
    {
      address: '0xbcdef1234567890abcdef1234567890abcdef123',
      label: '智能合约',
      balance: '0.00',
      transactionCount: 12345,
      lastActivity: Date.now() - 86400000,
      riskLevel: 'medium',
      riskScore: 45,
      tags: ['contract', 'defi'],
      chains: ['Ethereum'],
      contracts: [],
    },
    {
      address: '0xcdef1234567890abcdef1234567890abcdef1234',
      label: '高风险钱包',
      balance: '98.76',
      transactionCount: 456,
      lastActivity: Date.now() - 259200000,
      riskLevel: 'high',
      riskScore: 85,
      tags: ['suspicious', 'mixer-user'],
      chains: ['Ethereum', 'BSC'],
      contracts: [
        {
          address: '0x3456789012abcdef3456789012abcdef34567890',
          name: 'WETH',
          type: 'ERC20',
          balance: '45.5',
        },
      ],
    },
  ];

  // 模拟初始加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 检查URL参数中是否有地址
  useEffect(() => {
    const address = searchParams.get('address');
    if (address) {
      handleSearch(address);
    }
  }, [searchParams]);

  // 处理地址搜索
  const handleSearch = async query => {
    if (!query) return;

    setIsLoading(true);
    setError(null);

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 800));

      // 模拟搜索结果
      const profile = addressData.find(addr => addr.address.toLowerCase() === query.toLowerCase());

      if (profile) {
        setAddressProfile(profile);

        // 模拟生成地址活动数据
        generateAddressActivityData(profile.address);

        // 模拟生成交易流向图数据
        generateFlowChartData(profile.address);

        // 模拟生成相似地址
        generateSimilarAddresses(profile.address);
      } else {
        setError('未找到匹配的地址');
      }
    } catch (err) {
      setError('搜索过程中发生错误');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成地址活动数据
  const generateAddressActivityData = address => {
    // 模拟生成地址活动数据
    const data = [];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // 随机生成交易数量和交易量
      const transactionCount = Math.floor(Math.random() * 20) + 1;
      const volume = Math.floor(Math.random() * 500) + 50;
      const avgValue = volume / transactionCount;

      // 根据交易量和交易数量计算风险分数
      const riskScore = Math.min(
        Math.floor(
          (volume > 300 ? 50 : 20) + (transactionCount > 15 ? 30 : 10) + Math.random() * 20
        ),
        100
      );

      data.push({
        date: date.toISOString().split('T')[0],
        transactionCount,
        volume,
        avgValue,
        riskScore,
      });
    }

    setAddressActivityData(data);
  };

  // 生成交易流向图数据
  const generateFlowChartData = address => {
    // 模拟生成交易流向图数据
    const nodes = [
      {
        name: `当前地址 (${address.substring(0, 6)}...)`,
        address: address,
        category: 'wallet',
        riskLevel: 'medium',
      },
      {
        name: '交易所A',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        category: 'exchange',
        riskLevel: 'low',
      },
      {
        name: '智能合约B',
        address: '0x2345678901abcdef2345678901abcdef23456789',
        category: 'contract',
        riskLevel: 'low',
      },
      {
        name: '钱包C',
        address: '0x3456789012abcdef3456789012abcdef34567890',
        category: 'wallet',
        riskLevel: 'medium',
      },
      {
        name: '未知地址D',
        address: '0x4567890123abcdef4567890123abcdef45678901',
        category: 'unknown',
        riskLevel: 'high',
      },
    ];

    const links = [
      { source: 0, target: 1, value: 100, txHash: '0x1234...abcd' },
      { source: 0, target: 2, value: 50, txHash: '0x2345...bcde' },
      { source: 2, target: 3, value: 30, txHash: '0x3456...cdef' },
      { source: 3, target: 4, value: 20, txHash: '0x4567...defg' },
      { source: 1, target: 4, value: 10, txHash: '0x5678...efgh' },
    ];

    setFlowChartData({ nodes, links });
  };

  // 生成相似地址
  const generateSimilarAddresses = address => {
    setSimilarAddressesLoading(true);

    // 模拟API延迟
    setTimeout(() => {
      const similarAddrs = [
        {
          address: '0xbcdef1234567890abcdef1234567890abcdef123',
          similarity: 85,
          riskLevel: 'medium',
          tags: ['defi', 'loan'],
          lastActivity: Date.now() - 259200000,
        },
        {
          address: '0xcdef1234567890abcdef1234567890abcdef1234',
          similarity: 75,
          riskLevel: 'high',
          tags: ['mixer', 'suspicious'],
          lastActivity: Date.now() - 604800000,
        },
        {
          address: '0xdef1234567890abcdef1234567890abcdef12345',
          similarity: 65,
          riskLevel: 'low',
          tags: ['exchange'],
          lastActivity: Date.now() - 86400000,
        },
      ];

      setSimilarAddresses(similarAddrs);
      setSimilarAddressesLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="区块链地址分析"
          subtitle="搜索、分析和监控区块链地址的活动和风险"
          className="mb-6"
        />

        <SearchBar placeholder="输入区块链地址..." label="区块链地址" onSearch={handleSearch} />

        {initialLoading ? (
          <AddressSkeleton />
        ) : isLoading ? (
          <div className="animate-pulse bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        ) : addressProfile ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* 地址概览卡片 */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">地址概览</h2>
                  <AddressFormatter
                    address={addressProfile.address}
                    showLabel={true}
                    label={addressProfile.label}
                  />
                </div>
                <RiskBadge riskLevel={addressProfile.riskLevel} score={addressProfile.riskScore} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">余额</h3>
                  <p className="text-lg font-semibold">{addressProfile.balance} ETH</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">交易数量</h3>
                  <p className="text-lg font-semibold">
                    {addressProfile.transactionCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">最近活动</h3>
                  <p className="text-lg font-semibold">
                    <DateFormatter timestamp={addressProfile.lastActivity} />
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {addressProfile.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 地址活动图表 */}
            {addressActivityData.length > 0 && (
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">地址活动分析</h2>
                <div className="h-80">
                  <AddressAnalysisChart data={addressActivityData} />
                </div>
              </motion.div>
            )}

            {/* 交易流向图 */}
            {flowChartData.nodes.length > 0 && (
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">交易流向分析</h2>
                <div className="h-80">
                  <TransactionFlowChart nodes={flowChartData.nodes} links={flowChartData.links} />
                </div>
              </motion.div>
            )}

            {/* 相似地址 */}
            <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">相似地址</h2>
              <SimilarAddresses
                addresses={similarAddresses}
                isLoading={isSimilarAddressesLoading}
              />
            </motion.div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">搜索区块链地址</h3>
            <p className="text-gray-500">输入区块链地址以查看详细分析和风险评估</p>
          </div>
        )}
      </div>
    </div>
  );
}
