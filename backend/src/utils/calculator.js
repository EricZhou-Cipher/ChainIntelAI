/**
 * 简单计算器模块
 */

/**
 * 加法运算
 * @param {number} a 第一个数
 * @param {number} b 第二个数
 * @returns {number} 两数之和
 */
function add(a, b) {
  return a + b;
}

/**
 * 减法运算
 * @param {number} a 第一个数
 * @param {number} b 第二个数
 * @returns {number} 两数之差
 */
function subtract(a, b) {
  return a - b;
}

/**
 * 乘法运算
 * @param {number} a 第一个数
 * @param {number} b 第二个数
 * @returns {number} 两数之积
 */
function multiply(a, b) {
  return a * b;
}

/**
 * 除法运算
 * @param {number} a 第一个数
 * @param {number} b 第二个数
 * @returns {number} 两数之商
 * @throws {Error} 如果除数为0，抛出错误
 */
function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为0');
  }
  return a / b;
}

module.exports = {
  add,
  subtract,
  multiply,
  divide,
};
