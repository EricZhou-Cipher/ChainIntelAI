const request = require('supertest');
const { createServer } = require('http');
const addressesHandler = require('../../app/api/addresses/route');

describe('地址 API 测试', () => {
  let server;
  let originalGet;
  let originalPost;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    // 保存原始的GET方法以便后续恢复
    originalGet = addressesHandler.GET;
    originalPost = addressesHandler.POST;

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
            result = await addressesHandler.GET(nextReq);
          } else if (req.method === 'POST') {
            result = await addressesHandler.POST(nextReq);
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
    // 恢复原始的GET方法
    addressesHandler.GET = originalGet;
    addressesHandler.POST = originalPost;
    if (server) server.close(done);
  });

  // 每个测试后恢复原始的GET方法
  afterEach(() => {
    addressesHandler.GET = originalGet;
    addressesHandler.POST = originalPost;
  });

  test('GET /api/addresses 返回地址列表', async () => {
    const res = await request(server)
      .get('/api/addresses')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('addresses');
    expect(Array.isArray(res.body.addresses)).toBe(true);
  });

  test('GET /api/addresses?limit=2 返回限制数量的地址', async () => {
    const res = await request(server)
      .get('/api/addresses?limit=2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('addresses');
    expect(res.body.addresses.length).toBeLessThanOrEqual(2);
  });

  test('GET /api/addresses?riskLevel=high 返回特定风险等级的地址', async () => {
    const res = await request(server)
      .get('/api/addresses?riskLevel=high')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('addresses');

    // 验证所有返回的地址都是高风险
    res.body.addresses.forEach(address => {
      expect(address.riskLevel).toBe('high');
    });
  });

  test('GET /api/addresses/[address] 返回特定地址详情', async () => {
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

    const res = await request(server)
      .get(`/api/addresses/${testAddress}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('address', testAddress);
    expect(res.body).toHaveProperty('balance');
    expect(res.body).toHaveProperty('transactionCount');
    expect(res.body).toHaveProperty('riskScore');
    expect(res.body).toHaveProperty('riskLevel');
  });

  test('GET /api/addresses/[address]/transactions 返回地址的交易历史', async () => {
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

    const res = await request(server)
      .get(`/api/addresses/${testAddress}/transactions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('transactions');
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  test('GET /api/addresses/invalid-address 处理无效地址', async () => {
    const invalidAddress = 'invalid-address';

    await request(server)
      .get(`/api/addresses/${invalidAddress}`)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('GET /api/addresses/0x0000000000000000000000000000000000000000 处理不存在的地址', async () => {
    const nonExistentAddress = '0x0000000000000000000000000000000000000000';

    await request(server)
      .get(`/api/addresses/${nonExistentAddress}`)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  test('GET /api/addresses/[address]/risk 返回地址风险分析', async () => {
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

    const res = await request(server)
      .get(`/api/addresses/${testAddress}/risk`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('riskScore');
    expect(res.body).toHaveProperty('riskLevel');
    expect(res.body).toHaveProperty('riskFactors');
    expect(Array.isArray(res.body.riskFactors)).toBe(true);
  });

  test('POST /api/addresses 创建新地址', async () => {
    const newAddress = {
      address: '0x1111222233334444555566667777888899990000',
      balance: '10.5',
      transactionCount: 5,
      riskScore: 30,
      riskLevel: 'medium',
      tags: ['测试地址'],
    };

    const res = await request(server)
      .post('/api/addresses')
      .send(newAddress)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).toHaveProperty('address', newAddress.address);
    expect(res.body).toHaveProperty('balance', newAddress.balance);
    expect(res.body).toHaveProperty('riskLevel', newAddress.riskLevel);
  });

  test('POST /api/addresses 处理无效地址格式', async () => {
    const invalidAddress = {
      address: 'invalid-address',
      balance: '10.5',
    };

    await request(server)
      .post('/api/addresses')
      .send(invalidAddress)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  // 新增测试：数据库连接失败
  test('GET /api/addresses 数据库连接失败', async () => {
    // 模拟GET方法抛出数据库连接错误
    addressesHandler.GET = jest.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const res = await request(server)
      .get('/api/addresses')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：处理多种非法地址格式
  test('POST /api/addresses 处理多种非法地址格式', async () => {
    const invalidAddresses = [
      'invalid_address',
      '1234567890abcdef',
      '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      '0x123',
    ];

    for (const invalidAddr of invalidAddresses) {
      const res = await request(server)
        .post('/api/addresses')
        .send({ address: invalidAddr, balance: '10.5' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Invalid Ethereum address format');
    }
  });

  // 新增测试：处理缺少必要字段
  test('POST /api/addresses 处理缺少必要字段', async () => {
    // 注意：在当前实现中，只有address是必需的，其他字段都有默认值
    const res = await request(server)
      .post('/api/addresses')
      .send({ address: '0x9999888877776666555544443333222211110000' }) // 使用一个新地址，避免409冲突
      .expect('Content-Type', /json/)
      .expect(201); // 当前实现中，其他字段都有默认值，所以返回201

    // 验证默认值是否被正确设置
    expect(res.body).toHaveProperty('balance', '0');
    expect(res.body).toHaveProperty('riskLevel', 'low');
    expect(res.body).toHaveProperty('tags');
    expect(Array.isArray(res.body.tags)).toBe(true);
  });

  // 新增测试：并发请求
  test('GET /api/addresses 并发请求', async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(server).get('/api/addresses').expect(200)
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => {
      expect(res.body).toHaveProperty('addresses');
      expect(Array.isArray(res.body.addresses)).toBe(true);
    });
  });
});
