export interface AddressProfile {
  address: string;
  type: 'normal' | 'blacklist' | 'new';
  riskScore: number;
  tags: string[];
  firstSeen: number;
  lastSeen: number;
  totalTxCount: number;
  totalValue: string;
  associatedAddresses: string[];
  metadata: {
    name?: string;
    category?: string;
    description?: string;
    source?: string;
    lastUpdated: number;
  };
}

export interface ProfileOptions {
  address?: string;
  type?: 'normal' | 'blacklist' | 'new';
  riskScore?: number;
  tags?: string[];
  firstSeen?: number;
  lastSeen?: number;
  totalTxCount?: number;
  totalValue?: string;
  associatedAddresses?: string[];
  metadata?: {
    name?: string;
    category?: string;
    description?: string;
    source?: string;
    lastUpdated?: number;
  };
}

const DEFAULT_ADDRESS = '0x1234567890123456789012345678901234567890';

export function createProfile(options: ProfileOptions = {}): AddressProfile {
  const now = Math.floor(Date.now() / 1000);
  const type = options.type || 'normal';

  // 根据类型设置默认风险分数
  const defaultRiskScore = {
    normal: 0.2,
    blacklist: 0.9,
    new: 0.5,
  }[type];

  // 根据类型设置默认标签
  const defaultTags = {
    normal: ['active_trader'],
    blacklist: ['suspicious', 'high_risk'],
    new: ['new_address'],
  }[type];

  // 根据类型设置默认描述
  const defaultDescription = {
    normal: 'Regular trading address with stable activity pattern',
    blacklist: 'Address flagged for suspicious activity',
    new: 'Newly created address with limited history',
  }[type];

  const profile: AddressProfile = {
    address: (options.address || DEFAULT_ADDRESS).toLowerCase(),
    type: type,
    riskScore: options.riskScore ?? defaultRiskScore,
    tags: options.tags || defaultTags,
    firstSeen: options.firstSeen || (type === 'new' ? now - 86400 : now - 365 * 86400),
    lastSeen: options.lastSeen || now,
    totalTxCount: options.totalTxCount || (type === 'new' ? 5 : 1000),
    totalValue: options.totalValue || '1000000000000000000', // 1 ETH
    associatedAddresses: options.associatedAddresses || [],
    metadata: {
      name: options.metadata?.name || `${type}_address`,
      category: options.metadata?.category || type,
      description: options.metadata?.description || defaultDescription,
      source: options.metadata?.source || 'mock_data',
      lastUpdated: options.metadata?.lastUpdated || now,
    },
  };

  return profile;
}

// 辅助函数：生成关联地址
function generateAssociatedAddresses(count: number): string[] {
  return Array.from(
    { length: count },
    () =>
      `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
  );
}

// 批量生成画像
export class ProfileGenerator {
  generateProfiles(count: number, baseOptions: ProfileOptions = {}): AddressProfile[] {
    return Array.from({ length: count }, (_, index) => {
      const options = {
        ...baseOptions,
        address: `0x${(index + 1).toString(16).padStart(40, '0')}`,
        associatedAddresses: generateAssociatedAddresses(Math.floor(Math.random() * 5)),
      };
      return createProfile(options);
    });
  }

  generateProfileMap(
    addresses: string[],
    type: 'normal' | 'blacklist' | 'new'
  ): Map<string, AddressProfile> {
    const profileMap = new Map<string, AddressProfile>();
    addresses.forEach((address) => {
      profileMap.set(
        address.toLowerCase(),
        createProfile({
          address,
          type,
        })
      );
    });
    return profileMap;
  }
}
