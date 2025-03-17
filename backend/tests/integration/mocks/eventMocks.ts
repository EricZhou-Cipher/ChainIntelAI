import { NormalizedEvent, EventType } from '../../../src/types/events.js';
import { parseUnits } from 'ethers';

export interface TransferEventOptions {
  chainId?: number;
  from?: string;
  to?: string;
  value?: string;
  timestamp?: number;
  nonce?: number;
  gasPrice?: string;
  gasLimit?: string;
}

export interface ContractCallEventOptions extends TransferEventOptions {
  contractAddress?: string;
  methodName?: string;
  methodId?: string;
  parameters?: any[];
}

const DEFAULT_ADDRESS = '0x1234567890123456789012345678901234567890';

export function createTransferEvent(options: TransferEventOptions = {}): NormalizedEvent {
  const timestamp = options.timestamp || Math.floor(Date.now() / 1000);
  const txHash = `0x${Math.random().toString(16).substring(2)}`.padEnd(66, '0');

  return {
    traceId: `trace_${txHash}`,
    type: EventType.TRANSFER,
    timestamp,
    createdAt: new Date(timestamp * 1000),
    updatedAt: new Date(timestamp * 1000),
    chainId: options.chainId || 1,
    blockNumber: Math.floor(timestamp / 12), // 假设12秒一个区块
    transactionHash: txHash,
    from: (options.from || DEFAULT_ADDRESS).toLowerCase(),
    to: (options.to || DEFAULT_ADDRESS).toLowerCase(),
    value: options.value || parseUnits('1', 18).toString(),
    methodName: 'transfer',
    methodSignature: 'transfer(address,uint256)',
    input: '0x',
    metadata: {
      nonce: options.nonce || 0,
      gasPrice: options.gasPrice || parseUnits('20', 9).toString(),
      gasLimit: options.gasLimit || '21000',
    },
  };
}

export function createContractCallEvent(options: ContractCallEventOptions = {}): NormalizedEvent {
  const timestamp = options.timestamp || Math.floor(Date.now() / 1000);
  const txHash = `0x${Math.random().toString(16).substring(2)}`.padEnd(66, '0');
  const contractAddress = options.contractAddress || DEFAULT_ADDRESS;
  const methodName = options.methodName || 'transfer';
  const methodId = options.methodId || '0xa9059cbb';

  return {
    traceId: `trace_${txHash}`,
    type: EventType.CONTRACT_CALL,
    timestamp,
    createdAt: new Date(timestamp * 1000),
    updatedAt: new Date(timestamp * 1000),
    chainId: options.chainId || 1,
    blockNumber: Math.floor(timestamp / 12),
    transactionHash: txHash,
    from: (options.from || DEFAULT_ADDRESS).toLowerCase(),
    to: contractAddress.toLowerCase(),
    value: options.value || '0',
    methodName,
    methodSignature: `${methodName}(address,uint256)`,
    input:
      methodId + (options.parameters || []).map((p) => p.toString().padStart(64, '0')).join(''),
    metadata: {
      nonce: options.nonce || 0,
      gasPrice: options.gasPrice || parseUnits('20', 9).toString(),
      gasLimit: options.gasLimit || '150000',
      parameters: options.parameters || [],
    },
  };
}

// 辅助函数：生成随机地址
export function generateRandomAddress(): string {
  return `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    ''
  )}`;
}

// 辅助函数：生成随机哈希
export function generateRandomHash(): string {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    ''
  )}`;
}

// 测试数据生成器
export class EventGenerator {
  private chainId: number;
  private currentNonce: number = 0;

  constructor(chainId: number = 1) {
    this.chainId = chainId;
  }

  generateTransferBatch(count: number, baseOptions: TransferEventOptions = {}): NormalizedEvent[] {
    return Array.from({ length: count }, () => {
      const options = {
        ...baseOptions,
        chainId: this.chainId,
        nonce: this.currentNonce++,
        timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
      };
      return createTransferEvent(options);
    });
  }

  generateContractCallBatch(
    count: number,
    baseOptions: ContractCallEventOptions = {}
  ): NormalizedEvent[] {
    return Array.from({ length: count }, () => {
      const options = {
        ...baseOptions,
        chainId: this.chainId,
        nonce: this.currentNonce++,
        timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
      };
      return createContractCallEvent(options);
    });
  }
}
