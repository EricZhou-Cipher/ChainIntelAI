describe('API端到端测试', () => {
  context('地址API', () => {
    it('获取地址列表', () => {
      cy.request('/api/addresses').its('status').should('eq', 200);

      cy.request('/api/addresses')
        .its('body')
        .should('have.property', 'addresses')
        .and('be.an', 'array');
    });

    it('获取单个地址详情', () => {
      cy.request('/api/addresses?address=0x1234567890abcdef1234567890abcdef12345678')
        .its('status')
        .should('eq', 200);

      cy.request('/api/addresses?address=0x1234567890abcdef1234567890abcdef12345678')
        .its('body')
        .should('have.property', 'address');
    });
  });

  context('交易API', () => {
    it('获取交易列表', () => {
      cy.request('/api/transactions').its('status').should('eq', 200);

      cy.request('/api/transactions')
        .its('body')
        .should('have.property', 'transactions')
        .and('be.an', 'array');
    });

    it('获取单个交易详情', () => {
      cy.request(
        '/api/transactions?hash=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      )
        .its('status')
        .should('eq', 200);

      cy.request(
        '/api/transactions?hash=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      )
        .its('body')
        .should('have.property', 'transaction');
    });
  });

  context('风险API', () => {
    it('获取风险概览', () => {
      cy.request('/api/risk').its('status').should('eq', 200);

      cy.request('/api/risk').its('body').should('have.property', 'overview');
    });

    it('分析地址风险', () => {
      cy.request({
        method: 'POST',
        url: '/api/risk/analyze',
        body: {
          addresses: ['0x1234567890abcdef1234567890abcdef12345678'],
        },
      })
        .its('status')
        .should('eq', 200);

      cy.request({
        method: 'POST',
        url: '/api/risk/analyze',
        body: {
          addresses: ['0x1234567890abcdef1234567890abcdef12345678'],
        },
      })
        .its('body')
        .should('have.property', 'results')
        .and('be.an', 'array');
    });
  });

  context('警报API', () => {
    it('获取警报列表', () => {
      cy.request('/api/alerts').its('status').should('eq', 200);

      cy.request('/api/alerts').its('body').should('have.property', 'alerts').and('be.an', 'array');
    });

    it('创建新警报', () => {
      const alertData = {
        name: '测试警报',
        description: '这是一个测试警报',
        type: 'address',
        threshold: 0.8,
        addresses: ['0x1234567890abcdef1234567890abcdef12345678'],
      };

      cy.request({
        method: 'POST',
        url: '/api/alerts',
        body: alertData,
      })
        .its('status')
        .should('eq', 200);
    });
  });

  context('统计API', () => {
    it('获取总体统计', () => {
      cy.request('/api/stats').its('status').should('eq', 200);

      cy.request('/api/stats').its('body').should('have.property', 'stats');
    });

    it('获取特定时间段统计', () => {
      cy.request('/api/stats?period=week').its('status').should('eq', 200);

      cy.request('/api/stats?period=week').its('body').should('have.property', 'stats');
    });
  });
});
