/**
 * 异步工具函数测试
 */

const asyncUtils = require('../../utils/asyncUtils');

describe('异步工具函数测试', () => {
  describe('delay函数', () => {
    test('应该在指定时间后解析Promise', async () => {
      const start = Date.now();
      const result = await asyncUtils.delay(100, 'test');
      const duration = Date.now() - start;

      expect(result).toBe('test');
      expect(duration).toBeGreaterThanOrEqual(90); // 允许一些误差
    });
  });

  describe('fetchData函数', () => {
    test('成功获取数据', async () => {
      const data = await asyncUtils.fetchData('123');

      expect(data).toHaveProperty('id', '123');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('data', '数据内容-123');
    });

    test('模拟获取数据失败', async () => {
      await expect(asyncUtils.fetchData('123', true)).rejects.toThrow('获取数据失败: 123');
    });
  });

  describe('parallel函数', () => {
    test('并行执行多个任务', async () => {
      const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

      const results = await asyncUtils.parallel(tasks);
      expect(results).toEqual([1, 2, 3]);
    });

    test('任一任务失败则整体失败', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('任务失败')),
        () => Promise.resolve(3),
      ];

      await expect(asyncUtils.parallel(tasks)).rejects.toThrow('任务失败');
    });
  });

  describe('series函数', () => {
    test('串行执行多个任务', async () => {
      const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

      const results = await asyncUtils.series(tasks);
      expect(results).toEqual([1, 2, 3]);
    });

    test('任一任务失败则停止执行', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('任务失败')),
        () => Promise.resolve(3),
      ];

      await expect(asyncUtils.series(tasks)).rejects.toThrow('任务失败');
    });
  });

  describe('retry函数', () => {
    test('首次成功执行', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await asyncUtils.retry(fn, 3);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('失败后重试成功', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('失败1'))
        .mockRejectedValueOnce(new Error('失败2'))
        .mockResolvedValue('success');

      const result = await asyncUtils.retry(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('超过重试次数仍失败', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('持续失败'));

      await expect(asyncUtils.retry(fn, 2, 10)).rejects.toThrow('持续失败');

      expect(fn).toHaveBeenCalledTimes(3); // 初始 + 2次重试
    });
  });
});
