const { defineConfig } = require('cypress');

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    setupNodeEvents(on, config) {
      // 使用yarn而不是npm
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // 使用yarn而不是npm
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
  env: {
    codeCoverage: {
      exclude: ['cypress/**/*.*'],
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 1,
  // 无障碍测试相关配置
  a11y: {
    enabled: true,
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa'],
    },
    defaultCommandTimeout: 10000,
    screenshotOnFail: true,
  },
  // 设置测试重试次数
  retries: {
    runMode: 1,
    openMode: 0,
  },
  // 设置测试超时时间
  defaultCommandTimeout: 8000,
  // 设置测试并行运行
  numTestsKeptInMemory: 1,
});
