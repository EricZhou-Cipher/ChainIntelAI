export const scheduler = {
  schedule: jest.fn(),
  cancel: jest.fn(),
  start: jest.fn(),
  executeReplay: jest.fn(),
  handleFailure: jest.fn(),
  isRunning: false,
  retryCount: 0,
  maxRetries: 3
};
