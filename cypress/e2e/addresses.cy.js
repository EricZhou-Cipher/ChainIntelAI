describe("地址分析页面测试", () => {
  beforeEach(() => {
    cy.visit("/addresses");
    // 等待页面加载完成
    cy.contains("地址分析", { timeout: 10000 });
  });

  it("加载地址分析页面", () => {
    // 验证页面标题
    cy.contains("地址分析").should("be.visible");

    // 验证地址搜索框
    cy.get('input[placeholder*="输入区块链地址"]').should("be.visible");

    // 验证热门地址列表
    cy.contains("热门地址").should("be.visible");
    cy.get("table").should("be.visible");
    cy.get("th").contains("地址").should("be.visible");
    cy.get("th").contains("标签").should("be.visible");
    cy.get("th").contains("风险评分").should("be.visible");
  });

  it("测试地址搜索", () => {
    // 查找搜索输入框
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
    cy.get('input[placeholder*="输入区块链地址"]').as("addressInput");

    // 输入地址
    cy.get("@addressInput").type(testAddress);
    cy.get('button[type="submit"]').click();

    // 验证搜索结果
    cy.url().should("include", `/address/${testAddress}`);
    cy.contains("地址详情").should("be.visible");
    cy.contains(testAddress).should("be.visible");
  });

  it("测试地址筛选", () => {
    // 查找筛选按钮
    cy.contains("筛选").click();

    // 选择风险等级
    cy.contains("风险等级")
      .parent()
      .within(() => {
        cy.get('input[type="checkbox"]').first().check();
      });

    // 选择地址类型
    cy.contains("地址类型")
      .parent()
      .within(() => {
        cy.get('input[type="checkbox"]').first().check();
      });

    // 应用筛选
    cy.contains("应用").click();

    // 验证筛选结果
    cy.contains("筛选条件").should("be.visible");
  });

  it("测试地址详情", () => {
    // 点击第一个地址
    cy.get("table tbody tr").first().click();

    // 验证地址详情页
    cy.contains("地址详情").should("be.visible");
    cy.contains("交易历史").should("be.visible");
    cy.contains("资产分布").should("be.visible");
    cy.contains("风险分析").should("be.visible");

    // 测试交易历史标签页
    cy.contains("交易历史").click();
    cy.get("table").should("be.visible");

    // 测试资产分布标签页
    cy.contains("资产分布").click();
    cy.get("canvas").should("be.visible");

    // 测试风险分析标签页
    cy.contains("风险分析").click();
    cy.contains("风险评分").should("be.visible");
  });

  it("测试地址标记功能", () => {
    // 点击第一个地址
    cy.get("table tbody tr").first().click();

    // 点击标记按钮
    cy.contains("标记地址").click();

    // 填写标记表单
    cy.get('input[placeholder*="输入标签"]').type("测试标签");
    cy.get('textarea[placeholder*="输入备注"]').type("这是一个测试备注");

    // 提交表单
    cy.contains("保存").click();

    // 验证标记成功
    cy.contains("标记成功").should("be.visible");
    cy.contains("测试标签").should("be.visible");
  });

  it("测试地址导出功能", () => {
    // 选择多个地址
    cy.get('table tbody tr input[type="checkbox"]').first().check();
    cy.get('table tbody tr input[type="checkbox"]').eq(1).check();

    // 点击导出按钮
    cy.contains("导出").click();

    // 选择导出格式
    cy.contains("CSV").click();

    // 验证导出成功
    cy.contains("导出成功").should("be.visible");
  });
});
