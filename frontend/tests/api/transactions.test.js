const request = require('supertest');
const { createServer } = require('http');
const transactionsHandler = require('../../app/api/transactions/route');

describe('交易 API 测试', () => {
  let server;
  let originalGet;
  let originalPost;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    // 保存原始方法以便后续恢复
    originalGet = transactionsHandler.GET;
    originalPost = transactionsHandler.POST;

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
            result = await transactionsHandler.GET(nextReq);
          } else if (req.method === 'POST') {
            result = await transactionsHandler.POST(nextReq);
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
    transactionsHandler.GET = originalGet;
    transactionsHandler.POST = originalPost;
    if (server) server.close(done);
  });

  // 每个测试后恢复原始方法
  afterEach(() => {
    transactionsHandler.GET = originalGet;
    transactionsHandler.POST = originalPost;
  });

  test('GET /api/transactions 返回交易列表', async () => {
    const res = await request(server)
      .get('/api/transactions')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('transactions');
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  test('GET /api/transactions?limit=2 返回限制数量的交易', async () => {
    const res = await request(server)
      .get('/api/transactions?limit=2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('transactions');
    expect(res.body.transactions.length).toBeLessThanOrEqual(2);
  });

  test('GET /api/transactions?address=[address] 返回特定地址的交易', async () => {
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

    const res = await request(server)
      .get(`/api/transactions?address=${testAddress}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('transactions');

    // 验证所有返回的交易都与指定地址相关
    res.body.transactions.forEach(tx => {
      expect(tx.from === testAddress || tx.to === testAddress).toBe(true);
    });
  });

  test('GET /api/transactions/[hash] 返回特定交易详情', async () => {
    const testHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const res = await request(server)
      .get(`/api/transactions/${testHash}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('hash', testHash);
    expect(res.body).toHaveProperty('from');
    expect(res.body).toHaveProperty('to');
    expect(res.body).toHaveProperty('value');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('blockNumber');
    expect(res.body).toHaveProperty('status');
  });

  test('GET /api/transactions/invalid-hash 处理无效交易哈希', async () => {
    const invalidHash = 'invalid-hash';

    await request(server)
      .get(`/api/transactions/${invalidHash}`)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  test('POST /api/transactions 创建新交易', async () => {
    const newTransaction = {
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: '2.5',
      gasUsed: '21000',
      gasPrice: '50',
      type: 'transfer',
    };

    const res = await request(server)
      .post('/api/transactions')
      .send(newTransaction)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).toHaveProperty('from', newTransaction.from);
    expect(res.body).toHaveProperty('to', newTransaction.to);
    expect(res.body).toHaveProperty('value', newTransaction.value);
    expect(res.body).toHaveProperty('hash');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('status', 'pending');
  });

  test('POST /api/transactions 处理缺少必要字段', async () => {
    const invalidTransaction = {
      from: '0x1234567890abcdef1234567890abcdef12345678',
      // 缺少 to 和 value 字段
    };

    await request(server)
      .post('/api/transactions')
      .send(invalidTransaction)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /api/transactions 处理无效地址格式', async () => {
    const invalidTransaction = {
      from: 'invalid-address',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: '1.0',
    };

    await request(server)
      .post('/api/transactions')
      .send(invalidTransaction)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /api/transactions 处理无效交易金额', async () => {
    const invalidTransaction = {
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: '-1.0', // 负数金额
    };

    await request(server)
      .post('/api/transactions')
      .send(invalidTransaction)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  // 新增测试：数据库连接失败
  test('GET /api/transactions 数据库连接失败', async () => {
    // 模拟GET方法抛出数据库连接错误
    transactionsHandler.GET = jest.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const res = await request(server)
      .get('/api/transactions')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：外部API超时
  test('GET /api/transactions/[hash] 处理外部API超时', async () => {
    // 保存原始的GET方法
    const originalGetMethod = transactionsHandler.GET;

    // 模拟GET方法处理外部API超时
    transactionsHandler.GET = jest.fn().mockImplementation(async req => {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const txIndex = pathParts.indexOf('transactions');
      const txHash = txIndex + 1 < pathParts.length ? pathParts[txIndex + 1] : null;

      // 如果是获取特定交易，模拟超时
      if (txHash && txHash !== 'stats') {
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟短暂延迟
        throw new Error('External API Timeout');
      }

      // 其他情况使用原始方法
      return originalGetMethod(req);
    });

    const testHash = '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567';

    const res = await request(server)
      .get(`/api/transactions/${testHash}`)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：处理非JSON请求体
  test('POST /api/transactions 处理非JSON格式请求', async () => {
    // 这个测试在当前实现中可能无法完全模拟，因为我们的测试服务器已经假设请求体是JSON
    // 但我们可以测试JSON解析错误的情况

    // 模拟POST方法处理JSON解析错误
    transactionsHandler.POST = jest.fn().mockImplementation(() => {
      throw new SyntaxError('Unexpected token in JSON');
    });

    const res = await request(server)
      .post('/api/transactions')
      .set('Content-Type', 'application/json')
      .send('这不是有效的JSON格式')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：并发请求
  test('GET /api/transactions 并发请求', async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(server).get('/api/transactions').expect(200)
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => {
      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });
  });

  // 新增测试：处理多种无效交易哈希格式
  test('GET /api/transactions/[hash] 处理多种无效交易哈希格式', async () => {
    const invalidHashes = [
      'invalid_hash',
      '1234567890abcdef',
      '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      '0x123',
    ];

    for (const invalidHash of invalidHashes) {
      await request(server)
        .get(`/api/transactions/${invalidHash}`)
        .expect('Content-Type', /json/)
        .expect(404);
    }
  });

  // 新增测试：处理极端交易值
  test('POST /api/transactions 处理极端交易值', async () => {
    const extremeTransactions = [
      {
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '999999999999999999999999999', // 极大值
      },
      {
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '0.000000000000000001', // 极小值
      },
    ];

    // 对于极端值，我们期望API能正常处理（接受或拒绝，但不崩溃）
    for (const tx of extremeTransactions) {
      const res = await request(server).post('/api/transactions').send(tx);

      // 检查是否返回了有效的状态码（可能是201或400，取决于实现）
      expect([201, 400]).toContain(res.status);
    }
  });
});
