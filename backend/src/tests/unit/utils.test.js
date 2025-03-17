/**
 * 工具函数测试
 */

describe('工具函数测试', () => {
  // 字符串处理函数测试
  describe('字符串处理', () => {
    test('字符串拼接', () => {
      const concat = (a, b) => a + b;
      expect(concat('hello', 'world')).toBe('helloworld');
    });

    test('字符串转大写', () => {
      const toUpper = (str) => str.toUpperCase();
      expect(toUpper('hello')).toBe('HELLO');
    });
  });

  // 数组处理函数测试
  describe('数组处理', () => {
    test('数组求和', () => {
      const sum = (arr) => arr.reduce((a, b) => a + b, 0);
      expect(sum([1, 2, 3, 4])).toBe(10);
    });

    test('数组过滤', () => {
      const filter = (arr, fn) => arr.filter(fn);
      expect(filter([1, 2, 3, 4], (x) => x % 2 === 0)).toEqual([2, 4]);
    });
  });

  // 异步函数测试
  describe('异步函数', () => {
    test('Promise解析', async () => {
      const asyncFunc = () => Promise.resolve('success');
      await expect(asyncFunc()).resolves.toBe('success');
    });

    test('延迟执行', async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(() => resolve('done'), ms));
      const result = await delay(100);
      expect(result).toBe('done');
    });
  });
});
