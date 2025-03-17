import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddressFormatter from '../app/components/AddressFormatter';
import RiskBadge from './RiskBadge';

const SimilarAddresses = ({ address, similarAddresses = [], isLoading = false }) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  
  // 如果没有相似地址数据，显示空状态
  if (!isLoading && (!similarAddresses || similarAddresses.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {t('address.similar.title')}
        </h2>
        <div className="bg-gray-50 rounded-md p-6 text-center">
          <p className="text-gray-500">{t('address.similar.noData')}</p>
        </div>
      </div>
    );
  }
  
  // 显示加载状态
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {t('address.similar.title')}
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // 决定显示多少地址
  const displayAddresses = showAll 
    ? similarAddresses 
    : similarAddresses.slice(0, 5);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {t('address.similar.title')}
        </h2>
        <div className="text-sm text-gray-500">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            AI {t('address.similar.powered')}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">
        {t('address.similar.description')}
      </p>
      
      <div className="space-y-4">
        {displayAddresses.map((item, index) => (
          <div 
            key={index} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 font-medium">{item.similarityScore}%</span>
              </div>
              <div>
                <div className="font-mono text-sm">
                  <AddressFormatter address={item.address} />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.tags.map((tag, i) => (
                    <span key={i} className="mr-2">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <RiskBadge level={item.riskLevel} />
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={() => window.open(`/addresses?address=${item.address}`, '_blank')}
              >
                {t('address.similar.view')}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {similarAddresses.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAll 
              ? t('address.similar.showLess') 
              : t('address.similar.showMore', { count: similarAddresses.length - 5 })}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimilarAddresses; 