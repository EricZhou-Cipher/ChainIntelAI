/**
 * Jest设置文件
 * 确保测试环境正确设置
 */

// 设置测试超时时间
jest.setTimeout(30000);

// 设置环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chainintelai_test';

console.log('Jest设置文件加载中...');

// 处理未捕获的Promise错误
process.on('unhandledRejection', (error) => {
  console.error('未捕获的Promise错误:', error);
});
