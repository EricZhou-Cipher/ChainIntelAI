import { NetworkNode, NetworkLink } from '../components/BlockchainNetwork';

// 模拟数据更新间隔（毫秒）
const UPDATE_INTERVAL = 5000;

// 模拟数据生成函数
const generateRandomNode = (id: string): NetworkNode => {
  const types = ['address', 'transaction', 'contract'] as const;
  const riskLevels = ['low', 'medium', 'high', 'critical'] as const;
  
  return {
    id,
    address: `0x${Math.random().toString(16).substring(2, 42)}`,
    type: types[Math.floor(Math.random() * types.length)],
    value: Math.floor(Math.random() * 100),
    riskLevel: Math.random() > 0.7 ? riskLevels[Math.floor(Math.random() * riskLevels.length)] : undefined,
    label: `Node ${id}`
  };
};

const generateRandomLink = (sourceId: string, targetId: string): NetworkLink => {
  return {
    source: sourceId,
    target: targetId,
    value: Math.floor(Math.random() * 20) + 1,
    txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    timestamp: new Date().toISOString()
  };
};

// 生成初始网络数据
export const generateInitialNetworkData = (nodeCount: number = 20) => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  
  // 生成节点
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(generateRandomNode(`node-${i}`));
  }
  
  // 生成链接（确保网络连通）
  for (let i = 0; i < nodeCount; i++) {
    // 每个节点至少有一个连接
    const targetIndex = (i + 1) % nodeCount;
    links.push(generateRandomLink(nodes[i].id, nodes[targetIndex].id));
    
    // 随机添加额外连接
    if (Math.random() > 0.7) {
      const randomTarget = Math.floor(Math.random() * nodeCount);
      if (randomTarget !== i) {
        links.push(generateRandomLink(nodes[i].id, nodes[randomTarget].id));
      }
    }
  }
  
  return { nodes, links };
};

// 模拟实时数据更新
export const setupRealTimeUpdates = (
  initialData: { nodes: NetworkNode[], links: NetworkLink[] },
  onUpdate: (data: { nodes: NetworkNode[], links: NetworkLink[] }) => void
) => {
  let currentData = { ...initialData };
  
  // 定期更新数据
  const intervalId = setInterval(() => {
    // 深拷贝当前数据
    const newData = {
      nodes: [...currentData.nodes],
      links: [...currentData.links]
    };
    
    // 随机更新操作
    const updateType = Math.random();
    
    if (updateType < 0.3 && newData.nodes.length < 50) {
      // 添加新节点和链接
      const newNodeId = `node-${newData.nodes.length}`;
      const newNode = generateRandomNode(newNodeId);
      newData.nodes.push(newNode);
      
      // 连接到随机现有节点
      const randomExistingNode = newData.nodes[Math.floor(Math.random() * (newData.nodes.length - 1))];
      newData.links.push(generateRandomLink(newNode.id, randomExistingNode.id));
    } else if (updateType < 0.6 && newData.links.length > newData.nodes.length) {
      // 移除随机链接
      const randomLinkIndex = Math.floor(Math.random() * newData.links.length);
      newData.links.splice(randomLinkIndex, 1);
    } else {
      // 添加随机链接
      const sourceIndex = Math.floor(Math.random() * newData.nodes.length);
      let targetIndex = Math.floor(Math.random() * newData.nodes.length);
      
      // 确保不是自环
      while (targetIndex === sourceIndex) {
        targetIndex = Math.floor(Math.random() * newData.nodes.length);
      }
      
      newData.links.push(generateRandomLink(
        newData.nodes[sourceIndex].id,
        newData.nodes[targetIndex].id
      ));
    }
    
    // 更新当前数据
    currentData = newData;
    
    // 通知更新
    onUpdate(currentData);
  }, UPDATE_INTERVAL);
  
  // 返回清理函数
  return () => {
    clearInterval(intervalId);
  };
};

