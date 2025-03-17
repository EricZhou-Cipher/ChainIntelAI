export const connectWithRetry = jest.fn().mockResolvedValue(true);
export const checkConnection = jest.fn().mockResolvedValue(true);
export const getConnectionInfo = jest.fn().mockReturnValue({ host: 'localhost', port: 27017 });
