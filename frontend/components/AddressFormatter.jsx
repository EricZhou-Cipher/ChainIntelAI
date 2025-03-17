'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 区块链地址格式化组件
 * 显示完整地址或简化版本，提供复制功能
 */
const AddressFormatter = ({ 
  address, 
  truncateLength = 8, 
  showFull = false, 
  className = '',
  withCopy = true,
  withIcon = true
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  
  // 截断地址，显示首尾各truncateLength个字符
  const truncateAddress = (address) => {
    if (!address) return '';
    if (showFull) return address;
    
    const start = address.substring(0, truncateLength);
    const end = address.substring(address.length - truncateLength);
    return `${start}...${end}`;
  };
  
  // 复制地址到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // 渲染地址图标
  const renderIcon = () => {
    if (!withIcon) return null;
    
    return (
      <div className="inline-block mr-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-3 w-3 text-white" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`inline-flex items-center ${className}`}>
      {renderIcon()}
      <span 
        className="font-mono text-sm"
        title={address}
      >
        {truncateAddress(address)}
      </span>
      
      {withCopy && (
        <button
          onClick={copyToClipboard}
          className="ml-2 text-gray-500 hover:text-blue-500 transition-colors"
          title={t('common.copyAddress')}
        >
          {copied ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 text-green-500" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 010 2h-2v-2z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default AddressFormatter; 