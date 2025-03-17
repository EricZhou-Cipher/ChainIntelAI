const request = require("supertest");
const { createServer } = require("http");
const { apiResolver } = require("next/dist/server/api-utils/node");
const alertsHandler = require("../../frontend/app/api/alerts/route");

describe("风险警报 API 测试", () => {
  let server;

  // 在所有测试前创建一个测试服务器
  beforeAll(() => {
    const requestHandler = (req, res) => {
      return apiResolver(
        req,
        res,
        undefined,
        alertsHandler,
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

  test("GET /api/alerts 返回警报列表", async () => {
    const res = await request(server)
      .get("/api/alerts")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("alerts");
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  test("GET /api/alerts?limit=5 返回限制数量的警报", async () => {
    const res = await request(server)
      .get("/api/alerts?limit=5")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("alerts");
    expect(res.body.alerts.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/alerts?severity=high 返回特定严重程度的警报", async () => {
    const res = await request(server)
      .get("/api/alerts?severity=high")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("alerts");

    // 验证所有返回的警报都是高严重度
    res.body.alerts.forEach((alert) => {
      expect(alert.severity).toBe("high");
    });
  });

  test("GET /api/alerts?status=active 返回特定状态的警报", async () => {
    const res = await request(server)
      .get("/api/alerts?status=active")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("alerts");

    // 验证所有返回的警报都是活跃状态
    res.body.alerts.forEach((alert) => {
      expect(alert.status).toBe("active");
    });
  });

  test("GET /api/alerts/[id] 返回特定警报详情", async () => {
    const testAlertId = "12345";

    const res = await request(server)
      .get(`/api/alerts/${testAlertId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("id", testAlertId);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("description");
    expect(res.body).toHaveProperty("severity");
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("relatedAddresses");
    expect(Array.isArray(res.body.relatedAddresses)).toBe(true);
  });

  test("POST /api/alerts 创建新警报", async () => {
    const newAlert = {
      title: "可疑交易模式",
      description: "检测到地址0x123...进行了多次小额转账",
      severity: "medium",
      relatedAddresses: ["0x1234567890abcdef1234567890abcdef12345678"],
    };

    const res = await request(server)
      .post("/api/alerts")
      .send(newAlert)
      .expect("Content-Type", /json/)
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("title", newAlert.title);
    expect(res.body).toHaveProperty("description", newAlert.description);
    expect(res.body).toHaveProperty("severity", newAlert.severity);
    expect(res.body).toHaveProperty("status", "active");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("relatedAddresses");
    expect(res.body.relatedAddresses).toEqual(newAlert.relatedAddresses);
  });

  test("PUT /api/alerts/[id] 更新警报状态", async () => {
    const testAlertId = "12345";
    const updateData = {
      status: "resolved",
      resolution: "经过调查，确认为正常交易行为",
    };

    const res = await request(server)
      .put(`/api/alerts/${testAlertId}`)
      .send(updateData)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("id", testAlertId);
    expect(res.body).toHaveProperty("status", updateData.status);
    expect(res.body).toHaveProperty("resolution", updateData.resolution);
  });

  test("DELETE /api/alerts/[id] 删除警报", async () => {
    const testAlertId = "12345";

    await request(server).delete(`/api/alerts/${testAlertId}`).expect(204);

    // 验证警报已被删除
    await request(server).get(`/api/alerts/${testAlertId}`).expect(404);
  });

  test("GET /api/alerts/stats 返回警报统计信息", async () => {
    const res = await request(server)
      .get("/api/alerts/stats")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("bySeverity");
    expect(res.body.bySeverity).toHaveProperty("high");
    expect(res.body.bySeverity).toHaveProperty("medium");
    expect(res.body.bySeverity).toHaveProperty("low");
    expect(res.body).toHaveProperty("byStatus");
    expect(res.body.byStatus).toHaveProperty("active");
    expect(res.body.byStatus).toHaveProperty("resolved");
  });
});
