describe("交易页面测试", () => {
  beforeEach(() => {
    cy.visit("/transactions");
    // 等待页面加载完成
    cy.contains("交易监控", { timeout: 10000 });
  });

  it("加载交易页面", () => {
    // 验证页面标题
    cy.contains("交易监控").should("be.visible");

    // 验证交易列表
    cy.contains("最近交易").should("be.visible");
    cy.get("table").should("be.visible");
    cy.get("th").contains("交易哈希").should("be.visible");
    cy.get("th").contains("金额").should("be.visible");
    cy.get("th").contains("时间").should("be.visible");
  });

  it("测试交易筛选", () => {
    // 查找筛选按钮
    cy.contains("筛选").click();

    // 选择日期范围
    cy.get('input[type="date"]').first().type("2023-01-01");
    cy.get('input[type="date"]').last().type("2023-12-31");

    // 选择金额范围
    cy.get('input[placeholder*="最小金额"]').type("100");
    cy.get('input[placeholder*="最大金额"]').type("1000");

    // 应用筛选
    cy.contains("应用").click();

    // 验证筛选结果
    cy.contains("筛选条件").should("be.visible");
  });

  it("测试交易详情", () => {
    // 点击第一个交易
    cy.get("table tbody tr").first().click();

    // 验证详情弹窗
    cy.contains("交易详情").should("be.visible");
    cy.contains("发送方").should("be.visible");
    cy.contains("接收方").should("be.visible");
    cy.contains("金额").should("be.visible");
    cy.contains("时间").should("be.visible");
    cy.contains("状态").should("be.visible");

    // 关闭弹窗
    cy.get('button[aria-label="关闭"]').click();
    cy.contains("交易详情").should("not.exist");
  });

  it("测试交易分页", () => {
    // 验证分页控件
    cy.get('nav[aria-label="分页"]').should("be.visible");

    // 点击下一页
    cy.contains("下一页").click();

    // 验证页码变化
    cy.get('span[aria-current="page"]').should("contain", "2");

    // 点击上一页
    cy.contains("上一页").click();

    // 验证页码变化
    cy.get('span[aria-current="page"]').should("contain", "1");
  });

  it("测试交易搜索", () => {
    // 查找搜索输入框
    cy.get('input[placeholder*="搜索交易"]')
      .should("be.visible")
      .as("searchInput");

    // 输入搜索内容
    cy.get("@searchInput").type("0xabc123{enter}");

    // 验证搜索结果
    cy.contains("搜索结果").should("be.visible");

    // 清除搜索
    cy.get('button[aria-label="清除搜索"]').click();
    cy.get("@searchInput").should("have.value", "");
  });
});
