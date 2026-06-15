import { describe, it, expect, vi } from 'vitest';
import { KeyPointExtractor } from '../../src/summarization/key_points.js';
import type { LLMEngine } from '../../src/summarization/types.js';

function createMockEngine(response = '[{"text": "First key point", "importance": 0.9}]'): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: response, model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue(response),
  };
}

describe('KeyPointExtractor', () => {
  it('should extract key points', async () => {
    const engine = createMockEngine();
    const extractor = new KeyPointExtractor(engine);
    const result = await extractor.extractKeyPoints('Some content to analyze.');
    expect(result.success).toBe(true);
    expect(result.keyPoints.length).toBeGreaterThan(0);
    expect(result.keyPoints[0].text).toBe('First key point');
  });

  it('should handle empty content', async () => {
    const engine = createMockEngine();
    const extractor = new KeyPointExtractor(engine);
    const result = await extractor.extractKeyPoints('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Empty content provided');
  });

  it('should limit key points count', async () => {
    const response = JSON.stringify([
      { text: 'KP1', importance: 0.9 },
      { text: 'KP2', importance: 0.8 },
      { text: 'KP3', importance: 0.7 },
    ]);
    const engine = createMockEngine(response);
    const extractor = new KeyPointExtractor(engine);
    const result = await extractor.extractKeyPoints('Content.', 2);
    expect(result.keyPoints.length).toBeLessThanOrEqual(2);
  });

  it('should filter by min importance', async () => {
    const response = JSON.stringify([
      { text: 'KP1', importance: 0.9 },
      { text: 'KP2', importance: 0.3 },
    ]);
    const engine = createMockEngine(response);
    const extractor = new KeyPointExtractor(engine, { minImportance: 0.5 });
    const result = await extractor.extractKeyPoints('Content.');
    expect(result.keyPoints).toHaveLength(1);
  });

  it('should fallback parse numbered list response', async () => {
    const engine = createMockEngine('1. First point\n2. Second point');
    const extractor = new KeyPointExtractor(engine);
    const result = await extractor.extractKeyPoints('Content.');
    expect(result.success).toBe(true);
    expect(result.keyPoints.length).toBeGreaterThan(0);
  });

  it('should extract batch', async () => {
    const engine = createMockEngine();
    const extractor = new KeyPointExtractor(engine);
    const results = await extractor.extractKeyPointsBatch(['A.', 'B.']);
    expect(results).toHaveLength(2);
  });

  it('should handle LLM failure', async () => {
    const engine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('API error')),
      chatSimple: vi.fn().mockRejectedValue(new Error('API error')),
    };
    const extractor = new KeyPointExtractor(engine, { maxRetries: 1 });
    const result = await extractor.extractKeyPoints('Content.');
    expect(result.success).toBe(false);
  });
});
