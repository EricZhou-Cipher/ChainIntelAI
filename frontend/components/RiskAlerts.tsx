import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// 定义风险等级类型
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// 定义警报类型
export interface RiskAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: string;
  riskLevel: RiskLevel;
  details?: {
    address?: string;
    transaction?: string;
    amount?: string;
    timestamp?: string;
    chain?: string;
    [key: string]: any;
  };
  actionable: boolean;
}

// 定义组件属性类型
interface RiskAlertsProps {
  alerts: RiskAlert[];
  onViewAlert?: (alert: RiskAlert) => void;
  className?: string;
}

/**
 * 风险警报组件 - 显示风险警报列表
 */
const RiskAlerts: React.FC<RiskAlertsProps> = ({ 
  alerts, 
  onViewAlert,
  className = '' 
}) => {
  const { t } = useTranslation();
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  
  // 获取风险等级样式
  const getRiskLevelStyle = useCallback((level: RiskLevel) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);
  
  // 获取风险等级文本
  const getRiskLevelText = useCallback((level: RiskLevel) => {
    const texts = {
      low: t('riskLevel.low'),
      medium: t('riskLevel.medium'),
      high: t('riskLevel.high'),
      critical: t('riskLevel.critical')
    };
    return texts[level] || t('riskLevel.unknown');
  }, [t]);
  
  // 格式化时间
  const formatTime = useCallback((timestamp: string) => {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return timestamp;
    }
  }, []);
  
  // 处理展开/折叠警报
  const handleToggleExpand = useCallback((alertId: string) => {
    setExpandedAlertId(prevId => prevId === alertId ? null : alertId);
  }, []);
  
  // 处理查看警报详情
  const handleViewAlert = useCallback((alert: RiskAlert) => {
    if (onViewAlert) {
      onViewAlert(alert);
    }
  }, [onViewAlert]);
  
  // 格式化地址显示
  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('alerts.noAlerts')}
        </div>
      ) : (
        <AnimatePresence>
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              className="border rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
                  expandedAlertId === alert.id ? 'bg-gray-50' : 'bg-white'
                }`}
                onClick={() => handleToggleExpand(alert.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelStyle(alert.riskLevel)}`}>
                    {getRiskLevelText(alert.riskLevel)}
                  </span>
                  <h3 className="font-medium text-gray-900">{alert.title}</h3>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {formatTime(alert.timestamp)}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedAlertId === alert.id ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <AnimatePresence>
                {expandedAlertId === alert.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t px-4 py-3 bg-gray-50"
                  >
                    <p className="text-gray-700 mb-3">{alert.description}</p>
                    
                    {alert.details && (
                      <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                        <h4 className="font-medium text-gray-800 mb-2">{t('alerts.details')}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {alert.details.address && (
                            <div>
                              <span className="text-gray-500">{t('alerts.address')}:</span>
                              <span className="ml-1 font-mono">{formatAddress(alert.details.address)}</span>
                            </div>
                          )}
                          {alert.details.transaction && (
                            <div>
                              <span className="text-gray-500">{t('alerts.transaction')}:</span>
                              <span className="ml-1 font-mono">{formatAddress(alert.details.transaction)}</span>
                            </div>
                          )}
                          {alert.details.amount && (
                            <div>
                              <span className="text-gray-500">{t('alerts.amount')}:</span>
                              <span className="ml-1">{alert.details.amount}</span>
                            </div>
                          )}
                          {alert.details.chain && (
                            <div>
                              <span className="text-gray-500">{t('alerts.chain')}:</span>
                              <span className="ml-1">{alert.details.chain}</span>
                            </div>
                          )}
                          {alert.details.timestamp && (
                            <div>
                              <span className="text-gray-500">{t('alerts.timestamp')}:</span>
                              <span className="ml-1">{formatTime(alert.details.timestamp)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {alert.actionable && (
                      <div className="flex justify-end">
                        <button
                          className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-dark transition-colors"
                          onClick={() => handleViewAlert(alert)}
                        >
                          {t('alerts.viewDetails')}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default RiskAlerts; 