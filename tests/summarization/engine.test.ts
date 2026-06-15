import { describe, it, expect, vi } from 'vitest';
import { SummarizationEngine, FallbackStrategy, PerformanceTracker } from '../../src/summarization/engine.js';
import { SummarizationLength, SummarizationStyle } from '../../src/summarization/types.js';
import type { LLMEngine } from '../../src/summarization/types.js';

function createMockEngine(response = 'Mock summary.'): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: response, model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue(response),
  };
}

describe('PerformanceTracker', () => {
  it('should track request metrics', () => {
    const tracker = new PerformanceTracker();
    tracker.record(true, 100);
    tracker.record(true, 200);
    tracker.record(false, 50);
    expect(tracker.totalRequests).toBe(3);
    expect(tracker.successRate).toBeCloseTo(2 / 3);
    expect(tracker.averageLatencyMs).toBeCloseTo(350 / 3);
  });

  it('should compute P95 latency', () => {
    const tracker = new PerformanceTracker();
    for (let i = 0; i < 100; i++) tracker.record(true, i * 10);
    expect(tracker.p95LatencyMs).toBeGreaterThan(900);
  });

  it('should return 0 for empty tracker', () => {
    const tracker = new PerformanceTracker();
    expect(tracker.successRate).toBe(0);
    expect(tracker.averageLatencyMs).toBe(0);
    expect(tracker.p95LatencyMs).toBe(0);
  });
});

describe('SummarizationEngine', () => {
  it('should summarize content', async () => {
    const engine = createMockEngine();
    const se = new SummarizationEngine(engine);
    const result = await se.summarize('Some content.');
    expect(result.success).toBe(true);
    expect(result.summary).toBe('Mock summary.');
  });

  it('should extract key points', async () => {
    const engine = createMockEngine('[{"text": "KP", "importance": 0.9}]');
    const se = new SummarizationEngine(engine);
    const result = await se.extractKeyPoints('Content.');
    expect(result.success).toBe(true);
    expect(result.keyPoints.length).toBeGreaterThan(0);
  });

  it('should extract facts', async () => {
    const engine = createMockEngine('[{"statement": "Fact", "subject": "", "predicate": "", "value": "", "confidence": 0.9}]');
    const se = new SummarizationEngine(engine);
    const result = await se.extractFacts('Content.');
    expect(result.success).toBe(true);
    expect(result.facts.length).toBeGreaterThan(0);
  });

  it('should process all extractions', async () => {
    const engine = createMockEngine();
    const se = new SummarizationEngine(engine);
    const result = await se.process('Some content.', {
      extractSummary: true,
      extractKeyPoints: true,
      extractFacts: true,
    });
    expect(result.summary).toBeDefined();
    expect(result.keyPoints).toBeDefined();
    expect(result.facts).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should track performance stats', async () => {
    const engine = createMockEngine();
    const se = new SummarizationEngine(engine);
    await se.summarize('Content.');
    const stats = se.getPerformanceStats();
    expect(stats.totalRequests).toBe(1);
    expect(stats.meetsLatencyTarget).toBe(true);
  });

  it('should use extractive fallback on failure', async () => {
    const engine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('API error')),
      chatSimple: vi.fn().mockRejectedValue(new Error('API error')),
    };
    const se = new SummarizationEngine(engine, {
      fallbackStrategies: [FallbackStrategy.EXTRACTIVE],
    });
    const result = await se.summarize('First sentence. Second sentence.', SummarizationLength.SHORT);
    expect(result.success).toBe(true);
    expect(result.model).toBe('extractive');
  });

  it('should handle fallback key points', async () => {
    const engine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('error')),
      chatSimple: vi.fn().mockRejectedValue(new Error('error')),
    };
    const se = new SummarizationEngine(engine);
    const result = await se.extractKeyPoints('First sentence. Second sentence.', 2);
    expect(result.success).toBe(true);
    expect(result.keyPoints.length).toBeGreaterThan(0);
  });

  it('should handle fallback facts', async () => {
    const engine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('error')),
      chatSimple: vi.fn().mockRejectedValue(new Error('error')),
    };
    const se = new SummarizationEngine(engine);
    const result = await se.extractFacts('Revenue grew 50% in 2024.', 3);
    expect(result.success).toBe(true);
    expect(result.facts.length).toBeGreaterThan(0);
  });
});
