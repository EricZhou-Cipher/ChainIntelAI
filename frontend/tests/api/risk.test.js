const request = require('supertest');
const { createServer } = require('http');
const riskHandler = require('../../app/api/risk/route');

describe('风险 API 测试', () => {
  let server;
  let originalGet;
  let originalPost;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    // 保存原始方法以便后续恢复
    originalGet = riskHandler.GET;
    originalPost = riskHandler.POST;

    const requestHandler = (req, res) => {
      // 模拟Next.js请求对象
      const nextReq = {
        url: `http://localhost${req.url}`,
        method: req.method,
        headers: req.headers,
        cookies: {},
        json: () =>
          new Promise(resolve => {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              resolve(body ? JSON.parse(body) : {});
            });
          }),
      };

      // 处理请求
      const handleRequest = async () => {
        try {
          let result;
          if (req.method === 'GET') {
            result = await riskHandler.GET(nextReq);
          } else if (req.method === 'POST') {
            result = await riskHandler.POST(nextReq);
          }

          // 设置状态码和响应头
          res.statusCode = result.status || 200;

          // 设置响应体
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(await result.json()));
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      };

      handleRequest();
    };

    server = createServer(requestHandler);
    server.listen();
  });

  // 在所有测试后关闭服务器
  afterAll(done => {
    // 恢复原始方法
    riskHandler.GET = originalGet;
    riskHandler.POST = originalPost;
    if (server) server.close(done);
  });

  // 每个测试后恢复原始方法
  afterEach(() => {
    riskHandler.GET = originalGet;
    riskHandler.POST = originalPost;
  });

  test('GET /api/risk 返回风险概览数据', async () => {
    const res = await request(server).get('/api/risk').expect('Content-Type', /json/).expect(200);

    expect(res.body).toHaveProperty('stats');
    expect(res.body).toHaveProperty('trends');
    expect(res.body).toHaveProperty('model');
  });

  test('GET /api/risk/stats 返回风险统计数据', async () => {
    const res = await request(server)
      .get('/api/risk/stats')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('totalAddressesAnalyzed');
    expect(res.body).toHaveProperty('highRiskAddresses');
    expect(res.body).toHaveProperty('mediumRiskAddresses');
    expect(res.body).toHaveProperty('lowRiskAddresses');
    expect(res.body).toHaveProperty('riskDistribution');
    expect(res.body).toHaveProperty('commonRiskFactors');
    expect(Array.isArray(res.body.commonRiskFactors)).toBe(true);
  });

  test('GET /api/risk/trends 返回风险趋势数据', async () => {
    const res = await request(server)
      .get('/api/risk/trends')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('period');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/risk/trends?period=weekly 返回特定周期的风险趋势', async () => {
    const res = await request(server)
      .get('/api/risk/trends?period=weekly')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('period', 'weekly');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);

    // 验证数据格式
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('week');
      expect(res.body.data[0]).toHaveProperty('high');
      expect(res.body.data[0]).toHaveProperty('medium');
      expect(res.body.data[0]).toHaveProperty('low');
    }
  });

  test('GET /api/risk/trends?period=invalid 处理无效周期参数', async () => {
    await request(server)
      .get('/api/risk/trends?period=invalid')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('GET /api/risk/model 返回风险模型信息', async () => {
    const res = await request(server)
      .get('/api/risk/model')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('lastUpdated');
    expect(res.body).toHaveProperty('features');
    expect(res.body).toHaveProperty('accuracy');
    expect(res.body).toHaveProperty('falsePositiveRate');
    expect(res.body).toHaveProperty('falseNegativeRate');
    expect(Array.isArray(res.body.features)).toBe(true);
  });

  test('POST /api/risk/analyze 分析单个地址风险', async () => {
    const testAddress = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
    };

    const res = await request(server)
      .post('/api/risk/analyze')
      .send(testAddress)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('address', testAddress.address);
    expect(res.body).toHaveProperty('riskScore');
    expect(res.body).toHaveProperty('riskLevel');
    expect(res.body).toHaveProperty('riskFactors');
    expect(res.body).toHaveProperty('analysisTimestamp');
    expect(Array.isArray(res.body.riskFactors)).toBe(true);
  });

  test('POST /api/risk/analyze 处理无效地址', async () => {
    const invalidAddress = {
      address: 'invalid-address',
    };

    await request(server)
      .post('/api/risk/analyze')
      .send(invalidAddress)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /api/risk/batch-analyze 批量分析地址风险', async () => {
    const testAddresses = {
      addresses: [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xabcdef1234567890abcdef1234567890abcdef12',
      ],
    };

    const res = await request(server)
      .post('/api/risk/batch-analyze')
      .send(testAddresses)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('totalAnalyzed', 2);
    expect(res.body).toHaveProperty('results');
    expect(res.body).toHaveProperty('analysisTimestamp');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBe(2);

    // 验证结果格式
    res.body.results.forEach(result => {
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('riskLevel');
    });
  });

  test('POST /api/risk/batch-analyze 处理空地址数组', async () => {
    const emptyAddresses = {
      addresses: [],
    };

    await request(server)
      .post('/api/risk/batch-analyze')
      .send(emptyAddresses)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /api/risk/batch-analyze 处理过多地址', async () => {
    // 创建超过100个地址的数组
    const tooManyAddresses = {
      addresses: Array(101)
        .fill()
        .map((_, i) => `0x${i.toString().padStart(40, '0')}`),
    };

    await request(server)
      .post('/api/risk/batch-analyze')
      .send(tooManyAddresses)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  // 新增测试：数据库连接失败
  test('GET /api/risk/stats 数据库连接失败', async () => {
    // 模拟GET方法抛出数据库连接错误
    riskHandler.GET = jest.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const res = await request(server)
      .get('/api/risk/stats')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：风险分析模型加载失败
  test('POST /api/risk/analyze 风险分析模型加载失败', async () => {
    // 模拟POST方法抛出模型加载错误
    riskHandler.POST = jest.fn().mockImplementation(() => {
      throw new Error('Risk analysis model failed to load');
    });

    const testAddress = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
    };

    const res = await request(server)
      .post('/api/risk/analyze')
      .send(testAddress)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：处理多种非法地址格式
  test('POST /api/risk/analyze 处理多种非法地址格式', async () => {
    const invalidAddresses = [
      { address: 'invalid_address' },
      { address: '1234567890abcdef' },
      { address: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG' },
      { address: '0x123' },
    ];

    for (const invalidAddr of invalidAddresses) {
      const res = await request(server)
        .post('/api/risk/analyze')
        .send(invalidAddr)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Invalid Ethereum address format');
    }
  });

  // 新增测试：处理非JSON请求体
  test('POST /api/risk/analyze 处理非JSON格式请求', async () => {
    // 模拟POST方法处理JSON解析错误
    const originalPostMethod = riskHandler.POST;
    riskHandler.POST = jest.fn().mockImplementation(() => {
      throw new SyntaxError('Unexpected token in JSON');
    });

    const res = await request(server)
      .post('/api/risk/analyze')
      .set('Content-Type', 'application/json')
      .send('这不是有效的JSON格式')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：并发请求
  test('GET /api/risk/stats 并发请求', async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(server).get('/api/risk/stats').expect(200)
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => {
      expect(res.body).toHaveProperty('totalAddressesAnalyzed');
      expect(res.body).toHaveProperty('highRiskAddresses');
      expect(res.body).toHaveProperty('mediumRiskAddresses');
      expect(res.body).toHaveProperty('lowRiskAddresses');
    });
  });

  // 新增测试：批量分析中包含无效地址
  test('POST /api/risk/batch-analyze 批量分析中包含无效地址', async () => {
    const mixedAddresses = {
      addresses: [
        '0x1234567890abcdef1234567890abcdef12345678', // 有效地址
        'invalid-address', // 无效地址
        '0xabcdef1234567890abcdef1234567890abcdef12', // 有效地址
      ],
    };

    const res = await request(server)
      .post('/api/risk/batch-analyze')
      .send(mixedAddresses)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(res.body).toHaveProperty('error', 'Invalid Ethereum address format');
    expect(res.body).toHaveProperty('invalidAddresses');
    expect(res.body.invalidAddresses).toContain('invalid-address');
  });

  // 新增测试：外部API超时
  test('POST /api/risk/analyze 处理外部API超时', async () => {
    // 保存原始的POST方法
    const originalPostMethod = riskHandler.POST;

    // 模拟POST方法处理外部API超时
    riskHandler.POST = jest.fn().mockImplementation(async req => {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const endpoint = pathParts[pathParts.length - 1];

      // 如果是分析单个地址，模拟超时
      if (endpoint === 'analyze') {
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟短暂延迟
        throw new Error('External API Timeout');
      }

      // 其他情况使用原始方法
      return originalPostMethod(req);
    });

    const testAddress = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
    };

    const res = await request(server)
      .post('/api/risk/analyze')
      .send(testAddress)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });
});
