import { EventPipeline } from '../../pipeline/eventPipeline';
import { EventNormalizer } from '../../pipeline/eventNormalizer';
import { NormalizedEvent } from '../../types/events';
import { PipelineMonitor } from '../../pipeline/pipelineMonitor';
import { riskAnalyzer } from '../../analyzer/riskAnalyzer';
import { NotificationRouter } from '../../notifier/notificationRouter';
import { defaultConfig } from '../../pipeline/pipelineConfig';
import { parseUnits } from 'ethers';
import { Logger } from '../../utils/logger';

jest.mock('../../pipeline/eventNormalizer');
jest.mock('../../pipeline/pipelineMonitor');
jest.mock('../../analyzer/riskAnalyzer');
jest.mock('../../notifier/notificationRouter');

describe('EventPipeline', () => {
  let pipeline: EventPipeline;
  let normalizer: jest.Mocked<EventNormalizer>;
  let monitor: jest.Mocked<PipelineMonitor>;
  let analyzer: typeof riskAnalyzer;
  let notifier: jest.Mocked<NotificationRouter>;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as unknown as Logger;

    normalizer = new EventNormalizer(mockLogger) as jest.Mocked<EventNormalizer>;
    monitor = new PipelineMonitor(defaultConfig, mockLogger) as jest.Mocked<PipelineMonitor>;
    analyzer = riskAnalyzer as unknown as typeof riskAnalyzer;
    notifier = new NotificationRouter() as jest.Mocked<NotificationRouter>;

    // Mock analyzer and notifier methods
    analyzer.analyze = jest.fn().mockResolvedValue({
      score: 0.5,
      factors: ['test factor'],
      details: 'test details'
    });
    notifier.route = jest.fn().mockResolvedValue(undefined);

    pipeline = new EventPipeline(defaultConfig, normalizer, analyzer, notifier, monitor);
  });

  // ... existing code ...
}); 