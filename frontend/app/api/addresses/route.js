// 模拟地址数据
const mockAddresses = [
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    balance: '15.75',
    transactionCount: 127,
    firstSeen: '2023-01-15T08:30:45Z',
    lastSeen: '2023-05-07T14:22:18Z',
    riskScore: 25,
    riskLevel: 'low',
    tags: ['交易所', '高交易量'],
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    balance: '245.32',
    transactionCount: 89,
    firstSeen: '2023-02-21T11:45:32Z',
    lastSeen: '2023-05-06T09:15:47Z',
    riskScore: 65,
    riskLevel: 'medium',
    tags: ['智能合约', '代币发行'],
  },
  {
    address: '0x9876543210fedcba9876543210fedcba98765432',
    balance: '1024.87',
    transactionCount: 312,
    firstSeen: '2022-11-05T16:20:11Z',
    lastSeen: '2023-05-07T18:45:23Z',
    riskScore: 15,
    riskLevel: 'low',
    tags: ['鲸鱼', '长期持有'],
  },
  {
    address: '0xfedcba9876543210fedcba9876543210fedcba98',
    balance: '0.45',
    transactionCount: 23,
    firstSeen: '2023-04-12T10:05:38Z',
    lastSeen: '2023-05-05T22:17:09Z',
    riskScore: 85,
    riskLevel: 'high',
    tags: ['混币服务', '可疑活动'],
  },
  {
    address: '0x5432109876fedcba5432109876fedcba54321098',
    balance: '78.21',
    transactionCount: 156,
    firstSeen: '2023-03-08T14:30:22Z',
    lastSeen: '2023-05-07T11:42:56Z',
    riskScore: 45,
    riskLevel: 'medium',
    tags: ['DeFi用户', '频繁交易'],
  },
];

// 模拟交易历史数据
const mockTransactionHistory = {
  '0x1234567890abcdef1234567890abcdef12345678': [
    {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: '1.5',
      timestamp: '2023-05-07T14:22:18Z',
      blockNumber: 12345678,
      status: 'confirmed',
    },
    {
      hash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xfedcba9876543210fedcba9876543210fedcba98',
      value: '0.5',
      timestamp: '2023-05-07T10:15:32Z',
      blockNumber: 12345675,
      status: 'confirmed',
    },
  ],
  '0xabcdef1234567890abcdef1234567890abcdef12': [
    {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      from: '0xabcdef1234567890abcdef1234567890abcdef12',
      to: '0x9876543210fedcba9876543210fedcba98765432',
      value: '0.75',
      timestamp: '2023-05-06T09:15:47Z',
      blockNumber: 12345677,
      status: 'confirmed',
    },
  ],
  '0x9876543210fedcba9876543210fedcba98765432': [
    {
      hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      from: '0x9876543210fedcba9876543210fedcba98765432',
      to: '0x1234567890abcdef1234567890abcdef12345678',
      value: '2.25',
      timestamp: '2023-05-07T18:45:23Z',
      blockNumber: 12345676,
      status: 'confirmed',
    },
  ],
};

// 模拟风险分析数据
const mockRiskAnalysis = {
  '0x1234567890abcdef1234567890abcdef12345678': {
    riskScore: 25,
    riskLevel: 'low',
    riskFactors: [],
    analysisTimestamp: '2023-05-07T14:30:00Z',
  },
  '0xabcdef1234567890abcdef1234567890abcdef12': {
    riskScore: 65,
    riskLevel: 'medium',
    riskFactors: ['异常交易模式', '新地址'],
    analysisTimestamp: '2023-05-06T10:00:00Z',
  },
  '0x9876543210fedcba9876543210fedcba98765432': {
    riskScore: 15,
    riskLevel: 'low',
    riskFactors: [],
    analysisTimestamp: '2023-05-07T19:00:00Z',
  },
  '0xfedcba9876543210fedcba9876543210fedcba98': {
    riskScore: 85,
    riskLevel: 'high',
    riskFactors: ['混币服务交互', '暗网市场关联', '异常交易模式'],
    analysisTimestamp: '2023-05-05T23:00:00Z',
  },
  '0x5432109876fedcba5432109876fedcba54321098': {
    riskScore: 45,
    riskLevel: 'medium',
    riskFactors: ['频繁小额交易'],
    analysisTimestamp: '2023-05-07T12:00:00Z',
  },
};

// 创建自定义响应对象，兼容测试环境
function createResponse(data, status = 200) {
  const response = {
    status: status,
    json: async () => data,
  };
  return response;
}

