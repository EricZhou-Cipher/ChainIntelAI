export const addressProfiler = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  calculateRiskScore: jest.fn().mockReturnValue(0.5)
};
