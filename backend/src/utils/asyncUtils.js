/**
 * 异步工具函数模块
 */

/**
 * 延迟执行函数
 * @param {number} ms 延迟毫秒数
 * @param {*} value 要返回的值
 * @returns {Promise<*>} 包含返回值的Promise
 */
function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * 异步获取数据
 * @param {string} id 数据ID
 * @param {boolean} shouldFail 是否模拟失败
 * @returns {Promise<Object>} 包含数据的Promise
 */
async function fetchData(id, shouldFail = false) {
  await delay(100);

  if (shouldFail) {
    throw new Error(`获取数据失败: ${id}`);
  }

  return {
    id,
    timestamp: Date.now(),
    data: `数据内容-${id}`,
  };
}

/**
 * 并行处理多个异步任务
 * @param {Array<Function>} tasks 异步任务函数数组
 * @returns {Promise<Array>} 所有任务结果的数组
 */
async function parallel(tasks) {
  return Promise.all(tasks.map((task) => task()));
}

/**
 * 串行处理多个异步任务
 * @param {Array<Function>} tasks 异步任务函数数组
 * @returns {Promise<Array>} 所有任务结果的数组
 */
async function series(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

/**
 * 带有重试功能的异步函数
 * @param {Function} fn 要执行的异步函数
 * @param {number} retries 重试次数
 * @param {number} delay 重试间隔(毫秒)
 * @returns {Promise<*>} 函数执行结果
 */
async function retry(fn, retries = 3, delayMs = 300) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs);
  }
}

module.exports = {
  delay,
  fetchData,
  parallel,
  series,
  retry,
};
