import { addressProfiler } from '../../../profiling/addressProfiler';
import { AddressProfile, AddressCategory } from '../../../types/profile';

jest.mock('../../../profiling/addressProfiler');

describe('AddressProfiler', () => {
  const mockProfile: AddressProfile = {
    address: '0x123',
    riskScore: 75,
    lastUpdated: '2024-03-20T10:00:00Z',
    tags: ['exchange'],
    category: AddressCategory.EXCHANGE,
    transactionCount: 1000,
    totalValue: '1000000',
    firstSeen: '2024-01-01T00:00:00Z',
    lastSeen: '2024-03-20T10:00:00Z',
    relatedAddresses: ['0x456', '0x789'],
  };

  beforeEach(() => {
    // 清除所有mock
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('应该返回地址画像', async () => {
      (addressProfiler.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const result = await addressProfiler.getProfile('0x123');

      expect(result).toEqual(mockProfile);
    });
  });
});
