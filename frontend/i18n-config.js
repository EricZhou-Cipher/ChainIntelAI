import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 中文翻译资源
const zhResources = {
  translation: {
    // 通用
    common: {
      loading: '加载中...',
      error: '发生错误',
      retry: '重试',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      back: '返回',
      next: '下一步',
      search: '搜索',
      noData: '暂无数据',
      viewDetails: '查看详情',
      copySuccess: '复制成功',
      more: '更多',
    },

    // 风险等级
    riskLevels: {
      high: '高风险',
      medium: '中风险',
      low: '低风险',
      unknown: '未知风险',
    },

    // 首页
    homePage: {
      title: 'ChainIntelAI - 区块链智能分析平台',
      description: '实时监控和分析区块链活动，识别潜在风险',
      dashboard: '仪表盘',
      addressAnalysis: '地址分析',
      transactionMonitoring: '交易监控',
    },

    // 仪表盘页面
    dashboardPage: {
      title: 'ChainIntelAI 仪表盘',
      description: '区块链数据智能分析平台',
      systemStatus: '系统状态',
      mongodb: 'MongoDB',
      redis: 'Redis',
      todayAnalysis: '今日分析',
      analyzedTransactions: '已分析交易',
      addressAnalysis: '地址分析',
      addressAnalysisDesc: '分析区块链地址的交易历史、关联地址和风险评估。',
      transactionMonitoring: '交易监控',
      transactionMonitoringDesc: '监控实时交易，识别可疑活动和异常模式。',
      riskAlerts: '风险警报',
      riskAlertsDesc: '接收有关高风险活动的实时警报和通知。',
      riskDistribution: '风险分布',
      networkActivity: '实时网络活动',
    },

    // 地址分析页面
    addressPage: {
      title: '区块链地址分析',
      description: '搜索、分析和监控区块链地址的活动和风险',
      searchPlaceholder: '输入区块链地址...',
      searchLabel: '区块链地址',
      search: '搜索',
      addressProfile: '地址概况',
      balance: '余额',
      transactions: '交易数',
      firstSeen: '首次交易',
      lastSeen: '最近交易',
      riskScore: '风险评分',
      tags: '标签',
      similarAddresses: '相似地址',
      transactionHistory: '交易历史',
      relatedEntities: '关联实体',
    },

    // 交易页面
    transactionsPage: {
      title: '交易监控',
      description: '监控和分析区块链交易',
      searchPlaceholder: '输入交易哈希或地址...',
      searchLabel: '交易哈希/地址',
      searchResults: '搜索结果',
      searchFailed: '搜索失败，请重试',
      recentTransactions: '最近交易',
      hash: '交易哈希',
      blockNumber: '区块号',
      from: '发送方',
      to: '接收方',
      value: '金额',
      timestamp: '时间',
      riskScore: '风险评分',
      actions: '操作',
      viewNetwork: '查看网络分析',
      transactionDetails: '交易详情',
      transactionFlow: '交易流向',
      contractInteraction: '合约交互',
      contractAddress: '合约地址',
      methodName: '方法名称',
      methodSignature: '方法签名',
      parameters: '参数',
      paramName: '名称',
      paramType: '类型',
      paramValue: '值',
      decodedLogs: '解码日志',
      noContractInteraction: '此交易没有合约交互',
      filters: {
        title: '筛选条件',
        startDate: '开始日期',
        endDate: '结束日期',
        minAmount: '最小金额',
        maxAmount: '最大金额',
        counterpartyAddress: '交易对手地址',
        reset: '重置',
        apply: '应用',
      },
    },

    // 图表相关
    charts: {
      transactionFlow: {
        title: '交易流向图',
        instructions: '点击节点或连线查看详情',
        link: '交易连接',
        from: '从',
        to: '到',
        value: '金额',
        txHash: '交易哈希',
        address: '地址',
        category: '类别',
        riskLevel: '风险等级',
      },
    },
  },
};

// 初始化i18n
i18n.use(initReactI18next).init({
  resources: {
    zh: zhResources,
  },
  lng: 'zh', // 默认语言
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false, // 不转义HTML
  },
});

export default i18n;
