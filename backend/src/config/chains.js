export const getChainConfig = jest.fn().mockReturnValue({
  name: 'Ethereum',
  rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
  chainId: 1
});
