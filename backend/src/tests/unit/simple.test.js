/**
 * 简单测试文件
 * 用于验证Babel和Jest配置是否正确工作
 */

describe('基本功能测试', () => {
  test('应该能正确运行测试', () => {
    expect(true).toBe(true);
  });

  test('应该支持ES6功能', () => {
    // 测试箭头函数
    const add = (a, b) => a + b;
    expect(add(1, 2)).toBe(3);

    // 测试解构
    const obj = { a: 1, b: 2 };
    const { a, b } = obj;
    expect(a).toBe(1);
    expect(b).toBe(2);

    // 测试类
    class TestClass {
      constructor(value) {
        this.value = value;
      }

      getValue() {
        return this.value;
      }
    }

    const instance = new TestClass('test');
    expect(instance.getValue()).toBe('test');
  });

  test('应该支持异步函数', async () => {
    const fetchData = () => Promise.resolve('data');

    const result = await fetchData();
    expect(result).toBe('data');
  });
});
