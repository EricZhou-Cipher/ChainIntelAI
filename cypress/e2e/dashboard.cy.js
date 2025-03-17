describe("仪表盘页面测试", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
    // 等待页面加载完成
    cy.contains("ChainIntelAI 仪表盘", { timeout: 10000 });
  });

  it("加载仪表盘页面", () => {
    // 验证页面标题
    cy.contains("ChainIntelAI 仪表盘").should("be.visible");

    // 验证系统状态部分
    cy.contains("系统状态").should("be.visible");
    cy.contains("MongoDB").should("be.visible");
    cy.contains("Redis").should("be.visible");

    // 验证风险分布部分
    cy.contains("风险分布").should("be.visible");
    cy.contains("低风险").should("be.visible");
    cy.contains("中风险").should("be.visible");
    cy.contains("高风险").should("be.visible");

    // 验证实时网络活动部分
    cy.contains("实时网络活动").should("be.visible");
  });

  it("导航到交易页面", () => {
    // 点击导航链接
    cy.get('nav a[href="/transactions"]').click();

    // 验证URL变化
    cy.url().should("include", "/transactions");

    // 验证页面内容
    cy.contains("交易监控").should("be.visible");
  });

  it("导航到地址分析页面", () => {
    // 点击导航链接
    cy.get('nav a[href="/addresses"]').click();

    // 验证URL变化
    cy.url().should("include", "/addresses");

    // 验证页面内容
    cy.contains("地址分析").should("be.visible");
  });

  it("导航到网络分析页面", () => {
    // 点击导航链接
    cy.get('nav a[href="/network-analysis"]').click();

    // 验证URL变化
    cy.url().should("include", "/network-analysis");

    // 验证页面内容
    cy.contains("网络分析").should("be.visible");
  });

  it("测试搜索功能", () => {
    // 查找搜索输入框
    cy.get('input[placeholder*="搜索"]').should("be.visible").as("searchInput");

    // 输入搜索内容
    cy.get("@searchInput").type("0x1234{enter}");

    // 验证搜索结果
    cy.contains("搜索结果").should("be.visible");
  });

  it("测试响应式布局", () => {
    // 测试桌面视图
    cy.viewport(1280, 720);
    cy.get("nav").should("be.visible");

    // 测试平板视图
    cy.viewport(768, 1024);
    cy.get("nav").should("be.visible");

    // 测试移动视图
    cy.viewport(375, 667);
    cy.get('button[aria-controls="mobile-menu"]').should("be.visible").click();
    cy.contains("仪表盘").should("be.visible");
  });
});
