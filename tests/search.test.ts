import { describe, it, expect, vi } from 'vitest';
import { search } from '../src/search/index.js';

// Mock axios to avoid network calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: `
        <div class="result">
          <a class="result__title" href="https://example.com">Test Result</a>
          <div class="result__snippet">Test snippet</div>
        </div>
      `,
    }),
  },
}));

describe('Search Module', () => {
  it('should return results array', async () => {
    const results = await search({ query: 'test', maxResults: 5 });
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it('should respect maxResults option', async () => {
    const results = await search({ query: 'test', maxResults: 5 });
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
