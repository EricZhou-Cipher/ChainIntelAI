'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 只在浏览器环境中初始化 i18next
if (isBrowser) {
  i18n.use(initReactI18next).init({
    resources: {
      zh: {
        translation: {
          'network.legend': '图例',
          'network.nodeTypes.transaction': '交易',
          'network.nodeTypes.contract': '合约',
          'riskLevel.low': '低风险',
          'riskLevel.medium': '中风险',
          'riskLevel.high': '高风险',
          'riskLevel.critical': '严重风险',
          'network.zoomIn': '放大',
          'network.zoomOut': '缩小',
          'network.resetZoom': '重置视图',
          'networkAnalysis.clustering': '节点聚合',
          'networkAnalysis.clusterDistance': '聚合距离',
          'network.type': '类型',
          'network.riskLevel': '风险等级',
          'network.value': '值',
          'network.link': '链接',
          'network.from': '从',
          'network.to': '到',
        },
      },
    },
    lng: 'zh',
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
