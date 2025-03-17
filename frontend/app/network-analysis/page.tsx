'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
// 引入优化版区块链网络组件
import BlockchainNetworkOptimized from '../../components/BlockchainNetworkOptimized';
import BlockchainNetwork from '../../components/BlockchainNetwork';
import { NetworkNode, NetworkLink } from '../../components/BlockchainNetworkTypes';
import { TranslatedErrorBoundary } from '../../components/ErrorBoundary';
import PerformanceDashboard from '../../components/PerformanceDashboard';
import { 
  generateInitialNetworkData, 
  setupRealTimeUpdates,
  generateAddressNetworkData,
  generateTransactionNetworkData
} from '../../utils/blockchainDataService';
// 引入新的优化工具
import { 
  isWebGLSupported, 
  getDevicePerformanceLevel 
} from '../../utils/webglDetector';
import { 
  generateLargeNetworkData, 
  detectBestVisualizationMode 
} from '../../utils/networkDataService';

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

export default function NetworkAnalysis() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const frameId = useRef<number | null>(null);
  
  const [networkData, setNetworkData] = useState<{ nodes: NetworkNode[], links: NetworkLink[] }>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'address' | 'transaction'>('address');
  const [networkDepth, setNetworkDepth] = useState(2);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  // 高性能模式开关
  const [highPerformanceMode, setHighPerformanceMode] = useState(false);
  // 视口裁剪开关
  const [cullingEnabled, setCullingEnabled] = useState(true);
  // 节点总数统计
  const [nodeStats, setNodeStats] = useState({ shown: 0, total: 0 });
  // WebGL 支持状态
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  // 设备性能级别
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low' | null>(null);
  // 性能指标
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    renderTime: 0,
    nodeCount: 0,
    visibleNodeCount: 0
  });
  
  // 性能测量
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measurePerformance = () => {
      const now = performance.now();
      frameCount++;
      
      // 每秒更新一次 FPS
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        const renderTime = (now - lastTime) / frameCount;
        
        setPerformanceMetrics(prev => ({
          ...prev,
          fps,
          renderTime,
          nodeCount: networkData.nodes.length,
          visibleNodeCount: cullingEnabled ? Math.floor(networkData.nodes.length * 0.8) : networkData.nodes.length
        }));
        
        frameCount = 0;
        lastTime = now;
      }
      
      frameId.current = requestAnimationFrame(measurePerformance);
    };
    
    frameId.current = requestAnimationFrame(measurePerformance);
    
    return () => {
      if (frameId.current !== null) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [networkData.nodes.length, cullingEnabled]);
  
  // 检测 WebGL 支持和设备性能
  useEffect(() => {
    // 在客户端检测 WebGL 支持
    if (typeof window !== 'undefined') {
      const supported = isWebGLSupported();
      setWebglSupported(supported);
      
      const level = getDevicePerformanceLevel();
      setPerformanceLevel(level);
      
      // 如果不支持 WebGL，确保高性能模式关闭
      if (!supported && highPerformanceMode) {
        setHighPerformanceMode(false);
      }
    }
  }, [highPerformanceMode]);
  
  // 处理节点点击
  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
    
    // 如果是地址节点，可以导航到地址详情页
    if (node.type === 'address') {
      window.open(`/addresses?address=${node.address}`, '_blank');
    }
    // 如果是交易节点，可以导航到交易详情页
    else if (node.type === 'transaction') {
      window.open(`/transactions?hash=${node.address}`, '_blank');
    }
  }, []);
  
  // 处理链接点击
  const handleLinkClick = useCallback((link: NetworkLink) => {
    if (link.txHash) {
      window.open(`/transactions?hash=${link.txHash}`, '_blank');
    }
  }, []);
  
  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        // 检查URL参数
        const address = searchParams.get('address');
        const txHash = searchParams.get('hash');
        
        let data;
        if (address) {
          // 如果有地址参数，生成地址相关的网络数据
          setSearchType('address');
          setSearchQuery(address);
          data = generateAddressNetworkData(address, networkDepth);
        } else if (txHash) {
          // 如果有交易哈希参数，生成交易相关的网络数据
          setSearchType('transaction');
          setSearchQuery(txHash);
          data = generateTransactionNetworkData(txHash);
        } else {
          // 否则生成随机网络数据
          data = generateInitialNetworkData(15);
        }
        
        setNetworkData(data);
        setNodeStats({ shown: data.nodes.length, total: data.nodes.length });
        
        // 自动检测：如果节点数量大于50，自动启用高性能模式
        // 但前提是支持 WebGL
        if (data.nodes.length > 50 && webglSupported) {
          setHighPerformanceMode(true);
        }
      } catch (error) {
        console.error('加载网络数据时出错:', error);
        setLoadError(t('errors.dataLoadFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [searchParams, networkDepth, t, webglSupported]);
  
  // 处理实时数据更新
  useEffect(() => {
    if (!isRealTimeEnabled) return;
    
    // 设置实时数据更新
    const cleanup = setupRealTimeUpdates(networkData, (updatedData) => {
      setNetworkData(updatedData);
      setNodeStats({ 
        shown: cullingEnabled ? Math.floor(updatedData.nodes.length * 0.8) : updatedData.nodes.length, 
        total: updatedData.nodes.length 
      });
    });
    
    // 清理函数
    return cleanup;
  }, [isRealTimeEnabled, networkData, cullingEnabled]);
  
  // 处理搜索
  const handleSearch = useCallback(async (query: string) => {
    if (!query) return;
    
    setIsLoading(true);
    setLoadError(null);
    setSearchQuery(query);
    
    try {
      // 判断搜索类型（地址或交易哈希）
      const isAddress = query.startsWith('0x') && query.length === 42;
      const isTransaction = query.startsWith('0x') && query.length === 66;
      
      let data;
      if (isAddress) {
        setSearchType('address');
        data = generateAddressNetworkData(query, networkDepth);
      } else if (isTransaction) {
        setSearchType('transaction');
        data = generateTransactionNetworkData(query);
      } else {
        // 如果不是有效的地址或交易哈希，生成随机数据
        data = generateInitialNetworkData(15);
      }
      
      setNetworkData(data);
      setNodeStats({ shown: data.nodes.length, total: data.nodes.length });
      
      // 自动检测：如果节点数量大于50并且支持WebGL，自动启用高性能模式
      if (data.nodes.length > 50 && webglSupported) {
        setHighPerformanceMode(true);
      }
    } catch (error) {
      console.error('搜索时出错:', error);
      setLoadError(t('errors.dataLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [networkDepth, t, webglSupported]);
  
  // 处理网络深度变化
  const handleDepthChange = useCallback((depth: number) => {
    setNetworkDepth(depth);
    
    // 如果当前是地址搜索，重新生成网络数据
    if (searchType === 'address' && searchQuery) {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const data = generateAddressNetworkData(searchQuery, depth);
        setNetworkData(data);
        setNodeStats({ shown: data.nodes.length, total: data.nodes.length });
        
        // 自动检测：如果节点数量大于50，自动启用高性能模式
        if (data.nodes.length > 50 && webglSupported) {
          setHighPerformanceMode(true);
        }
      } catch (error) {
        console.error('更新网络深度时出错:', error);
        setLoadError(t('errors.dataLoadFailed'));
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchType, searchQuery, webglSupported, t]);
  
  // 处理视口裁剪变化
  const handleCullingChange = useCallback(() => {
    setCullingEnabled(!cullingEnabled);
    
    // 更新节点统计信息
    setNodeStats(prev => ({
      ...prev,
      shown: !cullingEnabled ? Math.floor(networkData.nodes.length * 0.8) : networkData.nodes.length
    }));
  }, [cullingEnabled, networkData.nodes.length]);
  
  // 生成大规模测试数据
  const generateLargeDataset = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // 使用 Web Worker 生成大规模数据
      const largeData = await generateLargeNetworkData(500, 1000, 600);
      setNetworkData(largeData);
      setNodeStats({ shown: largeData.nodes.length, total: largeData.nodes.length });
      
      // 自动启用高性能模式
      if (webglSupported) {
        setHighPerformanceMode(true);
      } else {
        // 如果不支持 WebGL，显示警告
        alert(t('errors.browserNotSupported'));
      }
    } catch (error) {
      console.error('生成大规模数据时出错:', error);
      setLoadError(t('errors.dataLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t, webglSupported]);
  
  return (
    <TranslatedErrorBoundary>
      <motion.div
        className="container mx-auto p-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <PageHeader 
          title={t('networkAnalysis.title')} 
          subtitle={t('networkAnalysis.subtitle')} 
          actions={null}
          className=""
        />
        
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder={t('networkAnalysis.searchPlaceholder')} 
                  label={t('networkAnalysis.searchLabel')}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{t('networkAnalysis.depth')}:</span>
                  <select
                    value={networkDepth}
                    onChange={(e) => handleDepthChange(Number(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    disabled={searchType !== 'address'}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{t('networkAnalysis.realTime')}:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isRealTimeEnabled}
                      onChange={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{t('networkAnalysis.performance')}:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={highPerformanceMode}
                      onChange={() => setHighPerformanceMode(!highPerformanceMode)}
                      disabled={!webglSupported}
                      title={!webglSupported ? t('errors.browserNotSupported') : ''}
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${highPerformanceMode ? 'peer-checked:bg-primary' : 'peer-disabled:bg-gray-300 peer-disabled:cursor-not-allowed'}`}></div>
                  </label>
                </div>
                
                <button
                  onClick={generateLargeDataset}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  {t('common.testLargeDataset')}
                </button>
              </div>
            </div>
            
            {/* 显示 WebGL 支持状态 */}
            {webglSupported === false && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-100 rounded-md text-yellow-800 text-sm">
                {t('errors.browserNotSupported')}
              </div>
            )}
          </div>
        </motion.div>
        
        {/* 性能仪表板 */}
        <motion.div 
          variants={itemVariants}
          className="fixed bottom-4 right-4 z-10 w-64"
        >
          <PerformanceDashboard
            metrics={performanceMetrics}
            isExpanded={false}
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {searchQuery ? (
                  searchType === 'address' ? 
                    t('networkAnalysis.addressNetwork', { address: searchQuery.substring(0, 6) + '...' + searchQuery.substring(searchQuery.length - 4) }) : 
                    t('networkAnalysis.transactionNetwork', { hash: searchQuery.substring(0, 6) + '...' + searchQuery.substring(searchQuery.length - 4) })
                ) : (
                  t('networkAnalysis.randomNetwork')
                )}
              </h2>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div>
                  {t('networkAnalysis.renderMode')}: 
                  <span className={`ml-1 font-medium ${highPerformanceMode ? 'text-primary' : 'text-gray-700'}`}>
                    {highPerformanceMode ? 'WebGL' : 'SVG'}
                  </span>
                </div>
                
                <div>
                  {t('networkAnalysis.nodesShown')}: 
                  <span className="ml-1 font-medium">
                    {nodeStats.shown} / {nodeStats.total}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span>{t('networkAnalysis.culling')}:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={cullingEnabled}
                      onChange={handleCullingChange}
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
            
            {isRealTimeEnabled && (
              <p className="text-sm text-gray-500 mt-1">
                {t('networkAnalysis.realTimeEnabled')}
              </p>
            )}
            
            {performanceLevel && (
              <p className="text-xs text-gray-500 mt-1">
                设备性能级别: <span className="font-medium">{performanceLevel.toUpperCase()}</span>
              </p>
            )}
          </div>
          
          <div className="h-[600px] relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : loadError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-4 bg-red-50 text-red-700 rounded-md max-w-md text-center">
                  <p className="font-medium mb-2">{t('common.error')}</p>
                  <p className="text-sm mb-4">{loadError}</p>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    onClick={() => window.location.reload()}
                  >
                    {t('common.retry')}
                  </button>
                </div>
              </div>
            ) : highPerformanceMode && webglSupported ? (
              <BlockchainNetworkOptimized
                nodes={networkData.nodes}
                links={networkData.links}
                width={1000}
                height={600}
                onNodeClick={handleNodeClick}
                onLinkClick={handleLinkClick}
              />
            ) : (
              <BlockchainNetwork
                nodes={networkData.nodes}
                links={networkData.links}
                width={1000}
                height={600}
                onNodeClick={handleNodeClick}
                onLinkClick={handleLinkClick}
              />
            )}
          </div>
          
          <div className="p-2 bg-yellow-50 text-sm text-yellow-800 border-t border-yellow-100">
            {t('networkAnalysis.optimizationTip')}
          </div>
        </motion.div>
        
        {selectedNode && (
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('networkAnalysis.nodeDetails')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('networkAnalysis.nodeId')}</h3>
                <p className="mt-1">{selectedNode.label || selectedNode.id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('networkAnalysis.nodeType')}</h3>
                <p className="mt-1">{t(`network.nodeTypes.${selectedNode.type}`)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('networkAnalysis.address')}</h3>
                <p className="mt-1 font-mono text-sm break-all">{selectedNode.address}</p>
              </div>
              
              {selectedNode.riskLevel && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('networkAnalysis.riskLevel')}</h3>
                  <p className="mt-1">{t(`riskLevel.${selectedNode.riskLevel}`)}</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                onClick={() => {
                  if (selectedNode.type === 'address') {
                    window.open(`/addresses?address=${selectedNode.address}`, '_blank');
                  } else if (selectedNode.type === 'transaction') {
                    window.open(`/transactions?hash=${selectedNode.address}`, '_blank');
                  }
                }}
              >
                {t('networkAnalysis.viewDetails')}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </TranslatedErrorBoundary>
  );
} 