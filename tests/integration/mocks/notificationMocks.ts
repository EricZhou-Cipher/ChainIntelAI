import { RiskAnalysis } from '../../../src/types/riskAnalysis.js';

export const formatRiskFactors = (analysis: RiskAnalysis): string => {
  return `Risk Factors:\n${analysis.factors.map((f: string) => `• ${f}`).join('\n')}`;
};

export const formatRiskFactorsMarkdown = (analysis: RiskAnalysis): string => {
  return `**Risk Factors**:\n${analysis.factors.map((f: string) => `- ${f}`).join('\n')}`;
}; 