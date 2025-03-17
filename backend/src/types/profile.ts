export enum AddressCategory {
  UNKNOWN = 'unknown',
  EXCHANGE = 'exchange',
  DEFI = 'defi',
  GAMBLING = 'gambling',
  MIXER = 'mixer',
  SCAM = 'scam',
  WALLET = 'wallet',
}

export interface AddressProfile {
  address: string;
  riskScore: number;
  lastUpdated: string;
  tags: string[];
  category: AddressCategory;
  transactionCount: number;
  totalValue: string;
  firstSeen: string;
  lastSeen: string;
  relatedAddresses: string[];
}

export interface ProfileFetchError {
  address: string;
  error: string;
  timestamp: string;
}
