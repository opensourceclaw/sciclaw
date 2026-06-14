import { describe, it, expect, vi } from 'vitest';
import { conductResearch } from '../../src/research/index.js';

// Mock dependencies
vi.mock('../../src/search/index.js', () => ({
  search: vi.fn().mockResolvedValue([
    { title: 'Test Result', url: 'https://example.com', snippet: 'Test', source: 'duckduckgo' },
  ]),
}));

vi.mock('../../src/extractor/index.js', () => ({
  extractContent: vi.fn().mockResolvedValue('Extracted content'),
}));

vi.mock('../../src/llm/index.js', () => ({
  synthesize: vi.fn().mockResolvedValue('Synthesized summary'),
}));

describe('Research Module', () => {
  describe('conductResearch', () => {
    it('should conduct research on a topic', async () => {
      const result = await conductResearch({ topic: 'Test Topic' });

      expect(result).toBeDefined();
      expect(result.topic).toBe('Test Topic');
      expect(result.id).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sources).toBeInstanceOf(Array);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should use default depth when not specified', async () => {
      const result = await conductResearch({ topic: 'Test' });
      expect(result).toBeDefined();
    });

    it('should generate unique IDs for different researches', async () => {
      const result1 = await conductResearch({ topic: 'Topic 1' });
      const result2 = await conductResearch({ topic: 'Topic 2' });

      expect(result1.id).not.toBe(result2.id);
    });
  });
});
