// ***********************************************
// 自定义命令和覆盖现有命令
// https://on.cypress.io/custom-commands
// ***********************************************

// 导入axe-core和cypress-axe
import 'cypress-axe';

// 模拟登录命令
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name=email]').type(email);
    cy.get('input[name=password]').type(password);
    cy.get('button[type=submit]').click();
    cy.url().should('not.include', '/login');
  });
});

// 模拟 API 响应
Cypress.Commands.add('mockApiResponse', (route, fixture) => {
  cy.intercept('GET', route, { fixture }).as('apiRequest');
});

// 全局无障碍检查命令
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(
    context,
    options || {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
    },
    violations => {
      // 将违规信息输出到控制台，便于调试
      cy.task('log', JSON.stringify(violations, null, 2));
    }
  );
});

// 检查颜色对比度
Cypress.Commands.add('checkColorContrast', context => {
  cy.injectAxe();
  cy.checkA11y(context, {
    runOnly: {
      type: 'tag',
      values: ['color-contrast'],
    },
  });
});

// 响应式设计测试
Cypress.Commands.add('checkResponsiveA11y', context => {
  // 移动设备视图
  cy.viewport('iphone-6');
  cy.checkA11y(context);

  // 平板设备视图
  cy.viewport('ipad-2');
  cy.checkA11y(context);

  // 桌面视图
  cy.viewport('macbook-15');
  cy.checkA11y(context);
});

// 等待加载状态消失
Cypress.Commands.add('waitForLoadingToDisappear', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
});

// 检查组件是否可以用键盘操作
Cypress.Commands.add('checkKeyboardNavigation', selector => {
  cy.get(selector).first().focus().should('have.focus');
  cy.tab().should('have.focus');
});

// 检查组件是否有正确的ARIA标签
Cypress.Commands.add('checkAriaLabels', (selector, expectedLabel) => {
  cy.get(selector).should('have.attr', 'aria-label', expectedLabel);
});
