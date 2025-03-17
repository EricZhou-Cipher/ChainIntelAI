/**
 * 网络数据生成 Worker
 * 用于在后台线程生成大规模网络数据，避免主线程阻塞
 */

/**
 * 生成随机 ID
 * @param {string} prefix - ID 前缀
 * @param {number} length - ID 长度
 * @returns {string} 生成的随机 ID
 */
function generateRandomId(prefix, length = 6) {
  const chars = '0123456789abcdef';
  let id = prefix || '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * 生成随机地址
 * @returns {string} 生成的随机地址
 */
function generateRandomAddress() {
  return (
    '0x' +
    Array(40)
      .fill(0)
      .map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)])
      .join('')
  );
}

/**
 * 生成随机交易哈希
 * @returns {string} 生成的随机交易哈希
 */
function generateRandomTxHash() {
  return (
    '0x' +
    Array(64)
      .fill(0)
      .map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)])
      .join('')
  );
}

/**
 * 生成随机风险等级
 * @returns {string} 风险等级
 */
function generateRandomRiskLevel() {
  const levels = ['low', 'medium', 'high', 'critical'];
  const weights = [0.6, 0.3, 0.08, 0.02]; // 权重，使高风险更少见

  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r < sum) return levels[i];
  }
  return levels[0];
}

/**
 * 生成随机 X,Y 坐标，在指定范围内
 * @param {number} width - 宽度范围
 * @param {number} height - 高度范围
 * @returns {Object} 包含 x 和 y 的对象
 */
function generateRandomPosition(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
  };
}

/**
 * 生成随机网络节点
 * @param {number} count - 要生成的节点数量
 * @param {number} width - 宽度范围
 * @param {number} height - 高度范围
 * @returns {Array} 生成的节点数组
 */
function generateRandomNodes(count, width, height) {
  const nodes = [];

  // 确保有一些地址节点
  const addressCount = Math.max(5, Math.floor(count * 0.4));
  for (let i = 0; i < addressCount; i++) {
    const address = generateRandomAddress();
    nodes.push({
      id: `addr-${i}`,
      address,
      type: 'address',
      label: `${address.substring(0, 6)}...${address.substring(38)}`,
      value: Math.floor(Math.random() * 100) + 1,
      riskLevel: generateRandomRiskLevel(),
      ...generateRandomPosition(width, height),
    });
  }

  // 添加一些交易节点
  const txCount = Math.max(5, Math.floor(count * 0.4));
  for (let i = 0; i < txCount; i++) {
    const txHash = generateRandomTxHash();
    nodes.push({
      id: `tx-${i}`,
      address: txHash,
      type: 'transaction',
      label: `${txHash.substring(0, 6)}...`,
      value: Math.floor(Math.random() * 50) + 1,
      ...generateRandomPosition(width, height),
    });
  }

  // 添加一些合约节点
  const contractCount = count - addressCount - txCount;
  for (let i = 0; i < contractCount; i++) {
    const address = generateRandomAddress();
    nodes.push({
      id: `contract-${i}`,
      address,
      type: 'contract',
      label: `Contract ${i}`,
      value: Math.floor(Math.random() * 80) + 20,
      riskLevel: generateRandomRiskLevel(),
      ...generateRandomPosition(width, height),
    });
  }

  return nodes;
}

/**
 * 生成随机链接
 * @param {Array} nodes - 节点数组
 * @param {number} linkFactor - 每个节点平均链接数
 * @returns {Array} 生成的链接数组
 */
function generateRandomLinks(nodes, linkFactor = 2) {
  const links = [];
  const linkCount = Math.floor(nodes.length * linkFactor);

  // 为每个交易节点创建链接
  const txNodes = nodes.filter(node => node.type === 'transaction');
  const otherNodes = nodes.filter(node => node.type !== 'transaction');

  for (const txNode of txNodes) {
    // 每个交易至少有一个输入和一个输出
    if (otherNodes.length >= 2) {
      // 随机选择输入地址
      const sourceIndex = Math.floor(Math.random() * otherNodes.length);
      const source = otherNodes[sourceIndex];

      // 随机选择输出地址（确保与输入不同）
      let targetIndex;
      do {
        targetIndex = Math.floor(Math.random() * otherNodes.length);
      } while (targetIndex === sourceIndex && otherNodes.length > 1);

      const target = otherNodes[targetIndex];

      // 创建输入链接
      links.push({
        source: source.id,
        target: txNode.id,
        value: Math.floor(Math.random() * 10) + 1,
        txHash: txNode.address,
      });

      // 创建输出链接
      links.push({
        source: txNode.id,
        target: target.id,
        value: Math.floor(Math.random() * 10) + 1,
        txHash: txNode.address,
      });
    }
  }

  // 添加一些随机链接
  const remainingLinks = linkCount - links.length;
  for (let i = 0; i < remainingLinks; i++) {
    const sourceIndex = Math.floor(Math.random() * nodes.length);
    let targetIndex;
    do {
      targetIndex = Math.floor(Math.random() * nodes.length);
    } while (targetIndex === sourceIndex && nodes.length > 1);

    const source = nodes[sourceIndex];
    const target = nodes[targetIndex];

    links.push({
      source: source.id,
      target: target.id,
      value: Math.floor(Math.random() * 5) + 1,
      txHash:
        source.type === 'transaction'
          ? source.address
          : target.type === 'transaction'
            ? target.address
            : generateRandomTxHash(),
    });
  }

  return links;
}

