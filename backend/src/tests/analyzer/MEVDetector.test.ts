import { MEVDetector } from '../../analyzer/MEVDetector';
import { NormalizedEvent, EventType } from '../../types/events';

describe('MEVDetector', () => {
  // 创建模拟事件
  const createMockEvent = (
    hash: string,
    from: string,
    to: string,
    value: string,
    timestamp: number,
    gasPrice: string,
    gasUsed: number,
    type: EventType = EventType.TRANSFER
  ): NormalizedEvent => ({
    traceId: hash,
    transactionHash: hash,
    chainId: 1,
    from,
    to,
    value,
    timestamp,
    blockNumber: 12345678,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      gasPrice,
      gasUsed
    },
    params: {},
  });

  describe('detect', () => {
    it('should detect sandwich attack pattern', async () => {
      // 创建三个事件，模拟三明治攻击模式
      // 1. 攻击者买入
      const buyEvent = createMockEvent(
        '0x1111',
        '0xattacker',
        '0xpool',
        '1.0',
        1000,
        '100',
        100000
      );
      
      // 2. 受害者交易
      const victimEvent = createMockEvent(
        '0x2222',
        '0xvictim',
        '0xpool',
        '10.0',
        1001,
        '50',
        200000
      );
      
      // 3. 攻击者卖出
      const sellEvent = createMockEvent(
        '0x3333',
        '0xattacker',
        '0xpool',
        '1.2',
        1002,
        '100',
        100000
      );
      
      const recentEvents = [buyEvent, victimEvent];
      
      // 检测卖出事件是否为 MEV
      const result = await MEVDetector.detect(sellEvent, recentEvents);
      
      expect(result).toBe(true);
    });
    
    it('should not detect sandwich attack with different pools', async () => {
      // 1. 攻击者买入（不同池）
      const buyEvent = createMockEvent(
        '0x1111',
        '0xattacker',
        '0xpool1',
        '1.0',
        1000,
        '100',
        100000
      );
      
      // 2. 受害者交易
      const victimEvent = createMockEvent(
        '0x2222',
        '0xvictim',
        '0xpool2',
        '10.0',
        1001,
        '50',
        200000
      );
      
      // 3. 攻击者卖出
      const sellEvent = createMockEvent(
        '0x3333',
        '0xattacker',
        '0xpool1',
        '1.2',
        1002,
        '100',
        100000
      );
      
      const recentEvents = [buyEvent, victimEvent];
      
      const result = await MEVDetector.detect(sellEvent, recentEvents);
      
      expect(result).toBe(false);
    });
    
    it('should detect high gas price as potential MEV', async () => {
      // 创建一个高 gas 价格的事件
      const highGasEvent = createMockEvent(
        '0x4444',
        '0xtrader',
        '0xpool',
        '5.0',
        1000,
        '500', // 非常高的 gas 价格
        150000
      );
      
      const recentEvents = [
        createMockEvent('0x5555', '0xuser1', '0xpool', '1.0', 990, '50', 100000),
        createMockEvent('0x6666', '0xuser2', '0xpool', '2.0', 995, '60', 100000),
      ];
      
      const result = await MEVDetector.detect(highGasEvent, recentEvents);
      
      expect(result).toBe(true);
    });
    
    it('should detect high frequency trading pattern', async () => {
      // 创建同一地址在短时间内的多个交易
      const address = '0xfrequentTrader';
      
      const event = createMockEvent(
        '0x7777',
        address,
        '0xpool',
        '1.0',
        1010,
        '100',
        100000
      );
      
      const recentEvents = [
        createMockEvent('0x8888', address, '0xpool', '1.0', 1000, '100', 100000),
        createMockEvent('0x9999', address, '0xpool', '1.0', 1002, '100', 100000),
        createMockEvent('0xaaaa', address, '0xpool', '1.0', 1004, '100', 100000),
        createMockEvent('0xbbbb', address, '0xpool', '1.0', 1006, '100', 100000),
        createMockEvent('0xcccc', address, '0xpool', '1.0', 1008, '100', 100000),
      ];
      
      const result = await MEVDetector.detect(event, recentEvents);
      
      expect(result).toBe(true);
    });
    
    it('should not detect normal trading as MEV', async () => {
      // 创建一个普通交易
      const normalEvent = createMockEvent(
        '0xdddd',
        '0xnormalUser',
        '0xpool',
        '1.0',
        1000,
        '50', // 正常 gas 价格
        100000
      );
      
      const recentEvents = [
        createMockEvent('0xeeee', '0xuser1', '0xpool', '1.0', 990, '50', 100000),
        createMockEvent('0xffff', '0xuser2', '0xpool', '2.0', 995, '60', 100000),
      ];
      
      const result = await MEVDetector.detect(normalEvent, recentEvents);
      
      expect(result).toBe(false);
    });
    
    it('should handle empty recent events', async () => {
      const event = createMockEvent(
        '0x1234',
        '0xuser',
        '0xpool',
        '1.0',
        1000,
        '50',
        100000
      );
      
      const result = await MEVDetector.detect(event, []);
      
      expect(result).toBe(false);
    });

    it('should detect front-running attack pattern', async () => {
      // 创建前置交易攻击模式
      // 1. 攻击者交易（高gas价格）
      const attackerEvent = createMockEvent(
        '0xfrontrun1',
        '0xattacker',
        '0xpool',
        '5.0',
        1000,
        '500', // 高gas价格
        150000
      );
      
      // 2. 受害者交易（正常gas价格）
      const victimEvent = createMockEvent(
        '0xfrontrun2',
        '0xvictim',
        '0xpool',
        '10.0',
        1001,
        '50', // 正常gas价格
        200000
      );
      
      // 检测攻击者交易是否为MEV
      const recentEvents = [victimEvent];
      const result = await MEVDetector.detect(attackerEvent, recentEvents);
      
      expect(result).toBe(true);
    });

    it('should detect back-running attack pattern', async () => {
      // 创建后置交易攻击模式
      // 1. 受害者交易
      const victimEvent = createMockEvent(
        '0xbackrun1',
        '0xvictim',
        '0xpool',
        '100.0', // 大额交易
        1000,
        '50',
        200000
      );
      
      // 2. 攻击者交易（紧随其后）
      const attackerEvent = createMockEvent(
        '0xbackrun2',
        '0xattacker',
        '0xpool',
        '5.0',
        1001, // 时间紧随其后
        '300', // 高gas价格
        150000
      );
      
      // 检测攻击者交易是否为MEV
      const recentEvents = [victimEvent];
      const result = await MEVDetector.detect(attackerEvent, recentEvents);
      
      expect(result).toBe(true);
    });

    it('should detect arbitrage pattern across multiple pools', async () => {
      // 创建套利模式
      // 1. 从池A买入
      const buyEventA = createMockEvent(
        '0xarb1',
        '0xarbitrager',
        '0xpoolA',
        '10.0',
        1000,
        '200',
        150000
      );
      
      // 2. 从池B卖出
      const sellEventB = createMockEvent(
        '0xarb2',
        '0xarbitrager',
        '0xpoolB',
        '10.0',
        1001, // 几乎同时
        '200',
        150000
      );
      
      // 3. 从池C卖出
      const sellEventC = createMockEvent(
        '0xarb3',
        '0xarbitrager',
        '0xpoolC',
        '10.0',
        1002, // 几乎同时
        '200',
        150000
      );
      
      // 检测套利交易
      const recentEvents = [buyEventA, sellEventB];
      const result = await MEVDetector.detect(sellEventC, recentEvents);
      
      expect(result).toBe(true);
    });

    it('should detect liquidation MEV pattern', async () => {
      // 创建清算模式
      // 1. 清算交易
      const liquidationEvent = createMockEvent(
        '0xliq1',
        '0xliquidator',
        '0xlendingProtocol',
        '50.0', // 大额清算
        1000,
        '300', // 高gas价格
        300000 // 高gas消耗
      );
      
      // 添加合约调用信息
      liquidationEvent.methodName = 'liquidate';
      liquidationEvent.type = EventType.CONTRACT_CALL;
      
      // 检测清算MEV
      const recentEvents = [
        createMockEvent('0xnormal1', '0xuser1', '0xpool', '1.0', 990, '50', 100000),
        createMockEvent('0xnormal2', '0xuser2', '0xpool', '2.0', 995, '60', 100000),
      ];
      
      const result = await MEVDetector.detect(liquidationEvent, recentEvents);
      
      expect(result).toBe(true);
    });

    it('should detect flash loan attack pattern', async () => {
      // 创建闪电贷攻击模式
      // 1. 借出闪电贷
      const borrowEvent = createMockEvent(
        '0xflash1',
        '0xlendingProtocol',
        '0xattacker',
        '1000.0', // 大额借款
        1000,
        '100',
        200000
      );
      borrowEvent.methodName = 'flashLoan';
      borrowEvent.type = EventType.CONTRACT_CALL;
      
      // 2. 攻击者操作
      const attackEvent = createMockEvent(
        '0xflash2',
        '0xattacker',
        '0xvulnerableProtocol',
        '1000.0',
        1001,
        '200',
        500000 // 高gas消耗
      );
      attackEvent.type = EventType.CONTRACT_CALL;
      
      // 3. 归还闪电贷
      const repayEvent = createMockEvent(
        '0xflash3',
        '0xattacker',
        '0xlendingProtocol',
        '1000.0',
        1002,
        '100',
        200000
      );
      repayEvent.methodName = 'repayFlashLoan';
      repayEvent.type = EventType.CONTRACT_CALL;
      
      // 检测闪电贷攻击
      const recentEvents = [borrowEvent, attackEvent];
      const result = await MEVDetector.detect(repayEvent, recentEvents);
      
      expect(result).toBe(true);
    });

    it('should detect time-bandit attack pattern', async () => {
      // 创建时间盗窃攻击模式（区块重组攻击）
      // 模拟矿工在同一区块高度提交多个交易
      const minerAddress = '0xminer';
      
      // 1. 第一个交易
      const tx1 = createMockEvent(
        '0xtime1',
        minerAddress,
        '0xpool',
        '10.0',
        1000,
        '300', // 高gas价格
        200000
      );
      tx1.blockNumber = 12345678;
      
      // 2. 第二个交易（同一区块）
      const tx2 = createMockEvent(
        '0xtime2',
        minerAddress,
        '0xpool',
        '10.0',
        1001,
        '350', // 更高gas价格
        200000
      );
      tx2.blockNumber = 12345678;
      
      // 3. 第三个交易（同一区块）
      const tx3 = createMockEvent(
        '0xtime3',
        minerAddress,
        '0xpool',
        '10.0',
        1002,
        '400', // 更高gas价格
        200000
      );
      tx3.blockNumber = 12345678;
      
      // 检测时间盗窃攻击
      const recentEvents = [tx1, tx2];
      const result = await MEVDetector.detect(tx3, recentEvents);
      
      expect(result).toBe(true);
    });

    it('should detect uncle-bandit attack pattern', async () => {
      // 创建叔块攻击模式
      const minerAddress = '0xminer';
      
      // 1. 主链交易
      const mainChainTx = createMockEvent(
        '0xuncle1',
        '0xuser',
        '0xpool',
        '10.0',
        1000,
        '50',
        200000
      );
      mainChainTx.blockNumber = 12345678;
      
      // 2. 叔块交易（相同区块高度但不同哈希）
      const uncleTx = createMockEvent(
        '0xuncle2',
        minerAddress,
        '0xpool',
        '10.0',
        1000, // 相同时间戳
        '300', // 高gas价格
        200000
      );
      uncleTx.blockNumber = 12345678;
      uncleTx.metadata = {
        ...uncleTx.metadata,
        isUncle: true
      };
      
      // 检测叔块攻击
      const recentEvents = [mainChainTx];
      const result = await MEVDetector.detect(uncleTx, recentEvents);
      
      expect(result).toBe(true);
    });

    it('should detect generalized frontrunner bot pattern', async () => {
      // 创建通用前置交易机器人模式
      const botAddress = '0xfrontrunbot';
      
      // 1. 用户交易
      const userTx = createMockEvent(
        '0xgenfront1',
        '0xuser',
        '0xpool',
        '10.0',
        1000,
        '50', // 正常gas价格
        200000
      );
      
      // 2. 机器人交易（模仿用户交易但gas价格更高）
      const botTx = createMockEvent(
        '0xgenfront2',
        botAddress,
        '0xpool',
        '10.0', // 相同金额
        1001, // 稍后时间
        '500', // 高gas价格
        200000
      );
      
      // 检测通用前置交易机器人
      const recentEvents = [userTx];
      const result = await MEVDetector.detect(botTx, recentEvents);
      
      expect(result).toBe(true);
    });
  });
  
  describe('detectSandwichPattern', () => {
    it('should detect classic sandwich pattern', async () => {
      // 创建三个事件，模拟三明治攻击模式
      // 1. 攻击者买入
      const buyEvent = createMockEvent(
        '0x1111',
        '0xattacker',
        '0xpool',
        '1.0',
        1000,
        '100',
        100000
      );
      
      // 2. 受害者交易
      const victimEvent = createMockEvent(
        '0x2222',
        '0xvictim',
        '0xpool',
        '10.0',
        1001,
        '50',
        200000
      );
      
      // 3. 攻击者卖出
      const sellEvent = createMockEvent(
        '0x3333',
        '0xattacker',
        '0xpool',
        '1.2',
        1002,
        '100',
        100000
      );
      
      const recentEvents = [buyEvent, victimEvent];
      
      // 使用私有方法检测（通过 any 类型绕过访问限制）
      const result = (MEVDetector as any).detectSandwichPattern(sellEvent, recentEvents);
      
      expect(result).toBe(true);
    });
    
    it('should not detect sandwich with time gap too large', async () => {
      // 1. 攻击者买入（时间间隔太大）
      const buyEvent = createMockEvent(
        '0x1111',
        '0xattacker',
        '0xpool',
        '1.0',
        1000,
        '100',
        100000
      );
      
      // 2. 受害者交易
      const victimEvent = createMockEvent(
        '0x2222',
        '0xvictim',
        '0xpool',
        '10.0',
        1001,
        '50',
        200000
      );
      
      // 3. 攻击者卖出（时间间隔太大）
      const sellEvent = createMockEvent(
        '0x3333',
        '0xattacker',
        '0xpool',
        '1.2',
        9000, // 时间间隔太大
        '100',
        100000
      );
      
      const recentEvents = [buyEvent, victimEvent];
      
      const result = (MEVDetector as any).detectSandwichPattern(sellEvent, recentEvents);
      
      expect(result).toBe(false);
    });
    
    it('should not detect sandwich attack when transactions are far apart', async () => {
      // 1. 攻击者买入
      const buyEvent = createMockEvent(
        '0x1111',
        '0xattacker',
        '0xpool1',
        '1.0',
        1000,
        '100',
        100000
      );
      
      // 2. 受害者交易 (5000秒后，远超过30秒阈值)
      const victimEvent = createMockEvent(
        '0x2222',
        '0xvictim',
        '0xpool1',
        '10.0',
        6000,
        '50',
        200000
      );
      
      // 3. 攻击者卖出 (10000秒后，远超过30秒阈值)
      const sellEvent = createMockEvent(
        '0x3333',
        '0xattacker',
        '0xpool1',
        '1.2',
        16000,
        '100',
        100000
      );
      
      const recentEvents = [buyEvent, victimEvent];
      
      const result = await MEVDetector.detect(sellEvent, recentEvents);
      
      expect(result).toBe(false);
    });
    
    it('should not detect sandwich attack when pools are different', async () => {
      // 1. 攻击者在池1买入
      const buyEvent = createMockEvent(
        '0x1111',
        '0xattacker',
        '0xpool1',
        '1.0',
        1000,
        '100',
        100000
      );
      
      // 2. 受害者在池2交易
      const victimEvent = createMockEvent(
        '0x2222',
        '0xvictim',
        '0xpool2',
        '10.0',
        1010,
        '50',
        200000
      );
      
      // 3. 攻击者在池3卖出
      const sellEvent = createMockEvent(
        '0x3333',
        '0xattacker',
        '0xpool3',
        '1.2',
        1020,
        '100',
        100000
      );
      
      const recentEvents = [buyEvent, victimEvent];
      
      const result = await MEVDetector.detect(sellEvent, recentEvents);
      
      expect(result).toBe(false);
    });
    
    it('should detect MEV when multiple victims are sandwiched', async () => {
      // 1. 攻击者买入
      const buyEvent = createMockEvent(
        '0x1111',
        '0xattacker',
        '0xpool1',
        '1.0',
        1000,
        '100',
        100000
      );
      
      // 2. 受害者1交易
      const victim1Event = createMockEvent(
        '0x2222',
        '0xvictim1',
        '0xpool1',
        '5.0',
        1010,
        '50',
        200000
      );
      
      // 3. 受害者2交易
      const victim2Event = createMockEvent(
        '0x3333',
        '0xvictim2',
        '0xpool1',
        '7.0',
        1020,
        '70',
        200000
      );
      
      // 4. 攻击者卖出
      const sellEvent = createMockEvent(
        '0x4444',
        '0xattacker',
        '0xpool1',
        '1.5',
        1030,
        '150',
        100000
      );
      
      const recentEvents = [buyEvent, victim1Event, victim2Event];
      
      // 这种情况应该被检测为MEV
      const result = await MEVDetector.detect(sellEvent, recentEvents);
      
      expect(result).toBe(true);
    });
  });
  
  describe('detectHighFrequencyPattern', () => {
    it('should detect high frequency trading', async () => {
      // 创建同一地址在短时间内的多个交易
      const address = '0xfrequentTrader';
      
      const event = createMockEvent(
        '0x7777',
        address,
        '0xpool',
        '1.0',
        1010,
        '100',
        100000
      );
      
      const recentEvents = [
        createMockEvent('0x8888', address, '0xpool', '1.0', 1000, '100', 100000),
        createMockEvent('0x9999', address, '0xpool', '1.0', 1002, '100', 100000),
        createMockEvent('0xaaaa', address, '0xpool', '1.0', 1004, '100', 100000),
        createMockEvent('0xbbbb', address, '0xpool', '1.0', 1006, '100', 100000),
        createMockEvent('0xcccc', address, '0xpool', '1.0', 1008, '100', 100000),
      ];
      
      const result = (MEVDetector as any).detectHighFrequencyPattern(event, recentEvents);
      
      expect(result).toBe(true);
    });
    
    it('should not detect low frequency trading', async () => {
      // 创建同一地址在较长时间内的少量交易
      const address = '0xnormalTrader';
      
      const event = createMockEvent(
        '0x7777',
        address,
        '0xpool',
        '1.0',
        2000,
        '100',
        100000
      );
      
      const recentEvents = [
        createMockEvent('0x8888', address, '0xpool', '1.0', 1000, '100', 100000),
        createMockEvent('0x9999', '0xotherUser', '0xpool', '1.0', 1200, '100', 100000),
      ];
      
      const result = (MEVDetector as any).detectHighFrequencyPattern(event, recentEvents);
      
      expect(result).toBe(false);
    });
  });
}); 