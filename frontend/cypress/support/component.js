// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/react';
import 'cypress-axe';
import '@testing-library/cypress/add-commands';

// 导入组件测试所需的样式
import '../../src/index.css';

// 添加mount命令
Cypress.Commands.add('mount', mount);

// 无障碍测试自定义命令

// 检查组件的无障碍性
Cypress.Commands.add('checkAccessibility', (options = {}) => {
  cy.injectAxe();
  cy.checkA11y(
    null,
    {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
      ...options,
    },
    null,
    true
  ); // 最后一个参数为true表示不会在失败时停止测试
});

// 检查键盘导航
Cypress.Commands.add('checkKeyboardNavigation', selector => {
  cy.get('body').focus();
  cy.get(selector).first().focus().should('be.focused');

  if (Cypress.$(selector).length > 1) {
    cy.focused().type('{tab}');
    cy.get(selector).eq(1).should('be.focused');
  }
});

// 检查ARIA属性
Cypress.Commands.add('checkAriaAttribute', (selector, attribute, expectedValue) => {
  cy.get(selector).should('have.attr', attribute, expectedValue);
});

// 检查颜色对比度
Cypress.Commands.add('checkColorContrast', () => {
  cy.injectAxe();
  cy.checkA11y(
    null,
    {
      runOnly: {
        type: 'tag',
        values: ['color-contrast'],
      },
    },
    null,
    true
  );
});

// 检查响应式设计的无障碍性
Cypress.Commands.add('checkResponsiveAccessibility', () => {
  // 移动设备视图
  cy.viewport('iphone-x');
  cy.checkAccessibility();

  // 平板设备视图
  cy.viewport('ipad-2');
  cy.checkAccessibility();

  // 桌面视图
  cy.viewport(1280, 720);
  cy.checkAccessibility();
});

// 检查WCAG标准
Cypress.Commands.add('checkWCAG', (level = 'wcag2a') => {
  cy.injectAxe();
  cy.checkA11y(
    null,
    {
      runOnly: {
        type: 'tag',
        values: [level],
      },
    },
    null,
    true
  );
});

// 重写mount命令以强制特定视口大小
const originalMount = Cypress.Commands.originals.mount;
Cypress.Commands.overwrite('mount', (originalFn, ...args) => {
  cy.viewport(1280, 720); // 设置默认视口大小
  return originalMount(...args);
});

// Example use:
// cy.mount(<MyComponent />)
