export default {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([
      { hash: '0xabc', from: '0x123', to: '0x456', value: '1.0' },
      { hash: '0xdef', from: '0x789', to: '0x123', value: '2.5' }
    ])
  })
};
