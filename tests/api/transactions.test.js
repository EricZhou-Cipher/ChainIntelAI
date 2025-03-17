const request = require("supertest");
const { createServer } = require("http");
const transactionsHandler = require("../../frontend/app/api/transactions/route");
const { mockTransactions } = transactionsHandler;

describe("交易 API 测试", () => {
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
          result = await transactionsHandler.GET(nextReq);
        } else if (req.method === "POST") {
          result = await transactionsHandler.POST(nextReq);
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

  test("GET /api/transactions 返回交易列表", async () => {
    const res = await request(server)
      .get("/api/transactions")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("transactions");
    expect(Array.isArray(res.body.transactions)).toBe(true);
    expect(res.body.transactions.length).toBe(mockTransactions.length);
  });

  test("GET /api/transactions?limit=2 返回限制数量的交易", async () => {
    const res = await request(server)
      .get("/api/transactions?limit=2")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("transactions");
    expect(res.body.transactions.length).toBe(2);
  });

  test("GET /api/transactions?address=0x1234567890abcdef1234567890abcdef12345678 返回特定地址的交易", async () => {
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

    const res = await request(server)
      .get(`/api/transactions?address=${testAddress}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("transactions");

    // 验证所有返回的交易都与指定地址相关
    res.body.transactions.forEach((tx) => {
      expect(
        tx.from.toLowerCase() === testAddress.toLowerCase() ||
          tx.to.toLowerCase() === testAddress.toLowerCase()
      ).toBe(true);
    });
  });

  test("POST /api/transactions 创建新交易", async () => {
    const newTransaction = {
      from: "0x1234567890abcdef1234567890abcdef12345678",
      to: "0xabcdef1234567890abcdef1234567890abcdef12",
      value: "1.0 ETH",
    };

    const res = await request(server)
      .post("/api/transactions")
      .send(newTransaction)
      .expect("Content-Type", /json/)
      .expect(201);

    expect(res.body).toHaveProperty("hash");
    expect(res.body).toHaveProperty("from", newTransaction.from);
    expect(res.body).toHaveProperty("to", newTransaction.to);
    expect(res.body).toHaveProperty("value", newTransaction.value);
    expect(res.body).toHaveProperty("status", "pending");
  });

  test("POST /api/transactions 处理无效请求", async () => {
    const invalidTransaction = {
      from: "0x1234567890abcdef1234567890abcdef12345678",
      // 缺少 to 字段
      value: "1.0 ETH",
    };

    await request(server)
      .post("/api/transactions")
      .send(invalidTransaction)
      .expect("Content-Type", /json/)
      .expect(400);
  });
});
