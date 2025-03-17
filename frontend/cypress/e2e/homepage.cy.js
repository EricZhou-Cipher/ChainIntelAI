describe('首页测试', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('显示首页标题', () => {
    cy.get('h1').should('contain', 'ChainIntelAI');
  });

  it('导航链接正常工作', () => {
    // 检查导航链接
    cy.get('nav').find('a').should('have.length.at.least', 4);
    
    // 点击仪表盘链接
    cy.get('nav').contains('仪表盘').click();
    cy.url().should('include', '/dashboard');
    
    // 返回首页
    cy.visit('/');
    
    // 点击交易分析链接
    cy.get('nav').contains('交易分析').click();
    cy.url().should('include', '/transactions');
    
    // 返回首页
    cy.visit('/');
    
    // 点击地址画像链接
    cy.get('nav').contains('地址画像').click();
    cy.url().should('include', '/addresses');
  });

  it('首页卡片链接正常工作', () => {
    // 检查卡片链接
    cy.get('a[href="/dashboard"]').should('exist');
    cy.get('a[href="/addresses"]').should('exist');
    cy.get('a[href="/transactions"]').should('exist');
    
    // 点击风险监控卡片
    cy.get('a[href="/dashboard"]').first().click();
    cy.url().should('include', '/dashboard');
  });
}); 