/**
 * 计算器模块测试
 */

const calculator = require('../../utils/calculator');

describe('计算器模块测试', () => {
  describe('加法函数', () => {
    test('两个正数相加', () => {
      expect(calculator.add(1, 2)).toBe(3);
    });

    test('正数和负数相加', () => {
      expect(calculator.add(5, -3)).toBe(2);
    });

    test('两个负数相加', () => {
      expect(calculator.add(-1, -2)).toBe(-3);
    });

    test('小数相加', () => {
      expect(calculator.add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('减法函数', () => {
    test('两个正数相减', () => {
      expect(calculator.subtract(5, 2)).toBe(3);
    });

    test('正数减负数', () => {
      expect(calculator.subtract(5, -3)).toBe(8);
    });

    test('负数减正数', () => {
      expect(calculator.subtract(-5, 3)).toBe(-8);
    });
  });

  describe('乘法函数', () => {
    test('两个正数相乘', () => {
      expect(calculator.multiply(2, 3)).toBe(6);
    });

    test('正数和负数相乘', () => {
      expect(calculator.multiply(2, -3)).toBe(-6);
    });

    test('两个负数相乘', () => {
      expect(calculator.multiply(-2, -3)).toBe(6);
    });

    test('任何数乘以0等于0', () => {
      expect(calculator.multiply(5, 0)).toBe(0);
      expect(calculator.multiply(0, 5)).toBe(0);
    });
  });

  describe('除法函数', () => {
    test('两个正数相除', () => {
      expect(calculator.divide(6, 2)).toBe(3);
    });

    test('正数除以负数', () => {
      expect(calculator.divide(6, -2)).toBe(-3);
    });

    test('负数除以负数', () => {
      expect(calculator.divide(-6, -2)).toBe(3);
    });

    test('任何数除以1等于其本身', () => {
      expect(calculator.divide(5, 1)).toBe(5);
    });

    test('0除以任何非0数等于0', () => {
      expect(calculator.divide(0, 5)).toBe(0);
    });

    test('除以0应该抛出错误', () => {
      expect(() => calculator.divide(5, 0)).toThrow('除数不能为0');
    });
  });
});
