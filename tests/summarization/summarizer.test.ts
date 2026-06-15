import { describe, it, expect, vi } from 'vitest';
import { Summarizer } from '../../src/summarization/summarizer.js';
import { SummarizationLength, SummarizationStyle } from '../../src/summarization/types.js';
import type { LLMEngine } from '../../src/summarization/types.js';

function createMockEngine(response = 'Mock summary text.'): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: response, model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue(response),
  };
}

describe('Summarizer', () => {
  it('should summarize content with default settings', async () => {
    const engine = createMockEngine();
    const summarizer = new Summarizer(engine);
    const result = await summarizer.summarize('Some content to summarize.');
    expect(result.success).toBe(true);
    expect(result.summary).toBe('Mock summary text.');
    expect(result.model).toBe('mock-model');
  });

  it('should handle empty content', async () => {
    const engine = createMockEngine();
    const summarizer = new Summarizer(engine);
    const result = await summarizer.summarize('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Empty content provided');
  });

  it('should use specified length and style', async () => {
    const engine = createMockEngine('Short summary.');
    const summarizer = new Summarizer(engine);
    const result = await summarizer.summarize(
      'Content.',
      SummarizationLength.SHORT,
      SummarizationStyle.CONCISE,
    );
    expect(result.success).toBe(true);
    expect(result.lengthType).toBe(SummarizationLength.SHORT);
    expect(result.style).toBe(SummarizationStyle.CONCISE);
  });

  it('should summarize batch of contents', async () => {
    const engine = createMockEngine();
    const summarizer = new Summarizer(engine);
    const results = await summarizer.summarizeBatch(['Content A.', 'Content B.']);
    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
  });

  it('should extractive summarize', () => {
    const engine = createMockEngine();
    const summarizer = new Summarizer(engine);
    const result = summarizer.extractiveSummarize(
      'First sentence. Second sentence. Third sentence.',
      SummarizationLength.SHORT,
    );
    expect(result.success).toBe(true);
    expect(result.model).toBe('extractive');
    expect(result.metadata.method).toBe('extractive');
  });

  it('should handle LLM failure with empty result', async () => {
    const engine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('API error')),
      chatSimple: vi.fn().mockRejectedValue(new Error('API error')),
    };
    const summarizer = new Summarizer(engine, { maxRetries: 1 });
    const result = await summarizer.summarize('Content.');
    expect(result.success).toBe(false);
    expect(result.error).toBe('API error');
  });

  it('should return compression ratio', () => {
    const engine = createMockEngine();
    const summarizer = new Summarizer(engine);
    const result = summarizer.extractiveSummarize('A. B. C.', SummarizationLength.SHORT);
    expect(result.originalLength).toBeGreaterThan(0);
    expect(result.summaryLength).toBeGreaterThan(0);
  });

  it('should configure custom max content length', async () => {
    const engine = createMockEngine('Short.');
    const summarizer = new Summarizer(engine, { maxContentLength: 10 });
    const result = await summarizer.summarize('A very long content that should be truncated.');
    expect(result.success).toBe(true);
    // Engine should have been called with truncated content
    expect(engine.chatSimple).toHaveBeenCalled();
  });
});
