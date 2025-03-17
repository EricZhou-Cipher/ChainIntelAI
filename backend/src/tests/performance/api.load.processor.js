/**
 * API负载测试处理器
 * 为Artillery负载测试生成测试数据
 */

// 生成随机地址
function generateRandomAddress() {
  return '0x' + Math.random().toString(16).substring(2, 42);
}

// 生成随机交易哈希
function generateRandomTxHash() {
  return '0x' + Math.random().toString(16).substring(2, 66);
}

// 生成随机金额（以wei为单位）
function generateRandomAmount() {
  // 生成0.1到100 ETH之间的随机金额
  const ethAmount = Math.random() * 99.9 + 0.1;
  // 转换为wei（1 ETH = 10^18 wei）
  return (BigInt(Math.floor(ethAmount * 1000)) * BigInt(10) ** BigInt(15)).toString();
}

// 生成随机区块号
function generateRandomBlockNumber() {
  // 生成1000万到1500万之间的随机区块号
  return Math.floor(Math.random() * 5000000) + 10000000;
}

// 生成随机时间戳（最近30天内）
function generateRandomTimestamp() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return Math.floor(Math.random() * (now - thirtyDaysAgo) + thirtyDaysAgo);
}

// 生成随机交易
function generateTransaction(context, events, done) {
  // 创建随机交易
  context.vars.transaction = {
    transactionHash: generateRandomTxHash(),
    from: generateRandomAddress(),
    to: generateRandomAddress(),
    value: generateRandomAmount(),
    chainId: 1, // Ethereum主网
    blockNumber: generateRandomBlockNumber(),
    timestamp: Math.floor(generateRandomTimestamp() / 1000), // 转换为秒
  };

  return done();
}

// 生成高风险交易
function generateHighRiskTransaction(context, events, done) {
  // 使用已知的高风险地址
  const highRiskAddresses = [
    '0x05e0b5b40b7b66098c2161a5ee11c5740a3a7c45', // 已知的洗钱地址
    '0xf4e07370db7906d354af271f0f29a02ba65d7b96', // 已知的诈骗地址
    '0x24c7d033b61edc3d7d1a589bbc7b33e48724b169', // 已知的黑客地址
    '0x0c0fe4e0e31e3a4b7e4fa4b58c8b7a8e5c4e84f0', // 已知的钓鱼地址
  ];

  // 创建高风险交易
  context.vars.transaction = {
    transactionHash: generateRandomTxHash(),
    from: generateRandomAddress(),
    to: highRiskAddresses[Math.floor(Math.random() * highRiskAddresses.length)],
    value: generateRandomAmount(),
    chainId: 1, // Ethereum主网
    blockNumber: generateRandomBlockNumber(),
    timestamp: Math.floor(generateRandomTimestamp() / 1000), // 转换为秒
  };

  return done();
}

// 生成批量交易
function generateBatchTransactions(context, events, done) {
  // 生成5-20个随机交易
  const count = Math.floor(Math.random() * 16) + 5;
  const transactions = [];

  for (let i = 0; i < count; i++) {
    transactions.push({
      transactionHash: generateRandomTxHash(),
      from: generateRandomAddress(),
      to: generateRandomAddress(),
      value: generateRandomAmount(),
      chainId: 1, // Ethereum主网
      blockNumber: generateRandomBlockNumber(),
      timestamp: Math.floor(generateRandomTimestamp() / 1000), // 转换为秒
    });
  }

  context.vars.transactions = transactions;
  return done();
}

// 生成大批量交易
function generateLargeBatchTransactions(context, events, done) {
  // 生成50-100个随机交易
  const count = Math.floor(Math.random() * 51) + 50;
  const transactions = [];

  for (let i = 0; i < count; i++) {
    transactions.push({
      transactionHash: generateRandomTxHash(),
      from: generateRandomAddress(),
      to: generateRandomAddress(),
      value: generateRandomAmount(),
      chainId: 1, // Ethereum主网
      blockNumber: generateRandomBlockNumber(),
      timestamp: Math.floor(generateRandomTimestamp() / 1000), // 转换为秒
    });
  }

  context.vars.transactions = transactions;
  return done();
}