/**
 * 生成初始网络数据
 * @param {number} nodeCount - 要生成的节点数量
 * @param {number} width - 宽度范围
 * @param {number} height - 高度范围
 * @returns {Object} 包含节点和链接的网络数据
 */
function generateInitialNetworkData(nodeCount, width = 800, height = 600) {
  const nodes = generateRandomNodes(nodeCount, width, height);
  const links = generateRandomLinks(nodes);

  return { nodes, links };
}

/**
 * 添加新节点到网络
 * @param {Array} nodes - 现有节点数组
 * @param {Array} links - 现有链接数组
 * @param {number} count - 要添加的节点数量
 * @param {number} width - 宽度范围
 * @param {number} height - 高度范围
 * @returns {Object} 更新后的网络数据
 */
function addNewNodesToNetwork(nodes, links, count, width = 800, height = 600) {
  // 获取当前节点类型的计数
  const addrCount = nodes.filter(n => n.type === 'address').length;
  const txCount = nodes.filter(n => n.type === 'transaction').length;
  const contractCount = nodes.filter(n => n.type === 'contract').length;

  // 生成新节点
  const newNodes = [];

  // 添加一些新地址节点
  for (let i = 0; i < Math.floor(count * 0.4); i++) {
    const address = generateRandomAddress();
    newNodes.push({
      id: `addr-${addrCount + i}`,
      address,
      type: 'address',
      label: `${address.substring(0, 6)}...${address.substring(38)}`,
      value: Math.floor(Math.random() * 100) + 1,
      riskLevel: generateRandomRiskLevel(),
      ...generateRandomPosition(width, height),
    });
  }

  // 添加一些新交易节点
  for (let i = 0; i < Math.floor(count * 0.4); i++) {
    const txHash = generateRandomTxHash();
    newNodes.push({
      id: `tx-${txCount + i}`,
      address: txHash,
      type: 'transaction',
      label: `${txHash.substring(0, 6)}...`,
      value: Math.floor(Math.random() * 50) + 1,
      ...generateRandomPosition(width, height),
    });
  }

  // 添加一些新合约节点
  const newContractCount = count - newNodes.length;
  for (let i = 0; i < newContractCount; i++) {
    const address = generateRandomAddress();
    newNodes.push({
      id: `contract-${contractCount + i}`,
      address,
      type: 'contract',
      label: `Contract ${contractCount + i}`,
      value: Math.floor(Math.random() * 80) + 20,
      riskLevel: generateRandomRiskLevel(),
      ...generateRandomPosition(width, height),
    });
  }

  // 创建链接，优先链接到现有节点
  const newLinks = [];
  for (const node of newNodes) {
    // 与现有节点创建 1-3 个链接
    const linkCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < linkCount; i++) {
      const isSource = Math.random() > 0.5;
      const existingIndex = Math.floor(Math.random() * nodes.length);
      const existingNode = nodes[existingIndex];

      newLinks.push({
        source: isSource ? node.id : existingNode.id,
        target: isSource ? existingNode.id : node.id,
        value: Math.floor(Math.random() * 5) + 1,
        txHash:
          node.type === 'transaction'
            ? node.address
            : existingNode.type === 'transaction'
              ? existingNode.address
              : generateRandomTxHash(),
      });
    }
  }

  return {
    nodes: [...nodes, ...newNodes],
    links: [...links, ...newLinks],
  };
}

// 监听来自主线程的消息
self.onmessage = function (e) {
  const { action, data } = e.data;

  switch (action) {
    case 'generateInitialData':
      // 生成初始网络数据
      const { nodeCount, width, height } = data;
      const initialData = generateInitialNetworkData(nodeCount, width, height);
      self.postMessage({ action: 'initialDataGenerated', data: initialData });
      break;

    case 'addNewNodes':
      // 向现有网络添加新节点
      const { nodes, links, count } = data;
      const updatedData = addNewNodesToNetwork(nodes, links, count, data.width, data.height);
      self.postMessage({ action: 'nodesAdded', data: updatedData });
      break;

    default:
      // 未知操作
      self.postMessage({
        action: 'error',
        data: { message: `未知操作：${action}` },
      });
  }
};
