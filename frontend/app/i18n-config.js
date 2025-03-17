import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 简单的中文翻译资源
const resources = {
  zh: {
    translation: {
      // 导航
      'navigation.dashboard': '仪表盘',
      'navigation.transactions': '交易监控',
      'navigation.addresses': '地址分析',
      'navigation.networkAnalysis': '网络分析',
      'navigation.alerts': '风险警报',
      'navigation.settings': '设置',

      // 公共文本
      'common.notifications': '通知',
      'common.noNotifications': '暂无通知',
      'common.openUserMenu': '打开用户菜单',
      'common.profile': '个人资料',
      'common.settings': '设置',
      'common.logout': '退出登录',
      'common.openMainMenu': '打开主菜单',

      // 风险等级
      'riskLevel.low': '低风险',
      'riskLevel.medium': '中等风险',
      'riskLevel.high': '高风险',
      'riskLevel.critical': '严重风险',
      'riskLevel.unknown': '未知风险',

      // 图表
      'charts.addressAnalysis.transactionCount': '交易数量',
      'charts.addressAnalysis.volume': '交易量',
      'charts.addressAnalysis.avgValue': '平均值',
      'charts.addressAnalysis.riskScore': '风险分数',
      'charts.addressAnalysis.noData': '无数据',

      'charts.transactionFlow.title': '交易流向图',
      'charts.transactionFlow.link': '交易连接',
      'charts.transactionFlow.from': '发送方',
      'charts.transactionFlow.to': '接收方',
      'charts.transactionFlow.value': '金额',
      'charts.transactionFlow.txHash': '交易哈希',
      'charts.transactionFlow.address': '地址',
      'charts.transactionFlow.category': '类别',
      'charts.transactionFlow.riskLevel': '风险等级',
      'charts.transactionFlow.instructions': '点击节点或连接查看详情',

      // 警报
      'alerts.noAlerts': '暂无风险警报',
      'alerts.details': '详情',
      'alerts.address': '地址',
      'alerts.transaction': '交易',
      'alerts.amount': '金额',
      'alerts.timestamp': '时间戳',
      'alerts.chain': '区块链',
      'alerts.viewDetails': '查看详情',
    },
  },
};

// 初始化i18next
i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false, // React已经安全地转义了
  },
  react: {
    useSuspense: true,
  },
});

export default i18n;
