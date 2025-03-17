/**
 * Babel测试文件
 * 此文件包含一些现代JavaScript特性，用于测试Babel是否能正确转换
 */

// 测试箭头函数
const arrowFunction = () => {
  return 'Arrow function works';
};

// 测试async/await
const asyncFunction = async () => {
  const result = await new Promise(resolve => {
    setTimeout(() => resolve('Async/await works'), 100);
  });
  return result;
};

// 测试可选链操作符
const optionalChaining = (obj) => {
  return obj?.property?.nestedProperty;
};

// 测试空值合并操作符
const nullishCoalescing = (value) => {
  return value ?? 'Default value';
};

// 测试类
class TestClass {
  #privateField = 'private';
  
  constructor() {
    this.publicField = 'public';
  }
  
  getPrivate() {
    return this.#privateField;
  }
  
  static staticMethod() {
    return 'Static method works';
  }
}

// 导出所有测试函数
module.exports = {
  arrowFunction,
  asyncFunction,
  optionalChaining,
  nullishCoalescing,
  TestClass
}; 