import { describe, it, expect, vi } from 'vitest';
import { registerProvider, getProvider, synthesize } from '../../src/llm/index.js';
import type { LLMProvider } from '../../src/types/index.js';

describe('LLM Module', () => {
  describe('Provider Management', () => {
    it('should register and retrieve a provider', () => {
      const mockProvider: LLMProvider = {
        name: 'test-provider',
        complete: vi.fn().mockResolvedValue('test response'),
      };

      registerProvider(mockProvider);
      const retrieved = getProvider('test-provider');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-provider');
    });

    it('should return undefined for unknown provider', () => {
      const result = getProvider('unknown-provider');
      expect(result).toBeUndefined();
    });
  });

  describe('synthesize', () => {
    it('should synthesize content from multiple sources', async () => {
      const contents = [
        { title: 'Source 1', url: 'https://example.com/1', content: 'Content 1' },
        { title: 'Source 2', url: 'https://example.com/2', content: 'Content 2' },
      ];

      const result = await synthesize('Test Topic', contents);

      expect(result).toContain('Test Topic');
      expect(result).toContain('Source 1');
      expect(result).toContain('Source 2');
    });

    it('should handle empty contents array', async () => {
      const result = await synthesize('Empty Topic', []);
      expect(result).toContain('Empty Topic');
    });
  });
});