// 根据地址生成网络数据
export const generateAddressNetworkData = (address: string, depth: number = 2) => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  
  // 添加中心节点（查询的地址）
  nodes.push({
    id: `node-center`,
    address,
    type: 'address',
    value: 50,
    riskLevel: 'low',
    label: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  });
  
  // 生成第一层连接
  const firstLevelCount = Math.floor(Math.random() * 5) + 3;
  for (let i = 0; i < firstLevelCount; i++) {
    const nodeType = Math.random() > 0.5 ? 'transaction' : 'address';
    const nodeId = `node-1-${i}`;
    
    nodes.push({
      id: nodeId,
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      type: nodeType,
      value: Math.floor(Math.random() * 30) + 10,
      riskLevel: Math.random() > 0.7 ? 
        (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)] : 
        undefined,
      label: nodeType === 'transaction' ? 
        `Tx ${nodeId}` : 
        `Addr ${nodeId.substring(0, 4)}`
    });
    
    // 连接到中心节点
    links.push({
      source: 'node-center',
      target: nodeId,
      value: Math.floor(Math.random() * 20) + 5,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      timestamp: new Date().toISOString()
    });
    
    // 如果深度大于1，添加第二层连接
    if (depth > 1 && Math.random() > 0.3) {
      const secondLevelCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < secondLevelCount; j++) {
        const secondNodeType = Math.random() > 0.5 ? 'transaction' : 'address';
        const secondNodeId = `node-2-${i}-${j}`;
        
        nodes.push({
          id: secondNodeId,
          address: `0x${Math.random().toString(16).substring(2, 42)}`,
          type: secondNodeType,
          value: Math.floor(Math.random() * 20) + 5,
          riskLevel: Math.random() > 0.6 ? 
            (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)] : 
            undefined,
          label: secondNodeType === 'transaction' ? 
            `Tx ${secondNodeId.substring(0, 4)}` : 
            `Addr ${secondNodeId.substring(0, 4)}`
        });
        
        // 连接到第一层节点
        links.push({
          source: nodeId,
          target: secondNodeId,
          value: Math.floor(Math.random() * 10) + 1,
          txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return { nodes, links };
};

// 根据交易哈希生成网络数据
export const generateTransactionNetworkData = (txHash: string) => {
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  
  // 添加交易节点
  nodes.push({
    id: 'tx-node',
    address: txHash,
    type: 'transaction',
    value: 30,
    label: `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`
  });
  
  // 添加发送方和接收方
  nodes.push({
    id: 'sender-node',
    address: `0x${Math.random().toString(16).substring(2, 42)}`,
    type: 'address',
    value: 25,
    riskLevel: 'low',
    label: 'Sender'
  });
  
  nodes.push({
    id: 'receiver-node',
    address: `0x${Math.random().toString(16).substring(2, 42)}`,
    type: 'address',
    value: 25,
    riskLevel: 'medium',
    label: 'Receiver'
  });
  
  // 添加链接
  links.push({
    source: 'sender-node',
    target: 'tx-node',
    value: 20,
    txHash,
    timestamp: new Date().toISOString()
  });
  
  links.push({
    source: 'tx-node',
    target: 'receiver-node',
    value: 20,
    txHash,
    timestamp: new Date().toISOString()
  });
  
  // 随机添加合约交互
  if (Math.random() > 0.5) {
    nodes.push({
      id: 'contract-node',
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      type: 'contract',
      value: 20,
      label: 'Contract'
    });
    
    links.push({
      source: 'tx-node',
      target: 'contract-node',
      value: 15,
      txHash,
      timestamp: new Date().toISOString()
    });
    
    // 可能的合约输出
    if (Math.random() > 0.5) {
      nodes.push({
        id: 'output-node',
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        type: 'address',
        value: 15,
        riskLevel: Math.random() > 0.7 ? 'high' : 'low',
        label: 'Output'
      });
      
      links.push({
        source: 'contract-node',
        target: 'output-node',
        value: 10,
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return { nodes, links };
}; 