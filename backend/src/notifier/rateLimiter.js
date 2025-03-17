export const rateLimiter = {
  check: jest.fn(),
  canSendNotification: jest.fn().mockReturnValue(true)
};
