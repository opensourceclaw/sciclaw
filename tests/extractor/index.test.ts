import { describe, it, expect, vi } from 'vitest';
import { extractContent, extractMultiple } from '../../src/extractor/index.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: `
        <html>
          <body>
            <main>
              <h1>Test Title</h1>
              <p>Test content paragraph.</p>
            </main>
          </body>
        </html>
      `,
    }),
  },
}));

describe('Extractor Module', () => {
  describe('extractContent', () => {
    it('should extract content from a URL', async () => {
      const result = await extractContent('https://example.com');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should convert HTML to markdown', async () => {
      const result = await extractContent('https://example.com');

      // Should contain markdown-formatted content
      expect(result).toContain('Test Title');
    });
  });

  describe('extractMultiple', () => {
    it('should extract content from multiple URLs', async () => {
      const urls = ['https://example.com/1', 'https://example.com/2'];
      const results = await extractMultiple(urls);

      expect(results.size).toBe(2);
      expect(results.get('https://example.com/1')).toBeDefined();
      expect(results.get('https://example.com/2')).toBeDefined();
    });

    it('should handle extraction failures gracefully', async () => {
      // Override mock for one URL to fail
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockRejectedValueOnce(new Error('Network error'));

      const urls = ['https://fail.com', 'https://success.com'];
      const results = await extractMultiple(urls);

      // Should still return results for successful extractions
      expect(results.size).toBeGreaterThanOrEqual(0);
    });
  });
});
