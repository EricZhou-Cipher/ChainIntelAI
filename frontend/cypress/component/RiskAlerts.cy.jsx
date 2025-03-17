import React from 'react';
import RiskAlerts from '../../app/components/RiskAlerts';

describe('RiskAlerts组件', () => {
  const mockAlerts = [
    {
      id: '1',
      name: '高风险地址活动',
      description: '检测到高风险地址的异常活动',
      severity: 'high',
      timestamp: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '2',
      name: '可疑交易模式',
      description: '发现可疑的交易模式',
      severity: 'medium',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'active'
    },
    {
      id: '3',
      name: '新增黑名单地址',
      description: '系统添加了新的黑名单地址',
      severity: 'low',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      status: 'resolved'
    }
  ];

  beforeEach(() => {
    cy.intercept('GET', '/api/alerts', {
      statusCode: 200,
      body: { alerts: mockAlerts }
    }).as('getAlerts');

    cy.mount(<RiskAlerts />);
    cy.wait('@getAlerts');
  });

  it('显示风险警报标题', () => {
    cy.get('h2').should('contain', '风险警报');
  });

  it('显示正确数量的警报', () => {
    cy.get('[data-testid="alert-item"]').should('have.length', mockAlerts.length);
  });

  it('根据严重程度显示不同颜色', () => {
    cy.get('[data-testid="alert-item"]').eq(0).should('have.class', 'high');
    cy.get('[data-testid="alert-item"]').eq(1).should('have.class', 'medium');
    cy.get('[data-testid="alert-item"]').eq(2).should('have.class', 'low');
  });

  it('点击警报显示详情', () => {
    cy.get('[data-testid="alert-item"]').eq(0).click();
    cy.get('[data-testid="alert-details"]').should('be.visible');
    cy.get('[data-testid="alert-details"]').should('contain', mockAlerts[0].description);
  });

  it('可以标记警报为已解决', () => {
    cy.intercept('PUT', '/api/alerts/*', {
      statusCode: 200,
      body: { success: true }
    }).as('resolveAlert');

    cy.get('[data-testid="alert-item"]').eq(0).find('[data-testid="resolve-button"]').click();
    cy.wait('@resolveAlert');
    cy.get('[data-testid="alert-item"]').eq(0).should('have.class', 'resolved');
  });
}); 