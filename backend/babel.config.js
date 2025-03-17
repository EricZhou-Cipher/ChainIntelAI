/**
 * ChainIntel AI 后端 Babel 配置
 * 此配置用于支持 ES 模块和 Jest 测试
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs'
  ],
  sourceType: 'unambiguous'
};
