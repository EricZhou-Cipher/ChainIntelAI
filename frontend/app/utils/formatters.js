/**
 * 格式化区块链地址，显示前缀和后缀
 * @param {string} address 区块链地址
 * @param {number} prefixLength 前缀长度
 * @param {number} suffixLength 后缀长度
 * @returns {string} 格式化后的地址
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  return `${address.substring(0, prefixLength)}...${address.substring(
    address.length - suffixLength
  )}`;
};

/**
 * 格式化日期时间
 * @param {number} timestamp 时间戳
 * @param {string} locale 地区设置
 * @returns {string} 格式化后的日期时间
 */
export const formatDate = (timestamp, locale = 'zh-CN') => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString(locale);
};

/**
 * 获取区块链名称
 * @param {string} chainId 链ID
 * @returns {string} 区块链名称
 */
export const getChainName = (chainId) => {
  switch (chainId) {
    case '1':
      return '以太坊';
    case '56':
      return '币安智能链';
    case '137':
      return 'Polygon';
    case '42161':
      return 'Arbitrum';
    default:
      return chainId;
  }
};

/**
 * 获取货币符号
 * @param {string} chainId 链ID
 * @returns {string} 货币符号
 */
export const getCurrencySymbol = (chainId) => {
  switch (chainId) {
    case '1':
      return 'ETH';
    case '56':
      return 'BNB';
    case '137':
      return 'MATIC';
    case '42161':
      return 'ETH';
    default:
      return '';
  }
};

/**
 * 获取风险等级文本
 * @param {string} level 风险等级
 * @returns {string} 风险等级文本
 */
export const getRiskLevelText = (level) => {
  switch (level) {
    case 'high':
      return '高风险';
    case 'medium':
      return '中风险';
    case 'low':
      return '低风险';
    default:
      return '未知';
  }
};

/**
 * 获取状态文本
 * @param {string} status 状态
 * @returns {string} 状态文本
 */
export const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return '待处理';
    case 'processed':
      return '已处理';
    case 'ignored':
      return '已忽略';
    default:
      return '未知';
  }
}; 