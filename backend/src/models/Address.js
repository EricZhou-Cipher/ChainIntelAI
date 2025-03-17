export default {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([
      { address: '0x123', riskScore: 0.8 },
      { address: '0x456', riskScore: 0.3 }
    ])
  })
};
