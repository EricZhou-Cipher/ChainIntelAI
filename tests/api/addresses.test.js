const request = require("supertest");
const { createServer } = require("http");
const addressesHandler = require("../../frontend/app/api/addresses/route");

describe("地址 API 测试", () => {
  let server;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    const requestHandler = (req, res) => {
      // 模拟Next.js请求对象
      const nextReq = {
        url: `http://localhost${req.url}`,
        method: req.method,
        headers: req.headers,
        cookies: {},
        json: () =>
          new Promise((resolve) => {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk.toString();
            });
            req.on("end", () => {
              resolve(body ? JSON.parse(body) : {});
            });
          }),
      };

      // 处理请求
      const handleRequest = async () => {
        let result;
        if (req.method === "GET") {
          result = await addressesHandler.GET(nextReq);
        } else if (req.method === "POST") {
          result = await addressesHandler.POST(nextReq);
        }

        // 设置状态码和响应头
        res.statusCode = result.status || 200;

        // 设置响应体
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result.json ? await result.json() : {}));
      };

      handleRequest().catch((err) => {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      });
    };

    server = createServer(requestHandler);
    server.listen();
  });

  // 在所有测试后关闭服务器
  afterAll((done) => {
    if (server) server.close(done);
  });

  test("GET /api/addresses 返回地址列表", async () => {
    const res = await request(server)
      .get("/api/addresses")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("addresses");
    expect(Array.isArray(res.body.addresses)).toBe(true);
  });

  test("GET /api/addresses?limit=5 返回限制数量的地址", async () => {
    const res = await request(server)
      .get("/api/addresses?limit=5")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("addresses");
    expect(res.body.addresses.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/addresses?riskLevel=high 返回特定风险等级的地址", async () => {
    const res = await request(server)
      .get("/api/addresses?riskLevel=high")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("addresses");

    // 验证所有返回的地址都是高风险
    res.body.addresses.forEach((address) => {
      expect(address.riskLevel).toBe("high");
    });
  });

  test("GET /api/addresses/[address] 返回特定地址详情", async () => {
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

    const res = await request(server)
      .get(`/api/addresses/${testAddress}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("address", testAddress);
    expect(res.body).toHaveProperty("balance");
    expect(res.body).toHaveProperty("transactionCount");
    expect(res.body).toHaveProperty("riskScore");
    expect(res.body).toHaveProperty("riskLevel");
    expect(res.body).toHaveProperty("lastActivity");
  });

  test("GET /api/addresses/[address]/transactions 返回地址的交易历史", async () => {
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

    const res = await request(server)
      .get(`/api/addresses/${testAddress}/transactions`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("transactions");
    expect(Array.isArray(res.body.transactions)).toBe(true);

    // 验证所有返回的交易都与指定地址相关
    res.body.transactions.forEach((tx) => {
      expect(
        tx.from.toLowerCase() === testAddress.toLowerCase() ||
          tx.to.toLowerCase() === testAddress.toLowerCase()
      ).toBe(true);
    });
  });

  test("GET /api/addresses/[address] 处理无效地址", async () => {
    const invalidAddress = "invalid-address";

    await request(server)
      .get(`/api/addresses/${invalidAddress}`)
      .expect("Content-Type", /json/)
      .expect(400);
  });

  test("GET /api/addresses/[address] 处理不存在的地址", async () => {
    const nonExistentAddress = "0x0000000000000000000000000000000000000000";

    await request(server)
      .get(`/api/addresses/${nonExistentAddress}`)
      .expect("Content-Type", /json/)
      .expect(404);
  });

  test("GET /api/addresses/[address]/risk 返回地址风险分析", async () => {
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

    const res = await request(server)
      .get(`/api/addresses/${testAddress}/risk`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("address", testAddress);
    expect(res.body).toHaveProperty("riskScore");
    expect(res.body).toHaveProperty("riskLevel");
    expect(res.body).toHaveProperty("riskFactors");
    expect(Array.isArray(res.body.riskFactors)).toBe(true);
  });
});
