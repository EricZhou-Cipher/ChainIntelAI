import { 
  riskWeights, 
  riskThresholds, 
  riskTags, 
  combinationRules, 
  aiConfig, 
  riskLevels 
} from '../../analyzer/riskRules';

describe('Risk Rules Configuration', () => {
  describe('Risk Weights', () => {
    test('should have all required dimensions', () => {
      expect(riskWeights).toHaveProperty('FLOW');
      expect(riskWeights).toHaveProperty('BEHAVIOR');
      expect(riskWeights).toHaveProperty('ASSOCIATION');
      expect(riskWeights).toHaveProperty('HISTORICAL');
    });

    test('dimension weights should sum to 1.0', () => {
      const totalWeight = Object.values(riskWeights)
        .reduce((sum, dimension: any) => sum + dimension.weight, 0);
      
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    test('each dimension should have factors', () => {
      Object.values(riskWeights).forEach((dimension: any) => {
        expect(dimension).toHaveProperty('factors');
        expect(Object.keys(dimension.factors).length).toBeGreaterThan(0);
      });
    });

    test('factor weights within each dimension should sum to 1.0', () => {
      Object.values(riskWeights).forEach((dimension: any) => {
        const factorSum = Object.values(dimension.factors)
          .reduce((sum: number, weight: any) => sum + weight, 0);
        
        expect(factorSum).toBeCloseTo(1.0, 2);
      });
    });
  });

  describe('Risk Thresholds', () => {
    test('should have all required threshold categories', () => {
      expect(riskThresholds).toHaveProperty('largeTransferThresholds');
      expect(riskThresholds).toHaveProperty('frequentTransferThresholds');
      expect(riskThresholds).toHaveProperty('batchOperationThresholds');
      expect(riskThresholds).toHaveProperty('associationThresholds');
    });

    test('large transfer thresholds should be defined for major chains', () => {
      const { largeTransferThresholds } = riskThresholds;
      
      // 检查主要链的大额转账阈值
      expect(largeTransferThresholds).toHaveProperty('1'); // Ethereum
      expect(largeTransferThresholds).toHaveProperty('56'); // BSC
      expect(largeTransferThresholds).toHaveProperty('137'); // Polygon
      
      // 确保阈值是有效的字符串数值
      Object.values(largeTransferThresholds).forEach(threshold => {
        expect(typeof threshold).toBe('string');
        expect(parseFloat(threshold as string)).toBeGreaterThan(0);
      });
    });

    test('frequent transfer thresholds should be positive numbers', () => {
      const { frequentTransferThresholds } = riskThresholds;
      
      expect(frequentTransferThresholds.txCount).toBeGreaterThan(0);
      expect(frequentTransferThresholds.uniqueAddressCount).toBeGreaterThan(0);
    });

    test('batch operation thresholds should be valid', () => {
      const { batchOperationThresholds } = riskThresholds;
      
      expect(batchOperationThresholds.minOperations).toBeGreaterThan(0);
      expect(batchOperationThresholds.timeWindowMs).toBeGreaterThan(0);
    });

    test('association thresholds should be valid', () => {
      const { associationThresholds } = riskThresholds;
      
      expect(associationThresholds.blacklistDistance).toBeGreaterThan(0);
      expect(associationThresholds.riskNeighborRatio).toBeGreaterThan(0);
      expect(associationThresholds.riskNeighborRatio).toBeLessThan(1);
    });
  });

  describe('Risk Tags', () => {
    test('should have all required tag categories', () => {
      expect(riskTags).toHaveProperty('FLOW');
      expect(riskTags).toHaveProperty('BEHAVIOR');
      expect(riskTags).toHaveProperty('ASSOCIATION');
      expect(riskTags).toHaveProperty('HISTORICAL');
    });

    test('each category should have multiple tags', () => {
      Object.values(riskTags).forEach((category: any) => {
        expect(Object.keys(category).length).toBeGreaterThan(0);
      });
    });

    test('all tags should be non-empty strings', () => {
      Object.values(riskTags).forEach((category: any) => {
        Object.values(category).forEach((tag: any) => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Combination Rules', () => {
    test('should have valid combination rules', () => {
      expect(Array.isArray(combinationRules)).toBe(true);
      expect(combinationRules.length).toBeGreaterThan(0);
    });

    test('each rule should have required properties', () => {
      combinationRules.forEach(rule => {
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('conditions');
        expect(rule).toHaveProperty('weight');
        
        expect(typeof rule.name).toBe('string');
        expect(Array.isArray(rule.conditions)).toBe(true);
        expect(rule.conditions.length).toBeGreaterThan(0);
        expect(rule.weight).toBeGreaterThan(0);
      });
    });

    test('each condition should have tag and count', () => {
      combinationRules.forEach(rule => {
        rule.conditions.forEach(condition => {
          expect(condition).toHaveProperty('tag');
          expect(condition).toHaveProperty('count');
          
          expect(typeof condition.tag).toBe('string');
          expect(typeof condition.count).toBe('number');
          expect(condition.count).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('AI Configuration', () => {
    test('should have all required AI model configurations', () => {
      expect(aiConfig).toHaveProperty('textSummarizer');
      expect(aiConfig).toHaveProperty('behaviorSequence');
      expect(aiConfig).toHaveProperty('transactionGraph');
    });

    test('each AI model should have required properties', () => {
      Object.values(aiConfig).forEach((model: any) => {
        expect(model).toHaveProperty('modelPath');
        expect(typeof model.modelPath).toBe('string');
      });
    });

    test('text summarizer should have valid configuration', () => {
      const { textSummarizer } = aiConfig;
      
      expect(textSummarizer).toHaveProperty('maxLength');
      expect(textSummarizer).toHaveProperty('temperature');
      
      expect(textSummarizer.maxLength).toBeGreaterThan(0);
      expect(textSummarizer.temperature).toBeGreaterThan(0);
      expect(textSummarizer.temperature).toBeLessThanOrEqual(1);
    });

    test('behavior sequence model should have valid configuration', () => {
      const { behaviorSequence } = aiConfig;
      
      expect(behaviorSequence).toHaveProperty('sequenceLength');
      expect(behaviorSequence).toHaveProperty('threshold');
      
      expect(behaviorSequence.sequenceLength).toBeGreaterThan(0);
      expect(behaviorSequence.threshold).toBeGreaterThan(0);
      expect(behaviorSequence.threshold).toBeLessThanOrEqual(1);
    });

    test('transaction graph model should have valid configuration', () => {
      const { transactionGraph } = aiConfig;
      
      expect(transactionGraph).toHaveProperty('maxNodes');
      expect(transactionGraph).toHaveProperty('communityDetectionAlgo');
      
      expect(transactionGraph.maxNodes).toBeGreaterThan(0);
      expect(typeof transactionGraph.communityDetectionAlgo).toBe('string');
    });
  });

  describe('Risk Levels', () => {
    test('should have all required risk levels', () => {
      expect(riskLevels).toHaveProperty('HIGH');
      expect(riskLevels).toHaveProperty('MEDIUM');
      expect(riskLevels).toHaveProperty('LOW');
    });

    test('each risk level should have required properties', () => {
      Object.values(riskLevels).forEach((level: any) => {
        expect(level).toHaveProperty('minScore');
        expect(level).toHaveProperty('description');
        expect(level).toHaveProperty('action');
        
        expect(typeof level.minScore).toBe('number');
        expect(typeof level.description).toBe('string');
        expect(typeof level.action).toBe('string');
      });
    });

    test('risk levels should be in descending order', () => {
      expect(riskLevels.HIGH.minScore).toBeGreaterThan(riskLevels.MEDIUM.minScore);
      expect(riskLevels.MEDIUM.minScore).toBeGreaterThan(riskLevels.LOW.minScore);
    });
  });

  describe('Integration Tests', () => {
    test('risk weights and tags should be aligned', () => {
      // 创建映射关系，将权重因子映射到标签
      const factorToTagMapping: Record<string, Record<string, string>> = {
        'FLOW': {
          'LARGE_TRANSFER': 'LARGE_TRANSFER',
          'FREQUENT_TRANSFER': 'FREQUENT_TRANSFER',
          'IRREGULAR_PATTERN': 'IRREGULAR_PATTERN'
        },
        'BEHAVIOR': {
          'CONTRACT_INTERACTION': 'SUSPICIOUS_CONTRACT',
          'BATCH_OPERATION': 'BATCH_OPERATION',
          'ADDRESS_CREATION': 'CONTRACT_DEPLOYMENT'
        },
        'ASSOCIATION': {
          'BLACKLIST': 'BLACKLIST',
          'RISK_NEIGHBOR': 'RISK_NEIGHBOR',
          'MIXER_INTERACTION': 'MIXER'
        },
        'HISTORICAL': {
          'ACCOUNT_AGE': 'NEW_ACCOUNT',
          'ACTIVITY_PATTERN': 'PATTERN_CHANGE',
          'BALANCE_CHANGES': 'DORMANT_ACTIVATED'
        }
      };
      
      // 检查每个维度的因子是否都有对应的标签
      Object.entries(riskWeights).forEach(([dimension, config]: [string, any]) => {
        expect(riskTags).toHaveProperty(dimension);
        
        Object.keys(config.factors).forEach(factor => {
          // 使用映射关系检查标签
          const mappedTag = factorToTagMapping[dimension]?.[factor];
          const tagCategory = riskTags[dimension as keyof typeof riskTags];
          const hasMatchingTag = mappedTag && 
            Object.prototype.hasOwnProperty.call(tagCategory, mappedTag);
          
          expect(hasMatchingTag).toBe(true);
        });
      });
    });

    test('combination rules should reference valid tags', () => {
      // 获取所有可用的标签键
      const allTagKeys: string[] = [];
      Object.values(riskTags).forEach((category: any) => {
        Object.keys(category).forEach(key => {
          allTagKeys.push(key);
        });
      });
      
      // 获取所有标签值
      const allTagValues: string[] = [];
      Object.values(riskTags).forEach((category: any) => {
        Object.values(category).forEach((value: any) => {
          allTagValues.push(value);
        });
      });
      
      combinationRules.forEach(rule => {
        rule.conditions.forEach(condition => {
          // 检查条件中的标签是否存在于标签列表中
          const tagExists = allTagKeys.includes(condition.tag) || allTagValues.includes(condition.tag);
          
          expect(tagExists).toBe(true);
        });
      });
    });
  });
}); 