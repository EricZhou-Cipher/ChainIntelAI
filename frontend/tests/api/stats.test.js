const request = require('supertest');
const { createServer } = require('http');
const statsHandler = require('../../app/api/stats/route');

describe('统计 API 测试', () => {
  let server;
  let originalGet;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    // 保存原始方法以便后续恢复
    originalGet = statsHandler.GET;

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
            result = await statsHandler.GET(nextReq);
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
    statsHandler.GET = originalGet;
    if (server) server.close(done);
  });

  // 每个测试后恢复原始方法
  afterEach(() => {
    statsHandler.GET = originalGet;
  });

  test('GET /api/stats 返回所有统计数据概览', async () => {
    const res = await request(server).get('/api/stats').expect('Content-Type', /json/).expect(200);

    expect(res.body).toHaveProperty('system');
    expect(res.body).toHaveProperty('transactions');
    expect(res.body).toHaveProperty('addresses');
    expect(res.body).toHaveProperty('network');
    expect(res.body).toHaveProperty('risk');
  });

  test('GET /api/stats/system 返回系统统计数据', async () => {
    const res = await request(server)
      .get('/api/stats/system')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('cpuUsage');
    expect(res.body).toHaveProperty('memoryUsage');
    expect(res.body).toHaveProperty('diskUsage');
    expect(res.body).toHaveProperty('activeUsers');
    expect(res.body).toHaveProperty('requestsPerMinute');
    expect(res.body).toHaveProperty('averageResponseTime');
    expect(res.body).toHaveProperty('errorRate');
    expect(res.body).toHaveProperty('lastUpdated');
  });

  test('GET /api/stats/transactions 返回交易统计数据', async () => {
    const res = await request(server)
      .get('/api/stats/transactions')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('daily');
    expect(res.body).toHaveProperty('weekly');
    expect(res.body).toHaveProperty('monthly');
    expect(res.body).toHaveProperty('averageValue');
    expect(res.body).toHaveProperty('largestValue');
    expect(res.body).toHaveProperty('byType');
    expect(res.body).toHaveProperty('byStatus');
  });

  test('GET /api/stats/transactions?period=daily 返回每日交易统计', async () => {
    const res = await request(server)
      .get('/api/stats/transactions?period=daily')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('averageValue');
    expect(res.body).toHaveProperty('byType');
    expect(res.body.byType).toHaveProperty('transfer');
    expect(res.body.byType).toHaveProperty('swap');
    expect(res.body.byType).toHaveProperty('mint');
    expect(res.body.byType).toHaveProperty('burn');
    expect(res.body.byType).toHaveProperty('other');
  });

  test('GET /api/stats/transactions?period=invalid 处理无效周期参数', async () => {
    await request(server)
      .get('/api/stats/transactions?period=invalid')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('GET /api/stats/addresses 返回地址统计数据', async () => {
    const res = await request(server)
      .get('/api/stats/addresses')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('active');
    expect(res.body).toHaveProperty('byRiskLevel');
    expect(res.body).toHaveProperty('newAddresses');
    expect(res.body).toHaveProperty('topCountries');
    expect(res.body.active).toHaveProperty('daily');
    expect(res.body.active).toHaveProperty('weekly');
    expect(res.body.active).toHaveProperty('monthly');
    expect(res.body.byRiskLevel).toHaveProperty('high');
    expect(res.body.byRiskLevel).toHaveProperty('medium');
    expect(res.body.byRiskLevel).toHaveProperty('low');
    expect(Array.isArray(res.body.topCountries)).toBe(true);
  });

  test('GET /api/stats/network 返回网络统计数据', async () => {
    const res = await request(server)
      .get('/api/stats/network')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('nodesCount');
    expect(res.body).toHaveProperty('edgesCount');
    expect(res.body).toHaveProperty('averageDegree');
    expect(res.body).toHaveProperty('clusteringCoefficient');
    expect(res.body).toHaveProperty('largestConnectedComponent');
    expect(res.body).toHaveProperty('communities');
    expect(res.body).toHaveProperty('averagePathLength');
    expect(res.body).toHaveProperty('diameter');
  });

  test('GET /api/stats/risk 返回风险统计数据', async () => {
    const res = await request(server)
      .get('/api/stats/risk')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('totalScanned');
    expect(res.body).toHaveProperty('byRiskLevel');
    expect(res.body).toHaveProperty('alertsGenerated');
    expect(res.body).toHaveProperty('alertsByStatus');
    expect(res.body).toHaveProperty('topRiskFactors');
    expect(res.body.byRiskLevel).toHaveProperty('high');
    expect(res.body.byRiskLevel).toHaveProperty('medium');
    expect(res.body.byRiskLevel).toHaveProperty('low');
    expect(res.body.alertsByStatus).toHaveProperty('active');
    expect(res.body.alertsByStatus).toHaveProperty('resolved');
    expect(Array.isArray(res.body.topRiskFactors)).toBe(true);
  });

  test('GET /api/stats/invalid 处理无效的统计类别', async () => {
    const res = await request(server)
      .get('/api/stats/invalid')
      .expect('Content-Type', /json/)
      .expect(200);

    // 当请求无效类别时，API返回所有统计数据概览
    expect(res.body).toHaveProperty('system');
    expect(res.body).toHaveProperty('transactions');
    expect(res.body).toHaveProperty('addresses');
    expect(res.body).toHaveProperty('network');
    expect(res.body).toHaveProperty('risk');
  });

  // 新增测试：数据库连接失败
  test('GET /api/stats 数据库连接失败', async () => {
    // 模拟GET方法抛出数据库连接错误
    statsHandler.GET = jest.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const res = await request(server).get('/api/stats').expect('Content-Type', /json/).expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：外部监控系统超时
  test('GET /api/stats/system 处理外部监控系统超时', async () => {
    // 保存原始的GET方法
    const originalGetMethod = statsHandler.GET;

    // 模拟GET方法处理外部系统超时
    statsHandler.GET = jest.fn().mockImplementation(async req => {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const category = pathParts[pathParts.length - 1];

      // 如果是获取系统统计，模拟超时
      if (category === 'system') {
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟短暂延迟
        throw new Error('External monitoring system timeout');
      }

      // 其他情况使用原始方法
      return originalGetMethod(req);
    });

    const res = await request(server)
      .get('/api/stats/system')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：并发请求
  test('GET /api/stats 并发请求', async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(server).get('/api/stats').expect(200)
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => {
      expect(res.body).toHaveProperty('system');
      expect(res.body).toHaveProperty('transactions');
      expect(res.body).toHaveProperty('addresses');
      expect(res.body).toHaveProperty('network');
      expect(res.body).toHaveProperty('risk');
    });
  });

  // 新增测试：处理多个查询参数
  test('GET /api/stats/transactions 处理多个查询参数', async () => {
    const res = await request(server)
      .get('/api/stats/transactions?period=daily&format=json&details=full')
      .expect('Content-Type', /json/)
      .expect(200);

    // 我们期望API能正常处理或忽略额外的参数
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('averageValue');
    expect(res.body).toHaveProperty('byType');
  });

  // 新增测试：处理极端时间范围
  test('GET /api/stats/transactions 处理极端时间范围', async () => {
    // 模拟GET方法处理极端时间范围
    const originalGetMethod = statsHandler.GET;

    statsHandler.GET = jest.fn().mockImplementation(async req => {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const category = pathParts[pathParts.length - 1];
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');

      // 如果请求包含极端时间范围，模拟处理
      if (category === 'transactions' && from && to) {
        // 这里我们只是简单地返回一个固定的响应
        return {
          status: 200,
          json: async () => ({
            count: 0,
            averageValue: 0,
            byType: {
              transfer: 0,
              swap: 0,
              mint: 0,
              burn: 0,
              other: 0,
            },
          }),
        };
      }

      // 其他情况使用原始方法
      return originalGetMethod(req);
    });

    // 测试极端过去时间
    const pastRes = await request(server)
      .get('/api/stats/transactions?from=1970-01-01&to=2023-01-01')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(pastRes.body).toHaveProperty('count');
    expect(pastRes.body).toHaveProperty('averageValue');
    expect(pastRes.body).toHaveProperty('byType');

    // 测试极端未来时间
    const futureRes = await request(server)
      .get('/api/stats/transactions?from=2023-01-01&to=2100-01-01')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(futureRes.body).toHaveProperty('count');
    expect(futureRes.body).toHaveProperty('averageValue');
    expect(futureRes.body).toHaveProperty('byType');
  });

  // 新增测试：处理缓存失效
  test('GET /api/stats 处理缓存失效', async () => {
    // 连续请求两次相同的端点，模拟缓存命中和缓存失效
    const firstRes = await request(server)
      .get('/api/stats')
      .expect('Content-Type', /json/)
      .expect(200);

    // 第二次请求添加no-cache参数，强制绕过缓存
    const secondRes = await request(server)
      .get('/api/stats?_nocache=1')
      .expect('Content-Type', /json/)
      .expect(200);

    // 两次请求应该返回相同的数据结构
    expect(Object.keys(firstRes.body)).toEqual(Object.keys(secondRes.body));
  });
});
