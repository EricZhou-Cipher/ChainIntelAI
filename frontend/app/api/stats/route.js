// 模拟系统统计数据
const mockSystemStats = {
  uptime: 1209600, // 秒数，约14天
  cpuUsage: 32.5,
  memoryUsage: 68.7,
  diskUsage: 47.2,
  activeUsers: 127,
  requestsPerMinute: 342,
  averageResponseTime: 187, // 毫秒
  errorRate: 0.42, // 百分比
  lastUpdated: new Date().toISOString(),
};

// 模拟交易统计数据
const mockTransactionStats = {
  total: 1567823,
  daily: 12453,
  weekly: 87621,
  monthly: 376542,
  averageValue: 0.87, // ETH
  largestValue: 245.72, // ETH
  byType: {
    transfer: 1245672,
    swap: 187234,
    mint: 76543,
    burn: 34521,
    other: 23853,
  },
  byStatus: {
    confirmed: 1523456,
    pending: 32145,
    failed: 12222,
  },
};

// 模拟地址统计数据
const mockAddressStats = {
  total: 876543,
  active: {
    daily: 34521,
    weekly: 123456,
    monthly: 345678,
  },
  byRiskLevel: {
    high: 12543,
    medium: 87654,
    low: 776346,
  },
  newAddresses: {
    daily: 1245,
    weekly: 8765,
    monthly: 34521,
  },
  topCountries: [
    { country: '美国', count: 245678 },
    { country: '中国', count: 187654 },
    { country: '俄罗斯', count: 98765 },
    { country: '德国', count: 87654 },
    { country: '英国', count: 76543 },
  ],
};

// 模拟网络统计数据
const mockNetworkStats = {
  nodesCount: 12453,
  edgesCount: 87654,
  averageDegree: 7.2,
  clusteringCoefficient: 0.42,
  largestConnectedComponent: 765432,
  communities: 876,
  averagePathLength: 4.3,
  diameter: 12,
};

// 模拟风险统计数据
const mockRiskStats = {
  totalScanned: 876543,
  byRiskLevel: {
    high: 12543,
    medium: 87654,
    low: 776346,
  },
  alertsGenerated: 34521,
  alertsByStatus: {
    active: 12453,
    resolved: 22068,
  },
  topRiskFactors: [
    { factor: '混币服务交互', count: 7654 },
    { factor: '暗网市场关联', count: 5432 },
    { factor: '勒索软件关联', count: 3456 },
    { factor: '欺诈活动', count: 2345 },
    { factor: '异常交易模式', count: 1987 },
  ],
};

// 创建自定义响应对象，兼容测试环境
function createResponse(data, status = 200) {
  const response = {
    status: status,
    json: async () => data,
  };
  return response;
}

// GET 处理函数 - 获取统计数据
async function GET(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const statsIndex = pathParts.indexOf('stats');
  const category = statsIndex + 1 < pathParts.length ? pathParts[statsIndex + 1] : null;

  // 获取系统统计数据
  if (category === 'system') {
    return createResponse(mockSystemStats);
  }

  // 获取交易统计数据
  if (category === 'transactions') {
    const period = url.searchParams.get('period');

    if (period) {
      if (!['daily', 'weekly', 'monthly', 'all'].includes(period)) {
        return createResponse(
          { error: 'Invalid period. Must be one of: daily, weekly, monthly, all' },
          400
        );
      }

      // 根据时间段返回不同的统计数据
      if (period === 'daily') {
        return createResponse({
          count: mockTransactionStats.daily,
          averageValue: mockTransactionStats.averageValue,
          byType: {
            transfer: Math.floor(mockTransactionStats.byType.transfer / 30),
            swap: Math.floor(mockTransactionStats.byType.swap / 30),
            mint: Math.floor(mockTransactionStats.byType.mint / 30),
            burn: Math.floor(mockTransactionStats.byType.burn / 30),
            other: Math.floor(mockTransactionStats.byType.other / 30),
          },
        });
      } else if (period === 'weekly') {
        return createResponse({
          count: mockTransactionStats.weekly,
          averageValue: mockTransactionStats.averageValue,
          byType: {
            transfer: Math.floor(mockTransactionStats.byType.transfer / 4),
            swap: Math.floor(mockTransactionStats.byType.swap / 4),
            mint: Math.floor(mockTransactionStats.byType.mint / 4),
            burn: Math.floor(mockTransactionStats.byType.burn / 4),
            other: Math.floor(mockTransactionStats.byType.other / 4),
          },
        });
      } else if (period === 'monthly') {
        return createResponse({
          count: mockTransactionStats.monthly,
          averageValue: mockTransactionStats.averageValue,
          byType: mockTransactionStats.byType,
        });
      }
    }

    return createResponse(mockTransactionStats);
  }

  // 获取地址统计数据
  if (category === 'addresses') {
    return createResponse(mockAddressStats);
  }

  // 获取网络统计数据
  if (category === 'network') {
    return createResponse(mockNetworkStats);
  }

  // 获取风险统计数据
  if (category === 'risk') {
    return createResponse(mockRiskStats);
  }

  // 如果没有指定类别，返回所有统计数据
  return createResponse({
    system: mockSystemStats,
    transactions: {
      total: mockTransactionStats.total,
      daily: mockTransactionStats.daily,
      weekly: mockTransactionStats.weekly,
      monthly: mockTransactionStats.monthly,
    },
    addresses: {
      total: mockAddressStats.total,
      active: mockAddressStats.active,
      byRiskLevel: mockAddressStats.byRiskLevel,
    },
    network: {
      nodesCount: mockNetworkStats.nodesCount,
      edgesCount: mockNetworkStats.edgesCount,
      communities: mockNetworkStats.communities,
    },
    risk: {
      totalScanned: mockRiskStats.totalScanned,
      byRiskLevel: mockRiskStats.byRiskLevel,
      alertsGenerated: mockRiskStats.alertsGenerated,
    },
  });
}

module.exports = {
  GET,
  mockSystemStats,
  mockTransactionStats,
  mockAddressStats,
  mockNetworkStats,
  mockRiskStats,
};
