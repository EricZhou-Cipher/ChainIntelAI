// 模拟数据库中的警报数据
const mockAlerts = [
  {
    id: '12345',
    title: '可疑交易模式',
    description: '检测到地址0x1234...进行了多次小额转账',
    severity: 'medium',
    status: 'active',
    timestamp: new Date().toISOString(),
    relatedAddresses: ['0x1234567890abcdef1234567890abcdef12345678'],
  },
  {
    id: '12346',
    title: '与黑名单地址交互',
    description: '地址0xabcd...与已知的黑名单地址进行了交互',
    severity: 'high',
    status: 'active',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    relatedAddresses: ['0xabcdef1234567890abcdef1234567890abcdef12'],
  },
  {
    id: '12347',
    title: '异常大额交易',
    description: '地址0x9876...在短时间内进行了异常大额交易',
    severity: 'high',
    status: 'resolved',
    resolution: '经过调查，确认为正常交易行为',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    relatedAddresses: ['0x9876543210fedcba9876543210fedcba98765432'],
  },
  {
    id: '12348',
    title: '新的混币活动',
    description: '检测到地址0x1234...参与了混币活动',
    severity: 'high',
    status: 'active',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    relatedAddresses: ['0x1234567890abcdef1234567890abcdef12345678'],
  },
  {
    id: '12349',
    title: '异常交易频率',
    description: '地址0xabcd...的交易频率突然增加',
    severity: 'low',
    status: 'active',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    relatedAddresses: ['0xabcdef1234567890abcdef1234567890abcdef12'],
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

// GET 处理函数 - 获取警报列表或特定警报
async function GET(request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const limit = searchParams.get('limit');
  const severity = searchParams.get('severity');
  const status = searchParams.get('status');

  // 从URL路径中提取警报ID（如果有）
  const pathParts = url.pathname.split('/');
  const alertsIndex = pathParts.indexOf('alerts');
  const alertId = alertsIndex + 1 < pathParts.length ? pathParts[alertsIndex + 1] : null;

  // 如果URL包含特定警报ID
  if (alertId && alertId !== 'stats') {
    const alert = mockAlerts.find(a => a.id === alertId);

    if (!alert) {
      return createResponse({ error: 'Alert not found' }, 404);
    }

    return createResponse(alert);
  }

  // 如果请求是获取警报统计信息
  if (alertId === 'stats') {
    const total = mockAlerts.length;

    // 按严重程度统计
    const bySeverity = {
      high: mockAlerts.filter(a => a.severity === 'high').length,
      medium: mockAlerts.filter(a => a.severity === 'medium').length,
      low: mockAlerts.filter(a => a.severity === 'low').length,
    };

    // 按状态统计
    const byStatus = {
      active: mockAlerts.filter(a => a.status === 'active').length,
      resolved: mockAlerts.filter(a => a.status === 'resolved').length,
    };

    return createResponse({
      total,
      bySeverity,
      byStatus,
    });
  }

  // 过滤警报
  let filteredAlerts = mockAlerts;

  // 按严重程度过滤
  if (severity) {
    if (!['high', 'medium', 'low'].includes(severity)) {
      return createResponse({ error: 'Invalid severity. Must be one of: high, medium, low' }, 400);
    }

    filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
  }

  // 按状态过滤
  if (status) {
    if (!['active', 'resolved'].includes(status)) {
      return createResponse({ error: 'Invalid status. Must be one of: active, resolved' }, 400);
    }

    filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
  }

  // 限制返回的警报数量
  if (limit && !isNaN(parseInt(limit))) {
    filteredAlerts = filteredAlerts.slice(0, parseInt(limit));
  }

  return createResponse({ alerts: filteredAlerts });
}

// POST 处理函数 - 创建新警报
async function POST(request) {
  try {
    const body = await request.json();

    // 验证必要字段
    if (!body.title || !body.description || !body.severity || !body.relatedAddresses) {
      return createResponse(
        { error: 'Missing required fields: title, description, severity, relatedAddresses' },
        400
      );
    }

    // 验证严重程度
    if (!['high', 'medium', 'low'].includes(body.severity)) {
      return createResponse({ error: 'Invalid severity. Must be one of: high, medium, low' }, 400);
    }

    // 验证相关地址
    if (!Array.isArray(body.relatedAddresses) || body.relatedAddresses.length === 0) {
      return createResponse({ error: 'relatedAddresses must be a non-empty array' }, 400);
    }

    // 创建新警报
    const newAlert = {
      id: Math.floor(Math.random() * 90000) + 10000 + '', // 生成随机ID
      title: body.title,
      description: body.description,
      severity: body.severity,
      status: 'active',
      timestamp: new Date().toISOString(),
      relatedAddresses: body.relatedAddresses,
    };

    // 在实际应用中，这里会将警报保存到数据库
    // mockAlerts.push(newAlert);

    return createResponse(newAlert, 201);
  } catch (error) {
    return createResponse({ error: 'Invalid request body' }, 400);
  }
}

// PUT 处理函数 - 更新警报状态
async function PUT(request) {
  try {
    // 从URL路径中提取警报ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const alertsIndex = pathParts.indexOf('alerts');
    const alertId = alertsIndex + 1 < pathParts.length ? pathParts[alertsIndex + 1] : null;

    if (!alertId) {
      return createResponse({ error: 'Alert ID is required' }, 400);
    }

    const alert = mockAlerts.find(a => a.id === alertId);

    if (!alert) {
      return createResponse({ error: 'Alert not found' }, 404);
    }

    const body = await request.json();

    // 验证状态
    if (body.status && !['active', 'resolved'].includes(body.status)) {
      return createResponse({ error: 'Invalid status. Must be one of: active, resolved' }, 400);
    }

    // 更新警报
    const updatedAlert = {
      ...alert,
      status: body.status || alert.status,
      resolution: body.resolution || alert.resolution,
    };

    // 在实际应用中，这里会将更新后的警报保存到数据库
    // const index = mockAlerts.findIndex(a => a.id === alertId);
    // mockAlerts[index] = updatedAlert;

    return createResponse(updatedAlert);
  } catch (error) {
    return createResponse({ error: 'Invalid request body' }, 400);
  }
}

// DELETE 处理函数 - 删除警报
async function DELETE(request) {
  // 从URL路径中提取警报ID
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const alertsIndex = pathParts.indexOf('alerts');
  const alertId = alertsIndex + 1 < pathParts.length ? pathParts[alertsIndex + 1] : null;

  if (!alertId) {
    return createResponse({ error: 'Alert ID is required' }, 400);
  }

  const alert = mockAlerts.find(a => a.id === alertId);

  if (!alert) {
    return createResponse({ error: 'Alert not found' }, 404);
  }

  // 在实际应用中，这里会从数据库中删除警报
  // const index = mockAlerts.findIndex(a => a.id === alertId);
  // mockAlerts.splice(index, 1);

  // 返回204状态码（无内容）
  return createResponse(null, 204);
}

module.exports = {
  GET,
  POST,
  PUT,
  DELETE,
  mockAlerts,
};
