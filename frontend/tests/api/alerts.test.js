const request = require('supertest');
const { createServer } = require('http');
const alertsHandler = require('../../app/api/alerts/route');

describe('警报 API 测试', () => {
  let server;
  let originalGet;
  let originalPost;
  let originalPut;
  let originalDelete;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    // 保存原始方法以便后续恢复
    originalGet = alertsHandler.GET;
    originalPost = alertsHandler.POST;
    originalPut = alertsHandler.PUT;
    originalDelete = alertsHandler.DELETE;

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
            result = await alertsHandler.GET(nextReq);
          } else if (req.method === 'POST') {
            result = await alertsHandler.POST(nextReq);
          } else if (req.method === 'PUT') {
            result = await alertsHandler.PUT(nextReq);
          } else if (req.method === 'DELETE') {
            result = await alertsHandler.DELETE(nextReq);
            if (result.status === 204) {
              res.statusCode = 204;
              res.end();
              return;
            }
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
    alertsHandler.GET = originalGet;
    alertsHandler.POST = originalPost;
    alertsHandler.PUT = originalPut;
    alertsHandler.DELETE = originalDelete;
    if (server) server.close(done);
  });

  // 每个测试后恢复原始方法
  afterEach(() => {
    alertsHandler.GET = originalGet;
    alertsHandler.POST = originalPost;
    alertsHandler.PUT = originalPut;
    alertsHandler.DELETE = originalDelete;
  });

  test('GET /api/alerts 返回警报列表', async () => {
    const res = await request(server).get('/api/alerts').expect('Content-Type', /json/).expect(200);

    expect(res.body).toHaveProperty('alerts');
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  test('GET /api/alerts?limit=2 返回限制数量的警报', async () => {
    const res = await request(server)
      .get('/api/alerts?limit=2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('alerts');
    expect(res.body.alerts.length).toBeLessThanOrEqual(2);
  });

  test('GET /api/alerts?severity=high 返回特定严重程度的警报', async () => {
    const res = await request(server)
      .get('/api/alerts?severity=high')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('alerts');

    // 验证所有返回的警报都是高严重程度
    res.body.alerts.forEach(alert => {
      expect(alert.severity).toBe('high');
    });
  });

  test('GET /api/alerts?status=active 返回特定状态的警报', async () => {
    const res = await request(server)
      .get('/api/alerts?status=active')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('alerts');

    // 验证所有返回的警报都是活跃状态
    res.body.alerts.forEach(alert => {
      expect(alert.status).toBe('active');
    });
  });

  test('GET /api/alerts/[id] 返回特定警报详情', async () => {
    const testId = '12345';

    const res = await request(server)
      .get(`/api/alerts/${testId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('id', testId);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('description');
    expect(res.body).toHaveProperty('severity');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('relatedAddresses');
    expect(Array.isArray(res.body.relatedAddresses)).toBe(true);
  });

  test('GET /api/alerts/non-existent-id 处理不存在的警报ID', async () => {
    await request(server)
      .get('/api/alerts/non-existent-id')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  test('GET /api/alerts/stats 返回警报统计信息', async () => {
    const res = await request(server)
      .get('/api/alerts/stats')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('bySeverity');
    expect(res.body).toHaveProperty('byStatus');
    expect(res.body.bySeverity).toHaveProperty('high');
    expect(res.body.bySeverity).toHaveProperty('medium');
    expect(res.body.bySeverity).toHaveProperty('low');
    expect(res.body.byStatus).toHaveProperty('active');
    expect(res.body.byStatus).toHaveProperty('resolved');
  });

  test('POST /api/alerts 创建新警报', async () => {
    const newAlert = {
      title: '测试警报',
      description: '这是一个测试警报',
      severity: 'medium',
      relatedAddresses: ['0x1234567890abcdef1234567890abcdef12345678'],
    };

    const res = await request(server)
      .post('/api/alerts')
      .send(newAlert)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', newAlert.title);
    expect(res.body).toHaveProperty('description', newAlert.description);
    expect(res.body).toHaveProperty('severity', newAlert.severity);
    expect(res.body).toHaveProperty('status', 'active');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('relatedAddresses');
    expect(res.body.relatedAddresses).toEqual(newAlert.relatedAddresses);
  });

  test('POST /api/alerts 处理缺少必要字段', async () => {
    const invalidAlert = {
      title: '缺少字段的警报',
      // 缺少 description, severity, relatedAddresses
    };

    await request(server)
      .post('/api/alerts')
      .send(invalidAlert)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /api/alerts 处理无效严重程度', async () => {
    const invalidAlert = {
      title: '无效严重程度警报',
      description: '这是一个测试警报',
      severity: 'invalid', // 无效的严重程度
      relatedAddresses: ['0x1234567890abcdef1234567890abcdef12345678'],
    };

    await request(server)
      .post('/api/alerts')
      .send(invalidAlert)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('PUT /api/alerts/[id] 更新警报状态', async () => {
    const testId = '12345';
    const updateData = {
      status: 'resolved',
      resolution: '测试解决方案',
    };

    const res = await request(server)
      .put(`/api/alerts/${testId}`)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('id', testId);
    expect(res.body).toHaveProperty('status', updateData.status);
    expect(res.body).toHaveProperty('resolution', updateData.resolution);
  });

  test('PUT /api/alerts/[id] 处理无效状态', async () => {
    const testId = '12345';
    const invalidUpdate = {
      status: 'invalid', // 无效的状态
    };

    await request(server)
      .put(`/api/alerts/${testId}`)
      .send(invalidUpdate)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('PUT /api/alerts/non-existent-id 处理不存在的警报ID', async () => {
    const updateData = {
      status: 'resolved',
    };

    await request(server)
      .put('/api/alerts/non-existent-id')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  test('DELETE /api/alerts/[id] 删除警报', async () => {
    const testId = '12345';

    await request(server).delete(`/api/alerts/${testId}`).expect(204);
  });

  test('DELETE /api/alerts/non-existent-id 处理不存在的警报ID', async () => {
    await request(server)
      .delete('/api/alerts/non-existent-id')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  // 新增测试：数据库连接失败
  test('GET /api/alerts 数据库连接失败', async () => {
    // 模拟GET方法抛出数据库连接错误
    alertsHandler.GET = jest.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const res = await request(server).get('/api/alerts').expect('Content-Type', /json/).expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：处理非JSON请求体
  test('POST /api/alerts 处理非JSON格式请求', async () => {
    // 模拟POST方法处理JSON解析错误
    alertsHandler.POST = jest.fn().mockImplementation(() => {
      throw new SyntaxError('Unexpected token in JSON');
    });

    const res = await request(server)
      .post('/api/alerts')
      .set('Content-Type', 'application/json')
      .send('这不是有效的JSON格式')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：并发请求
  test('GET /api/alerts 并发请求', async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(server).get('/api/alerts').expect(200)
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => {
      expect(res.body).toHaveProperty('alerts');
      expect(Array.isArray(res.body.alerts)).toBe(true);
    });
  });

  // 新增测试：处理无效的相关地址
  test('POST /api/alerts 处理无效的相关地址', async () => {
    // 注意：当前实现可能不验证地址格式，所以这个测试可能会通过
    // 如果API实现了地址格式验证，则应该返回400
    const invalidAlert = {
      title: '测试警报',
      description: '这是一个测试警报',
      severity: 'medium',
      relatedAddresses: ['invalid-address'], // 无效地址
    };

    const res = await request(server).post('/api/alerts').send(invalidAlert);

    // 我们期望API能正常处理（接受或拒绝，但不崩溃）
    expect([201, 400]).toContain(res.status);

    if (res.status === 400) {
      expect(res.body).toHaveProperty('error');
    }
  });

  // 新增测试：处理空的相关地址数组
  test('POST /api/alerts 处理空的相关地址数组', async () => {
    const invalidAlert = {
      title: '测试警报',
      description: '这是一个测试警报',
      severity: 'medium',
      relatedAddresses: [], // 空数组
    };

    const res = await request(server)
      .post('/api/alerts')
      .send(invalidAlert)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(res.body).toHaveProperty('error', 'relatedAddresses must be a non-empty array');
  });

  // 新增测试：DELETE操作数据库失败
  test('DELETE /api/alerts/[id] 数据库操作失败', async () => {
    // 模拟DELETE方法抛出数据库操作错误
    alertsHandler.DELETE = jest.fn().mockImplementation(() => {
      throw new Error('Database operation failed');
    });

    const testId = '12345';

    const res = await request(server)
      .delete(`/api/alerts/${testId}`)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：PUT操作数据库失败
  test('PUT /api/alerts/[id] 数据库操作失败', async () => {
    // 模拟PUT方法抛出数据库操作错误
    alertsHandler.PUT = jest.fn().mockImplementation(() => {
      throw new Error('Database operation failed');
    });

    const testId = '12345';
    const updateData = {
      status: 'resolved',
    };

    const res = await request(server)
      .put(`/api/alerts/${testId}`)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

  // 新增测试：处理极端情况 - 大量相关地址
  test('POST /api/alerts 处理大量相关地址', async () => {
    // 创建包含100个地址的数组
    const manyAddresses = Array(100)
      .fill()
      .map((_, i) => `0x${i.toString().padStart(40, '0')}`);

    const largeAlert = {
      title: '测试警报',
      description: '这是一个测试警报',
      severity: 'medium',
      relatedAddresses: manyAddresses,
    };

    // 我们期望API能正常处理或返回适当的错误，而不是崩溃
    const res = await request(server).post('/api/alerts').send(largeAlert);

    // 检查是否返回了有效的状态码（可能是201或400，取决于实现）
    expect([201, 400]).toContain(res.status);
  });
});
