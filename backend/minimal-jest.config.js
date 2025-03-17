/**
 * 最小化Jest配置文件
 * 用于基本测试
 */

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        configFile: './babel.config.js',
        // 确保babel-jest转换所有文件
        caller: {
          supportsDynamicImport: false,
          supportsStaticESM: false,
          supportsTopLevelAwait: false,
        },
      },
    ],
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  // 不忽略任何node_modules，确保@babel/plugin-transform-modules-commonjs被正确处理
  transformIgnorePatterns: [],
  collectCoverage: false,
  verbose: true,
  // 增加超时时间
  testTimeout: 30000,
  // 强制退出
  forceExit: true,
};
