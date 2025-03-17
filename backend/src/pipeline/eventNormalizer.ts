import { parseUnits } from 'ethers';
import { Logger } from '../utils/logger';
import { EventType, NormalizedEvent, TransferEvent, ContractCallEvent } from '../types/events';

export { EventType };

/**
 * 事件标准化模块
 */

export class EventNormalizer {
  private logger: Logger;
  private methodSignatures: Map<string, string> = new Map([
    ['0xa9059cbb', 'transfer'],
    ['0x23b872dd', 'transferFrom'],
    // 添加更多方法签名
  ]);

  constructor(logger: Logger) {
    this.logger = logger;
  }

  normalizeTransferEvent(chainId: number, event: TransferEvent): NormalizedEvent {
    if (!event) {
      throw new Error('Invalid event data');
    }

    return {
      traceId: event.transactionHash,
      chainId,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      from: event.from.toLowerCase(),
      to: event.to.toLowerCase(),
      value: event.value,
      timestamp: event.timestamp,
      methodName: 'transfer',
      methodSignature: 'transfer(address,uint256)',
      params: {},
      raw: event,
      type: EventType.TRANSFER,
      createdAt: new Date(event.timestamp * 1000),
      updatedAt: new Date(event.timestamp * 1000)
    };
  }

  normalizeContractCall(chainId: number, event: ContractCallEvent): NormalizedEvent {
    if (!event) {
      throw new Error('Invalid event data');
    }

    const methodSig = event.input.slice(0, 10);
    const methodName = this.methodSignatures.get(methodSig) || 'unknown';

    return {
      traceId: event.transactionHash,
      chainId,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      from: event.from.toLowerCase(),
      to: event.to.toLowerCase(),
      value: event.value,
      timestamp: event.timestamp,
      methodName,
      methodSignature: methodSig,
      input: event.input,
      output: event.output,
      params: { raw: event.input },
      raw: event,
      type: EventType.CONTRACT_CALL,
      createdAt: new Date(event.timestamp * 1000),
      updatedAt: new Date(event.timestamp * 1000)
    };
  }

  async normalizeEvent(chainId: string, event: any): Promise<NormalizedEvent> {
    try {
      // 验证事件不为空
      if (!event) {
        throw new Error('Invalid event data');
      }
      
      // 验证必要字段
      if (!event.hash || !event.from || !event.to) {
        throw new Error('Missing required fields in event');
      }

      // 验证地址格式
      if (!this.isValidAddress(event.from) || !this.isValidAddress(event.to)) {
        throw new Error('Invalid address format');
      }

      // 验证值格式
      if (event.value && !this.isValidValue(event.value)) {
        throw new Error('Invalid value format');
      }

      // 解析方法名和参数
      const { methodName, methodSignature, params } = this.parseMethod(event.input);

      // 规范化事件
      const normalized: NormalizedEvent = {
        traceId: event.hash,
        chainId: parseInt(chainId, 10),
        blockNumber: event.blockNumber,
        transactionHash: event.hash,
        from: event.from.toLowerCase(),
        to: event.to.toLowerCase(),
        value: event.value?.toString() || '0',
        timestamp: Math.floor(Date.now() / 1000),
        methodName,
        methodSignature,
        params,
        raw: event,
        type: EventType.UNKNOWN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.logger.debug('Event normalized successfully', {
        transactionHash: normalized.transactionHash,
        methodName: normalized.methodName
      });

      return normalized;
    } catch (error) {
      this.logger.error('Failed to normalize event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event
      });
      throw error;
    }
  }

  private parseMethod(input?: string): {
    methodName?: string;
    methodSignature?: string;
    params?: Record<string, any>;
  } {
    if (!input || input === '0x') {
      return {
        methodName: 'transfer',
        methodSignature: 'transfer(address,uint256)',
        params: {}
      };
    }

    try {
      // 解析方法签名（前4字节）
      const methodId = input.slice(0, 10);
      
      // TODO: 实现完整的 ABI 解析
      // 这里需要维护一个方法签名到 ABI 的映射
      // 暂时返回原始数据
      return {
        methodName: 'unknown',
        methodSignature: methodId,
        params: {
          raw: input
        }
      };
    } catch (error) {
      this.logger.warn('Failed to parse method', {
        error: error instanceof Error ? error.message : 'Unknown error',
        input
      });
      return {};
    }
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private isValidValue(value: string): boolean {
    return /^\d+$/.test(value);
  }
} 