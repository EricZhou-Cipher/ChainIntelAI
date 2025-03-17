describe('应用程序流程测试', () => {
  beforeEach(() => {
    // 访问首页
    cy.visit('/');

    // 模拟API响应
    cy.intercept('GET', '/api/stats', { fixture: 'stats.json' }).as('getStats');
    cy.intercept('GET', '/api/risk', { fixture: 'risk.json' }).as('getRisk');
    cy.intercept('GET', '/api/alerts', { fixture: 'alerts.json' }).as('getAlerts');
    cy.intercept('GET', '/api/addresses', { fixture: 'addresses.json' }).as('getAddresses');
    cy.intercept('GET', '/api/transactions', { fixture: 'transactions.json' }).as(
      'getTransactions'
    );
  });

  it('完整用户流程测试', () => {
    // 验证首页加载
    cy.get('h1').should('be.visible');
    cy.get('nav').should('be.visible');

    // 导航到仪表盘
    cy.contains('仪表盘').click();
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', '仪表盘');

    // 检查仪表盘组件
    cy.get('[data-testid="stats-overview"]').should('be.visible');
    cy.get('[data-testid="risk-alerts"]').should('be.visible');
    cy.get('[data-testid="recent-transactions"]').should('be.visible');

    // 导航到地址分析页面
    cy.contains('地址分析').click();
    cy.url().should('include', '/addresses');
    cy.get('h1').should('contain', '地址分析');

    // 搜索特定地址
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
    cy.intercept('GET', `/api/addresses?address=${testAddress}`, {
      fixture: 'address-details.json',
    }).as('getAddressDetails');

    cy.get('[data-testid="address-search"]').type(testAddress);
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@getAddressDetails');

    // 验证地址详情显示
    cy.get('[data-testid="address-details"]').should('be.visible');
    cy.get('[data-testid="risk-score"]').should('be.visible');
    cy.get('[data-testid="transaction-history"]').should('be.visible');

    // 导航到交易分析页面
    cy.contains('交易分析').click();
    cy.url().should('include', '/transactions');
    cy.get('h1').should('contain', '交易分析');

    // 搜索特定交易
    const testTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    cy.intercept('GET', `/api/transactions?hash=${testTxHash}`, {
      fixture: 'transaction-details.json',
    }).as('getTransactionDetails');

    cy.get('[data-testid="transaction-search"]').type(testTxHash);
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@getTransactionDetails');

    // 验证交易详情显示
    cy.get('[data-testid="transaction-details"]').should('be.visible');
    cy.get('[data-testid="transaction-from"]').should('be.visible');
    cy.get('[data-testid="transaction-to"]').should('be.visible');
    cy.get('[data-testid="transaction-value"]').should('be.visible');

    // 导航到风险监控页面
    cy.contains('风险监控').click();
    cy.url().should('include', '/risk');
    cy.get('h1').should('contain', '风险监控');

    // 检查风险监控组件
    cy.get('[data-testid="risk-overview"]').should('be.visible');
    cy.get('[data-testid="risk-trends"]').should('be.visible');

    // 创建新的风险警报
    cy.get('[data-testid="create-alert-button"]').click();
    cy.get('[data-testid="alert-form"]').should('be.visible');

    cy.intercept('POST', '/api/alerts', {
      statusCode: 201,
      body: {
        id: '12345',
        name: '测试警报',
        description: '这是一个测试警报',
        severity: 'medium',
        status: 'active',
        timestamp: new Date().toISOString(),
      },
    }).as('createAlert');

    cy.get('[data-testid="alert-name"]').type('测试警报');
    cy.get('[data-testid="alert-description"]').type('这是一个测试警报');
    cy.get('[data-testid="alert-severity"]').select('medium');
    cy.get('[data-testid="alert-address"]').type('0x1234567890abcdef1234567890abcdef12345678');
    cy.get('[data-testid="submit-button"]').click();

    cy.wait('@createAlert');
    cy.get('[data-testid="alert-success"]').should('be.visible');

    // 返回首页
    cy.contains('首页').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('错误处理测试', () => {
    // 测试无效地址搜索
    cy.contains('地址分析').click();

    cy.intercept('GET', '/api/addresses?address=invalid-address', {
      statusCode: 400,
      body: { error: 'Invalid Ethereum address format' },
    }).as('invalidAddressSearch');

    cy.get('[data-testid="address-search"]').type('invalid-address');
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@invalidAddressSearch');

    // 验证错误消息显示
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', '无效的以太坊地址格式');

    // 测试不存在的交易哈希
    cy.contains('交易分析').click();

    cy.intercept('GET', '/api/transactions?hash=0x0000', {
      statusCode: 404,
      body: { error: 'Transaction not found' },
    }).as('nonExistentTransaction');

    cy.get('[data-testid="transaction-search"]').type('0x0000');
    cy.get('[data-testid="search-button"]').click();
    cy.wait('@nonExistentTransaction');

    // 验证错误消息显示
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', '交易未找到');

    // 测试API服务器错误
    cy.contains('风险监控').click();

    cy.intercept('GET', '/api/risk', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('serverError');

    cy.reload();
    cy.wait('@serverError');

    // 验证错误消息显示
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', '服务器错误');
  });

  it('响应式设计测试', () => {
    // 测试移动设备视图
    cy.viewport('iphone-x');
    cy.reload();

    // 验证移动导航菜单
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('nav').should('be.visible');

    // 测试平板设备视图
    cy.viewport('ipad-2');
    cy.reload();

    // 验证平板布局
    cy.get('[data-testid="dashboard-cards"]').should(
      'have.css',
      'grid-template-columns',
      '1fr 1fr'
    );

    // 测试桌面视图
    cy.viewport(1920, 1080);
    cy.reload();

    // 验证桌面布局
    cy.get('[data-testid="dashboard-cards"]').should(
      'have.css',
      'grid-template-columns',
      '1fr 1fr 1fr'
    );
  });
});