// GET 处理函数 - 获取地址列表或特定地址
async function GET(request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const limit = searchParams.get('limit');
  const riskLevel = searchParams.get('riskLevel');

  // 从URL路径中提取地址（如果有）
  const pathParts = url.pathname.split('/');
  const addressIndex = pathParts.indexOf('addresses');
  const addressValue = addressIndex + 1 < pathParts.length ? pathParts[addressIndex + 1] : null;

  // 如果URL包含特定地址
  if (addressValue) {
    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(addressValue)) {
      return createResponse({ error: 'Invalid Ethereum address format' }, 400);
    }

    // 检查是否请求交易历史
    if (pathParts.length > addressIndex + 2 && pathParts[addressIndex + 2] === 'transactions') {
      // 返回地址的交易历史
      const transactions = mockTransactionHistory[addressValue] || [];

      return createResponse({ transactions });
    }

    // 检查是否请求风险分析
    if (pathParts.length > addressIndex + 2 && pathParts[addressIndex + 2] === 'risk') {
      // 返回地址的风险分析
      const address = mockAddresses.find(addr => addr.address === addressValue);

      if (!address) {
        return createResponse({ error: 'Address not found' }, 404);
      }

      const riskAnalysis = mockRiskAnalysis[addressValue];

      if (!riskAnalysis) {
        return createResponse({ error: 'Risk analysis not found' }, 404);
      }

      return createResponse({
        address: addressValue,
        riskScore: riskAnalysis.riskScore,
        riskLevel: riskAnalysis.riskLevel,
        riskFactors: riskAnalysis.riskFactors,
      });
    }

    // 返回地址详情
    const address = mockAddresses.find(addr => addr.address === addressValue);

    if (!address) {
      return createResponse({ error: 'Address not found' }, 404);
    }

    return createResponse(address);
  }

  // 如果请求是获取地址统计信息
  if (addressValue === 'stats') {
    const total = mockAddresses.length;

    // 按风险等级统计
    const byRiskLevel = {
      high: mockAddresses.filter(a => a.riskLevel === 'high').length,
      medium: mockAddresses.filter(a => a.riskLevel === 'medium').length,
      low: mockAddresses.filter(a => a.riskLevel === 'low').length,
    };

    // 按标签统计
    const byTags = {};
    mockAddresses.forEach(address => {
      address.tags.forEach(tag => {
        byTags[tag] = (byTags[tag] || 0) + 1;
      });
    });

    return createResponse({
      total,
      byRiskLevel,
      byTags,
    });
  }

  // 过滤地址
  let filteredAddresses = mockAddresses;

  // 按风险等级过滤
  if (riskLevel) {
    if (!['high', 'medium', 'low'].includes(riskLevel)) {
      return createResponse(
        { error: 'Invalid risk level. Must be one of: high, medium, low' },
        400
      );
    }

    filteredAddresses = filteredAddresses.filter(address => address.riskLevel === riskLevel);
  }

  // 限制返回的地址数量
  if (limit && !isNaN(parseInt(limit))) {
    filteredAddresses = filteredAddresses.slice(0, parseInt(limit));
  }

  return createResponse({ addresses: filteredAddresses });
}

// POST 处理函数 - 创建新地址
async function POST(request) {
  try {
    const body = await request.json();

    // 验证必要字段
    if (!body.address) {
      return createResponse({ error: 'Missing required field: address' }, 400);
    }

    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
      return createResponse({ error: 'Invalid Ethereum address format' }, 400);
    }

    // 检查地址是否已存在
    if (mockAddresses.some(a => a.address === body.address)) {
      return createResponse({ error: 'Address already exists' }, 409);
    }

    // 创建新地址
    const newAddress = {
      address: body.address,
      balance: body.balance || '0',
      transactionCount: body.transactionCount || 0,
      firstSeen: body.firstSeen || new Date().toISOString(),
      lastSeen: body.lastSeen || new Date().toISOString(),
      riskScore: body.riskScore || 0,
      riskLevel: body.riskLevel || 'low',
      tags: body.tags || [],
    };

    // 在实际应用中，这里会将地址保存到数据库
    // mockAddresses.push(newAddress);

    return createResponse(newAddress, 201);
  } catch (error) {
    return createResponse({ error: 'Invalid request body' }, 400);
  }
}

module.exports = {
  GET,
  POST,
  mockAddresses,
  mockTransactionHistory,
  mockRiskAnalysis,
};
