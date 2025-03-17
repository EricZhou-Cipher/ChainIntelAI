/**
 * 基础 API URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * 通用 API 请求函数
 * @param {string} endpoint API 端点
 * @param {Object} options 请求选项
 * @returns {Promise<any>} 响应数据
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '请求失败');
  }
  
  return await response.json();
}

/**
 * 获取风险告警列表
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 告警列表
 */
export async function getAlerts(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  return fetchAPI(`/alerts?${queryParams}`);
}

/**
 * 获取交易列表
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 交易列表
 */
export async function getTransactions(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  return fetchAPI(`/transactions?${queryParams}`);
}

/**
 * 获取地址信息
 * @param {string} address 区块链地址
 * @returns {Promise<Object>} 地址信息
 */
export async function getAddressProfile(address) {
  return fetchAPI(`/addresses/${address}`);
}

/**
 * 获取交易详情
 * @param {string} hash 交易哈希
 * @returns {Promise<Object>} 交易详情
 */
export async function getTransactionDetails(hash) {
  return fetchAPI(`/transactions/${hash}`);
}

/**
 * 获取仪表盘数据
 * @returns {Promise<Object>} 仪表盘数据
 */
export async function getDashboardData() {
  return fetchAPI('/dashboard');
} 