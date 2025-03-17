// 模拟交易数据
const mockTransactions = [
  {
    id: 'tx123456',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    value: '1.5',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    blockNumber: 12345678,
    status: 'confirmed',
    gasUsed: '21000',
    gasPrice: '50',
    type: 'transfer',
  },
  {
    id: 'tx123457',
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    from: '0xabcdef1234567890abcdef1234567890abcdef12',
    to: '0x9876543210fedcba9876543210fedcba98765432',
    value: '0.75',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    blockNumber: 12345677,
    status: 'confirmed',
    gasUsed: '21000',
    gasPrice: '45',
    type: 'transfer',
  },
  {
    id: 'tx123458',
    hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    from: '0x9876543210fedcba9876543210fedcba98765432',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    value: '2.25',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    blockNumber: 12345676,
    status: 'confirmed',
    gasUsed: '21000',
    gasPrice: '55',
    type: 'transfer',
  },
  {
    id: 'tx123459',
    hash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xfedcba9876543210fedcba9876543210fedcba98',
    value: '0.5',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    blockNumber: 12345675,
    status: 'confirmed',
    gasUsed: '21000',
    gasPrice: '40',
    type: 'transfer',
  },
  {
    id: 'tx123460',
    hash: '0x5432109876fedcba5432109876fedcba5432109876fedcba5432109876fedcba',
    from: '0xfedcba9876543210fedcba9876543210fedcba98',
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    value: '1.0',
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    blockNumber: 12345674,
    status: 'confirmed',
    gasUsed: '21000',
    gasPrice: '60',
    type: 'transfer',
  },
];

// 创建自定义响应对象，兼容测试环境
function createResponse(data, status = 200) {
  const response = {
    status: status,
    json: async () => data,
  };
  return response;
}

// GET 处理函数 - 获取交易列表或特定交易
async function GET(request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const address = searchParams.get('address');
  const limit = searchParams.get('limit');

  // 从URL路径中提取交易哈希（如果有）
  const pathParts = url.pathname.split('/');
  const txIndex = pathParts.indexOf('transactions');
  const txHash = txIndex + 1 < pathParts.length ? pathParts[txIndex + 1] : null;

  // 如果URL包含特定交易哈希
  if (txHash) {
    const transaction = mockTransactions.find(tx => tx.hash === txHash);

    if (!transaction) {
      return createResponse({ error: 'Transaction not found' }, 404);
    }

    return createResponse(transaction);
  }

  // 过滤交易
  let filteredTransactions = mockTransactions;

  // 按地址过滤
  if (address) {
    filteredTransactions = filteredTransactions.filter(
      tx => tx.from === address || tx.to === address
    );
  }

  // 限制返回的交易数量
  if (limit && !isNaN(parseInt(limit))) {
    filteredTransactions = filteredTransactions.slice(0, parseInt(limit));
  }

  return createResponse({ transactions: filteredTransactions });
}

// POST 处理函数 - 创建新交易
async function POST(request) {
  try {
    const body = await request.json();

    // 验证必要字段
    if (!body.from || !body.to || !body.value) {
      return createResponse({ error: 'Missing required fields: from, to, value' }, 400);
    }

    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.from) || !/^0x[a-fA-F0-9]{40}$/.test(body.to)) {
      return createResponse({ error: 'Invalid Ethereum address format' }, 400);
    }

    // 验证交易金额
    if (isNaN(parseFloat(body.value)) || parseFloat(body.value) <= 0) {
      return createResponse({ error: 'Value must be a positive number' }, 400);
    }

    // 创建新交易
    const newTransaction = {
      id: `tx${Math.floor(Math.random() * 90000) + 10000}`,
      hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      from: body.from,
      to: body.to,
      value: body.value.toString(),
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(Math.random() * 1000000) + 12000000,
      status: 'pending',
      gasUsed: body.gasUsed || '21000',
      gasPrice: body.gasPrice || '50',
      type: body.type || 'transfer',
    };

    // 在实际应用中，这里会将交易保存到数据库
    // mockTransactions.push(newTransaction);

    return createResponse(newTransaction, 201);
  } catch (error) {
    return createResponse({ error: 'Invalid request body' }, 400);
  }
}

module.exports = {
  GET,
  POST,
  mockTransactions,
};
