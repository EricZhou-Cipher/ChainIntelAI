export const riskAnalyzer = jest.fn().mockReturnValue({
  risk: 'MEDIUM',
  score: 0.5
});

export const analyzeRisk = jest.fn().mockReturnValue({
  riskLevel: 'MEDIUM',
  score: 0.5,
  details: {
    reason: 'Test risk analysis'
  }
});