// 生成超大批量交易
function generateExtraLargeBatchTransactions(context, events, done) {
  // 生成200-300个随机交易
  const count = Math.floor(Math.random() * 101) + 200;
  const transactions = [];

  // 创建一些常用地址，模拟真实场景中的地址重用
  const commonAddresses = [];
  for (let i = 0; i < 20; i++) {
    commonAddresses.push(generateRandomAddress());
  }

  // 创建一些高风险地址
  const highRiskAddresses = [
    '0x05e0b5b40b7b66098c2161a5ee11c5740a3a7c45', // 已知的洗钱地址
    '0xf4e07370db7906d354af271f0f29a02ba65d7b96', // 已知的诈骗地址
    '0x24c7d033b61edc3d7d1a589bbc7b33e48724b169', // 已知的黑客地址
    '0x0c0fe4e0e31e3a4b7e4fa4b58c8b7a8e5c4e84f0', // 已知的钓鱼地址
  ];

  for (let i = 0; i < count; i++) {
    // 随机决定是否使用常用地址
    const useCommonFromAddress = Math.random() < 0.7; // 70%概率使用常用地址
    const useCommonToAddress = Math.random() < 0.5; // 50%概率使用常用地址
    const useHighRiskAddress = Math.random() < 0.1; // 10%概率使用高风险地址

    const fromAddress = useCommonFromAddress
      ? commonAddresses[Math.floor(Math.random() * commonAddresses.length)]
      : generateRandomAddress();

    let toAddress;
    if (useHighRiskAddress) {
      toAddress = highRiskAddresses[Math.floor(Math.random() * highRiskAddresses.length)];
    } else if (useCommonToAddress) {
      toAddress = commonAddresses[Math.floor(Math.random() * commonAddresses.length)];
    } else {
      toAddress = generateRandomAddress();
    }

    // 随机决定交易金额范围
    let value;
    const transactionType = Math.random();
    if (transactionType < 0.7) {
      // 70%是小额交易
      // 0.01 - 1 ETH
      const ethAmount = Math.random() * 0.99 + 0.01;
      value = (BigInt(Math.floor(ethAmount * 1000)) * BigInt(10) ** BigInt(15)).toString();
    } else if (transactionType < 0.95) {
      // 25%是中等金额
      // 1 - 50 ETH
      const ethAmount = Math.random() * 49 + 1;
      value = (BigInt(Math.floor(ethAmount * 1000)) * BigInt(10) ** BigInt(15)).toString();
    } else {
      // 5%是大额交易
      // 50 - 1000 ETH
      const ethAmount = Math.random() * 950 + 50;
      value = (BigInt(Math.floor(ethAmount * 1000)) * BigInt(10) ** BigInt(15)).toString();
    }

    // 创建交易对象，添加更多元数据
    const transaction = {
      transactionHash: generateRandomTxHash(),
      from: fromAddress,
      to: toAddress,
      value: value,
      chainId: 1, // Ethereum主网
      blockNumber: generateRandomBlockNumber(),
      timestamp: Math.floor(generateRandomTimestamp() / 1000), // 转换为秒
    };

    // 随机添加额外字段，模拟更复杂的交易数据
    if (Math.random() < 0.3) {
      // 30%概率添加方法名
      transaction.methodName = ['transfer', 'swap', 'deposit', 'withdraw', 'approve'][
        Math.floor(Math.random() * 5)
      ];
    }

    if (Math.random() < 0.2) {
      // 20%概率添加gas信息
      transaction.gasPrice = (Math.floor(Math.random() * 200) + 20).toString();
      transaction.gasUsed = Math.floor(Math.random() * 1000000) + 21000;
    }

    transactions.push(transaction);
  }

  context.vars.transactions = transactions;
  return done();
}

// 生成复杂交易数据（包含更多元数据）
function generateComplexTransaction(context, events, done) {
  // 基础交易数据
  const transaction = {
    transactionHash: generateRandomTxHash(),
    from: generateRandomAddress(),
    to: generateRandomAddress(),
    value: generateRandomAmount(),
    chainId: 1, // Ethereum主网
    blockNumber: generateRandomBlockNumber(),
    timestamp: Math.floor(generateRandomTimestamp() / 1000), // 转换为秒
  };

  // 添加合约调用信息
  transaction.methodName = 'transfer';
  transaction.params = {
    to: generateRandomAddress(),
    value: generateRandomAmount(),
  };

  // 添加gas信息
  transaction.gasPrice = (Math.floor(Math.random() * 200) + 20).toString();
  transaction.gasUsed = Math.floor(Math.random() * 1000000) + 21000;

  // 添加交易历史
  transaction.history = {
    previousTransactions: Math.floor(Math.random() * 100),
    firstSeen: Math.floor(generateRandomTimestamp() / 1000) - 86400 * 30, // 30天前
    totalValue: (BigInt(transaction.value) * BigInt(Math.floor(Math.random() * 10) + 1)).toString(),
  };

  // 添加标签
  transaction.tags = [];
  const possibleTags = ['exchange', 'defi', 'nft', 'gaming', 'bridge'];
  const tagCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < tagCount; i++) {
    const randomTag = possibleTags[Math.floor(Math.random() * possibleTags.length)];
    if (!transaction.tags.includes(randomTag)) {
      transaction.tags.push(randomTag);
    }
  }

  context.vars.transaction = transaction;
  return done();
}

module.exports = {
  generateTransaction,
  generateHighRiskTransaction,
  generateBatchTransactions,
  generateLargeBatchTransactions,
  generateExtraLargeBatchTransactions,
  generateComplexTransaction,
};
