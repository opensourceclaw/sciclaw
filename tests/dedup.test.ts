import { describe, it, expect } from 'vitest';
import { deduplicateByUrl, deduplicateByTitle } from '../src/dedup/index.js';
import type { SearchResult } from '../src/types/index.js';

describe('Dedup Module', () => {
  const mockResults: SearchResult[] = [
    { title: 'Test 1', url: 'https://example.com/page1', snippet: '...', source: 'duckduckgo' },
    { title: 'Test 2', url: 'https://example.com/page1', snippet: '...', source: 'duckduckgo' },
    { title: 'Test 3', url: 'https://example.com/page2', snippet: '...', source: 'duckduckgo' },
  ];

  it('should deduplicate by URL', () => {
    const result = deduplicateByUrl(mockResults);
    expect(result.length).toBe(2);
  });

  it('should deduplicate by title', () => {
    const result = deduplicateByTitle(mockResults);
    expect(result.length).toBe(3);
  });
});
