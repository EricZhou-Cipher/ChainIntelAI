import { NormalizedEvent, TransferEvent, ContractCallEvent, EventType } from '../types/events.js';

export { NormalizedEvent, TransferEvent, ContractCallEvent };

export class EventNormalizer {
  public normalizeTransferEvent(event: TransferEvent): NormalizedEvent {
    return {
      traceId: `trace_${event.transactionHash}`,
      type: EventType.TRANSFER,
      timestamp: event.timestamp,
      createdAt: new Date(event.timestamp * 1000),
      updatedAt: new Date(event.timestamp * 1000),
      chainId: event.chainId,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      from: event.from,
      to: event.to,
      value: event.value,
      methodName: 'transfer',
      methodSignature: 'transfer(address,uint256)',
      input: '0x'
    };
  }

  public normalizeContractCall(event: ContractCallEvent): NormalizedEvent {
    return {
      traceId: `trace_${event.transactionHash}`,
      type: EventType.CONTRACT_CALL,
      timestamp: event.timestamp,
      createdAt: new Date(event.timestamp * 1000),
      updatedAt: new Date(event.timestamp * 1000),
      chainId: event.chainId,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      from: event.from,
      to: event.to,
      value: '0',
      methodName: event.methodName,
      methodSignature: event.methodSignature,
      input: event.input,
      output: event.output
    };
  }
} 