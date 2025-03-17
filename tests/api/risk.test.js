const request = require("supertest");
const { createServer } = require("http");
const { apiResolver } = require("next/dist/server/api-utils/node");
const riskHandler = require("../../frontend/app/api/risk/route");

describe("风险分析 API 测试", () => {
  let server;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    const requestHandler = (req, res) => {
      return apiResolver(
        req,
        res,
        undefined,
        riskHandler,
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

  test("GET /api/risk/stats 返回风险统计信息", async () => {
    const res = await request(server)
      .get("/api/risk/stats")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("totalAddressesAnalyzed");
    expect(res.body).toHaveProperty("riskDistribution");
    expect(res.body.riskDistribution).toHaveProperty("high");
    expect(res.body.riskDistribution).toHaveProperty("medium");
    expect(res.body.riskDistribution).toHaveProperty("low");
    expect(res.body).toHaveProperty("averageRiskScore");
    expect(res.body).toHaveProperty("lastUpdated");
  });

  test("GET /api/risk/trends 返回风险趋势数据", async () => {
    const res = await request(server)
      .get("/api/risk/trends")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("trends");
    expect(Array.isArray(res.body.trends)).toBe(true);

    if (res.body.trends.length > 0) {
      const firstTrend = res.body.trends[0];
      expect(firstTrend).toHaveProperty("date");
      expect(firstTrend).toHaveProperty("highRiskCount");
      expect(firstTrend).toHaveProperty("mediumRiskCount");
      expect(firstTrend).toHaveProperty("lowRiskCount");
      expect(firstTrend).toHaveProperty("averageRiskScore");
    }
  });

  test("GET /api/risk/trends?period=week 返回特定时间段的风险趋势", async () => {
    const res = await request(server)
      .get("/api/risk/trends?period=week")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("trends");
    expect(Array.isArray(res.body.trends)).toBe(true);
    expect(res.body.trends.length).toBeLessThanOrEqual(7);
  });

  test("GET /api/risk/factors 返回风险因素分析", async () => {
    const res = await request(server)
      .get("/api/risk/factors")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("factors");
    expect(Array.isArray(res.body.factors)).toBe(true);

    if (res.body.factors.length > 0) {
      const firstFactor = res.body.factors[0];
      expect(firstFactor).toHaveProperty("id");
      expect(firstFactor).toHaveProperty("name");
      expect(firstFactor).toHaveProperty("description");
      expect(firstFactor).toHaveProperty("occurrenceCount");
      expect(firstFactor).toHaveProperty("severity");
    }
  });

  test("POST /api/risk/analyze 分析地址风险", async () => {
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

    const res = await request(server)
      .post("/api/risk/analyze")
      .send({ address: testAddress })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("address", testAddress);
    expect(res.body).toHaveProperty("riskScore");
    expect(res.body).toHaveProperty("riskLevel");
    expect(res.body).toHaveProperty("riskFactors");
    expect(Array.isArray(res.body.riskFactors)).toBe(true);
    expect(res.body).toHaveProperty("analysisTimestamp");
  });

  test("POST /api/risk/analyze 处理无效地址", async () => {
    const invalidAddress = "invalid-address";

    await request(server)
      .post("/api/risk/analyze")
      .send({ address: invalidAddress })
      .expect("Content-Type", /json/)
      .expect(400);
  });

  test("POST /api/risk/batch-analyze 批量分析地址风险", async () => {
    const testAddresses = [
      "0x1234567890abcdef1234567890abcdef12345678",
      "0xabcdef1234567890abcdef1234567890abcdef12",
    ];

    const res = await request(server)
      .post("/api/risk/batch-analyze")
      .send({ addresses: testAddresses })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBe(testAddresses.length);

    const firstResult = res.body.results[0];
    expect(firstResult).toHaveProperty("address");
    expect(firstResult).toHaveProperty("riskScore");
    expect(firstResult).toHaveProperty("riskLevel");
  });

  test("GET /api/risk/model-info 返回风险模型信息", async () => {
    const res = await request(server)
      .get("/api/risk/model-info")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("modelVersion");
    expect(res.body).toHaveProperty("lastTrainingDate");
    expect(res.body).toHaveProperty("accuracy");
    expect(res.body).toHaveProperty("features");
    expect(Array.isArray(res.body.features)).toBe(true);
    expect(res.body).toHaveProperty("description");
  });
});
