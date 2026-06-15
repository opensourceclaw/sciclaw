import { describe, it, expect, vi } from 'vitest';
import { FactExtractor } from '../../src/summarization/facts.js';
import type { LLMEngine } from '../../src/summarization/types.js';

function createMockEngine(response = '[{"statement": "Earth is round", "subject": "Earth", "predicate": "is round", "value": "round", "confidence": 0.9}]'): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: response, model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue(response),
  };
}

describe('FactExtractor', () => {
  it('should extract facts', async () => {
    const engine = createMockEngine();
    const extractor = new FactExtractor(engine);
    const result = await extractor.extractFacts('Some content with facts.');
    expect(result.success).toBe(true);
    expect(result.facts.length).toBeGreaterThan(0);
    expect(result.facts[0].statement).toBe('Earth is round');
  });

  it('should handle empty content', async () => {
    const engine = createMockEngine();
    const extractor = new FactExtractor(engine);
    const result = await extractor.extractFacts('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Empty content provided');
  });

  it('should filter by min confidence', async () => {
    const response = JSON.stringify([
      { statement: 'High', subject: '', predicate: '', value: '', confidence: 0.9 },
      { statement: 'Low', subject: '', predicate: '', value: '', confidence: 0.3 },
    ]);
    const engine = createMockEngine(response);
    const extractor = new FactExtractor(engine, { minConfidence: 0.5 });
    const result = await extractor.extractFacts('Content.');
    expect(result.facts).toHaveLength(1);
  });

  it('should convert to structured data', async () => {
    const engine = createMockEngine();
    const extractor = new FactExtractor(engine);
    const result = await extractor.extractFacts('Content.');
    const structured = extractor.toStructuredData(result);
    expect(structured.count).toBeGreaterThan(0);
    expect(structured.facts).toBeDefined();
  });

  it('should extract batch', async () => {
    const engine = createMockEngine();
    const extractor = new FactExtractor(engine);
    const results = await extractor.extractFactsBatch(['A.', 'B.']);
    expect(results).toHaveLength(2);
  });

  it('should handle LLM failure', async () => {
    const engine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('API error')),
      chatSimple: vi.fn().mockRejectedValue(new Error('API error')),
    };
    const extractor = new FactExtractor(engine, { maxRetries: 1 });
    const result = await extractor.extractFacts('Content.');
    expect(result.success).toBe(false);
  });

  it('should fallback parse numbered list', async () => {
    const engine = createMockEngine('1. Some fact here\n2. Another fact');
    const extractor = new FactExtractor(engine);
    const result = await extractor.extractFacts('Content.');
    expect(result.success).toBe(true);
    expect(result.facts.length).toBeGreaterThan(0);
  });
});
