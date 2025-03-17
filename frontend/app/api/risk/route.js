// 模拟风险统计数据
const mockRiskStats = {
  totalAddressesAnalyzed: 15782,
  highRiskAddresses: 423,
  mediumRiskAddresses: 1256,
  lowRiskAddresses: 14103,
  riskDistribution: {
    high: 2.68,
    medium: 7.96,
    low: 89.36,
  },
  commonRiskFactors: [
    { factor: '混币服务交互', count: 187, percentage: 44.21 },
    { factor: '暗网市场关联', count: 156, percentage: 36.88 },
    { factor: '勒索软件关联', count: 98, percentage: 23.17 },
    { factor: '欺诈活动', count: 76, percentage: 17.97 },
    { factor: '异常交易模式', count: 65, percentage: 15.37 },
  ],
};

// 模拟风险趋势数据
const mockRiskTrends = {
  daily: [
    { date: '2023-05-01', high: 12, medium: 45, low: 423 },
    { date: '2023-05-02', high: 15, medium: 38, low: 401 },
    { date: '2023-05-03', high: 8, medium: 42, low: 456 },
    { date: '2023-05-04', high: 21, medium: 51, low: 432 },
    { date: '2023-05-05', high: 18, medium: 47, low: 418 },
    { date: '2023-05-06', high: 14, medium: 39, low: 445 },
    { date: '2023-05-07', high: 16, medium: 43, low: 429 },
  ],
  weekly: [
    { week: '2023-W17', high: 87, medium: 312, low: 2987 },
    { week: '2023-W18', high: 104, medium: 298, low: 3012 },
    { week: '2023-W19', high: 92, medium: 305, low: 3145 },
    { week: '2023-W20', high: 115, medium: 321, low: 2956 },
  ],
  monthly: [
    { month: '2023-01', high: 342, medium: 1245, low: 12567 },
    { month: '2023-02', high: 378, medium: 1187, low: 12789 },
    { month: '2023-03', high: 401, medium: 1256, low: 13012 },
    { month: '2023-04', high: 412, medium: 1298, low: 13456 },
    { month: '2023-05', high: 423, medium: 1256, low: 14103 },
  ],
};

// 模拟风险模型信息
const mockRiskModel = {
  version: '2.3.1',
  lastUpdated: '2023-05-07T08:15:30Z',
  features: ['交易模式分析', '地址聚类', '已知风险地址关联', '时间模式分析', '网络拓扑分析'],
  accuracy: 94.7,
  falsePositiveRate: 2.3,
  falseNegativeRate: 3.0,
};

// 创建自定义响应对象，兼容测试环境
function createResponse(data, status = 200) {
  const response = {
    status: status,
    json: async () => data,
  };
  return response;
}

// GET 处理函数 - 获取风险分析数据
async function GET(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const riskIndex = pathParts.indexOf('risk');
  const endpoint = riskIndex + 1 < pathParts.length ? pathParts[riskIndex + 1] : null;

  // 获取风险统计数据
  if (endpoint === 'stats') {
    return createResponse(mockRiskStats);
  }

  // 获取风险趋势数据
  if (endpoint === 'trends') {
    const period = url.searchParams.get('period') || 'daily';

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return createResponse(
        { error: 'Invalid period. Must be one of: daily, weekly, monthly' },
        400
      );
    }

    return createResponse({
      period,
      data: mockRiskTrends[period],
    });
  }

  // 获取风险模型信息
  if (endpoint === 'model') {
    return createResponse(mockRiskModel);
  }

  // 如果没有指定端点，返回所有风险数据
  return createResponse({
    stats: mockRiskStats,
    trends: {
      daily: mockRiskTrends.daily.slice(-7),
      weekly: mockRiskTrends.weekly.slice(-4),
      monthly: mockRiskTrends.monthly.slice(-5),
    },
    model: mockRiskModel,
  });
}

// POST 处理函数 - 分析地址风险
async function POST(request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const riskIndex = pathParts.indexOf('risk');
    const endpoint = riskIndex + 1 < pathParts.length ? pathParts[riskIndex + 1] : null;

    const body = await request.json();

    // 分析单个地址
    if (endpoint === 'analyze') {
      if (!body.address) {
        return createResponse({ error: 'Address is required' }, 400);
      }

      // 验证地址格式
      if (!/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
        return createResponse({ error: 'Invalid Ethereum address format' }, 400);
      }

      // 模拟风险分析结果
      const riskScore = Math.floor(Math.random() * 100);
      let riskLevel;

      if (riskScore >= 75) {
        riskLevel = 'high';
      } else if (riskScore >= 30) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // 生成随机风险因素
      const riskFactors = [];
      const possibleFactors = [
        '混币服务交互',
        '暗网市场关联',
        '勒索软件关联',
        '欺诈活动',
        '异常交易模式',
        '新地址',
        '高价值交易',
        '频繁小额交易',
      ];

      // 高风险地址有更多风险因素
      const factorCount =
        riskLevel === 'high'
          ? Math.floor(Math.random() * 3) + 3
          : riskLevel === 'medium'
            ? Math.floor(Math.random() * 2) + 1
            : Math.floor(Math.random() * 2);

      // 随机选择风险因素
      for (let i = 0; i < factorCount; i++) {
        const randomIndex = Math.floor(Math.random() * possibleFactors.length);
        const factor = possibleFactors[randomIndex];

        if (!riskFactors.includes(factor)) {
          riskFactors.push(factor);
        }

        // 避免重复
        possibleFactors.splice(randomIndex, 1);
      }

      return createResponse({
        address: body.address,
        riskScore,
        riskLevel,
        riskFactors,
        analysisTimestamp: new Date().toISOString(),
      });
    }

    // 批量分析地址
    if (endpoint === 'batch-analyze') {
      if (!body.addresses || !Array.isArray(body.addresses) || body.addresses.length === 0) {
        return createResponse({ error: 'Addresses array is required and must not be empty' }, 400);
      }

      // 限制批量分析的地址数量
      if (body.addresses.length > 100) {
        return createResponse({ error: 'Maximum 100 addresses allowed for batch analysis' }, 400);
      }

      // 验证所有地址格式
      const invalidAddresses = body.addresses.filter(addr => !/^0x[a-fA-F0-9]{40}$/.test(addr));

      if (invalidAddresses.length > 0) {
        return createResponse(
          {
            error: 'Invalid Ethereum address format',
            invalidAddresses,
          },
          400
        );
      }

      // 模拟批量分析结果
      const results = body.addresses.map(address => {
        const riskScore = Math.floor(Math.random() * 100);
        let riskLevel;

        if (riskScore >= 75) {
          riskLevel = 'high';
        } else if (riskScore >= 30) {
          riskLevel = 'medium';
        } else {
          riskLevel = 'low';
        }

        return {
          address,
          riskScore,
          riskLevel,
        };
      });

      return createResponse({
        totalAnalyzed: results.length,
        results,
        analysisTimestamp: new Date().toISOString(),
      });
    }

    return createResponse({ error: 'Invalid endpoint' }, 400);
  } catch (error) {
    return createResponse({ error: 'Invalid request body' }, 400);
  }
}

module.exports = {
  GET,
  POST,
  mockRiskStats,
  mockRiskTrends,
  mockRiskModel,
};
