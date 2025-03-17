const request = require("supertest");
const { createServer } = require("http");
const { apiResolver } = require("next/dist/server/api-utils/node");
const statsHandler = require("../../frontend/app/api/stats/route");

describe("统计数据 API 测试", () => {
  let server;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    const requestHandler = (req, res) => {
      return apiResolver(
        req,
        res,
        undefined,
        statsHandler,
        {
          previewModeId: false,
          previewModeEncryptionKey: "",
          previewModeSigningKey: "",
        },
        false
      );
    };

    server = createServer(requestHandler);
    server.listen();
  });

  // 在所有测试后关闭服务器
  afterAll((done) => {
    if (server) server.close(done);
  });

  test("GET /api/stats/overview 返回系统概览统计数据", async () => {
    const res = await request(server)
      .get("/api/stats/overview")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("totalAddresses");
    expect(res.body).toHaveProperty("totalTransactions");
    expect(res.body).toHaveProperty("activeAddresses24h");
    expect(res.body).toHaveProperty("newAddresses24h");
    expect(res.body).toHaveProperty("transactionsVolume24h");
    expect(res.body).toHaveProperty("averageTransactionValue");
    expect(res.body).toHaveProperty("lastUpdated");
  });

  test("GET /api/stats/transactions 返回交易统计数据", async () => {
    const res = await request(server)
      .get("/api/stats/transactions")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("daily");
    expect(Array.isArray(res.body.daily)).toBe(true);

    if (res.body.daily.length > 0) {
      const firstDay = res.body.daily[0];
      expect(firstDay).toHaveProperty("date");
      expect(firstDay).toHaveProperty("count");
      expect(firstDay).toHaveProperty("volume");
      expect(firstDay).toHaveProperty("averageValue");
    }

    expect(res.body).toHaveProperty("byHour");
    expect(Array.isArray(res.body.byHour)).toBe(true);
  });

  test("GET /api/stats/transactions?period=week 返回特定时间段的交易统计", async () => {
    const res = await request(server)
      .get("/api/stats/transactions?period=week")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("daily");
    expect(Array.isArray(res.body.daily)).toBe(true);
    expect(res.body.daily.length).toBeLessThanOrEqual(7);
  });

  test("GET /api/stats/addresses 返回地址统计数据", async () => {
    const res = await request(server)
      .get("/api/stats/addresses")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("active");
    expect(res.body).toHaveProperty("new");
    expect(res.body).toHaveProperty("byActivity");
    expect(res.body.byActivity).toHaveProperty("veryActive");
    expect(res.body.byActivity).toHaveProperty("active");
    expect(res.body.byActivity).toHaveProperty("occasional");
    expect(res.body.byActivity).toHaveProperty("dormant");
    expect(res.body).toHaveProperty("byBalance");
    expect(res.body.byBalance).toHaveProperty("high");
    expect(res.body.byBalance).toHaveProperty("medium");
    expect(res.body.byBalance).toHaveProperty("low");
  });

  test("GET /api/stats/network 返回网络统计数据", async () => {
    const res = await request(server)
      .get("/api/stats/network")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("nodes");
    expect(res.body).toHaveProperty("connections");
    expect(res.body).toHaveProperty("clusters");
    expect(res.body).toHaveProperty("density");
    expect(res.body).toHaveProperty("averageDegree");
    expect(res.body).toHaveProperty("topNodes");
    expect(Array.isArray(res.body.topNodes)).toBe(true);

    if (res.body.topNodes.length > 0) {
      const firstNode = res.body.topNodes[0];
      expect(firstNode).toHaveProperty("address");
      expect(firstNode).toHaveProperty("connections");
      expect(firstNode).toHaveProperty("transactionCount");
    }
  });

  test("GET /api/stats/risk 返回风险统计数据", async () => {
    const res = await request(server)
      .get("/api/stats/risk")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("distribution");
    expect(res.body.distribution).toHaveProperty("high");
    expect(res.body.distribution).toHaveProperty("medium");
    expect(res.body.distribution).toHaveProperty("low");
    expect(res.body).toHaveProperty("trends");
    expect(Array.isArray(res.body.trends)).toBe(true);
    expect(res.body).toHaveProperty("commonFactors");
    expect(Array.isArray(res.body.commonFactors)).toBe(true);
  });

  test("GET /api/stats/system 返回系统状态统计数据", async () => {
    const res = await request(server)
      .get("/api/stats/system")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("services");
    expect(res.body.services).toHaveProperty("database");
    expect(res.body.services).toHaveProperty("api");
    expect(res.body.services).toHaveProperty("analyzer");
    expect(res.body).toHaveProperty("performance");
    expect(res.body.performance).toHaveProperty("responseTime");
    expect(res.body.performance).toHaveProperty("requestsPerMinute");
    expect(res.body.performance).toHaveProperty("cpuUsage");
    expect(res.body.performance).toHaveProperty("memoryUsage");
    expect(res.body).toHaveProperty("lastUpdated");
  });
});
