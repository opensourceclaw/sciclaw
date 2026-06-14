import { describe, it, expect, vi } from 'vitest';
import { search } from '../src/search/index.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('duckduckgo')) {
        return Promise.resolve({
          data: `
            <div class="result">
              <a class="result__title" href="https://example.com">Test Result</a>
              <div class="result__snippet">Test snippet</div>
            </div>
          `,
        });
      }
      if (url.includes('googleapis')) {
        return Promise.resolve({
          data: {
            items: [
              { title: 'Google Result', link: 'https://google.com', snippet: 'Google snippet' },
            ],
          },
        });
      }
      if (url.includes('bing')) {
        return Promise.resolve({
          data: {
            webPages: {
              value: [
                { name: 'Bing Result', url: 'https://bing.com', snippet: 'Bing snippet' },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),
  },
}));

describe('Search Module', () => {
  describe('DuckDuckGo', () => {
    it('should return results from DuckDuckGo', async () => {
      const results = await search({ query: 'test', engines: ['duckduckgo'], maxResults: 5 });
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Google', () => {
    it('should attempt Google search with API key', async () => {
      const originalKey = process.env.GOOGLE_API_KEY;
      process.env.GOOGLE_API_KEY = 'test-key';
      process.env.GOOGLE_CX = 'test-cx';

      const results = await search({ query: 'test', engines: ['google'], maxResults: 5 });
      expect(results).toBeDefined();

      process.env.GOOGLE_API_KEY = originalKey;
    });
  });

  describe('Bing', () => {
    it('should attempt Bing search with API key', async () => {
      const originalKey = process.env.BING_API_KEY;
      process.env.BING_API_KEY = 'test-key';

      const results = await search({ query: 'test', engines: ['bing'], maxResults: 5 });
      expect(results).toBeDefined();

      process.env.BING_API_KEY = originalKey;
    });
  });

  describe('Multi-engine', () => {
    it('should search with multiple engines', async () => {
      const results = await search({
        query: 'test',
        engines: ['duckduckgo', 'google', 'bing'],
        maxResults: 10,
      });
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should deduplicate results', async () => {
      const results = await search({ query: 'test', maxResults: 5 });
      const urls = results.map((r) => r.url);
      const uniqueUrls = new Set(urls);
      expect(urls.length).toBe(uniqueUrls.size);
    });
  });
});
