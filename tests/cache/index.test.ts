import { describe, it, expect, beforeEach } from 'vitest';
import { SearchCache, getCache, clearCache } from '../../src/cache/index.js';
import type { SearchResult } from '../../src/types/index.js';

describe('SearchCache', () => {
  let cache: SearchCache;

  beforeEach(() => {
    cache = new SearchCache(60, 10); // 60s TTL, max 10 entries
  });

  describe('get/set', () => {
    it('should store and retrieve results', () => {
      const results: SearchResult[] = [
        { title: 'Test', url: 'https://example.com', snippet: 'Test', source: 'duckduckgo' },
      ];

      cache.set('test query', ['duckduckgo'], results);
      const cached = cache.get('test query', ['duckduckgo']);

      expect(cached).toEqual(results);
    });

    it('should return null for missing entries', () => {
      const cached = cache.get('missing', ['duckduckgo']);
      expect(cached).toBeNull();
    });

    it('should generate consistent keys for same query+engines', () => {
      const results: SearchResult[] = [
        { title: 'Test', url: 'https://example.com', snippet: 'Test', source: 'duckduckgo' },
      ];

      cache.set('test', ['duckduckgo', 'google'], results);
      const cached = cache.get('test', ['google', 'duckduckgo']); // Different order

      expect(cached).toEqual(results);
    });
  });

  describe('TTL', () => {
    it('should respect TTL and return null for expired entries', async () => {
      const shortCache = new SearchCache(0.1, 10); // 0.1s TTL
      const results: SearchResult[] = [
        { title: 'Test', url: 'https://example.com', snippet: 'Test', source: 'duckduckgo' },
      ];

      shortCache.set('test', ['duckduckgo'], results);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const cached = shortCache.get('test', ['duckduckgo']);
      expect(cached).toBeNull();
    });
  });

  describe('maxSize', () => {
    it('should evict oldest entries when at max size', () => {
      const smallCache = new SearchCache(3600, 2);

      smallCache.set('query1', ['duckduckgo'], [{ title: '1', url: '1', snippet: '1', source: 'duckduckgo' }]);
      smallCache.set('query2', ['duckduckgo'], [{ title: '2', url: '2', snippet: '2', source: 'duckduckgo' }]);
      smallCache.set('query3', ['duckduckgo'], [{ title: '3', url: '3', snippet: '3', source: 'duckduckgo' }]);

      // First entry should be evicted
      expect(smallCache.get('query1', ['duckduckgo'])).toBeNull();
      expect(smallCache.get('query2', ['duckduckgo'])).not.toBeNull();
      expect(smallCache.get('query3', ['duckduckgo'])).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('test1', ['duckduckgo'], [{ title: '1', url: '1', snippet: '1', source: 'duckduckgo' }]);
      cache.set('test2', ['duckduckgo'], [{ title: '2', url: '2', snippet: '2', source: 'duckduckgo' }]);

      cache.clear();

      expect(cache.get('test1', ['duckduckgo'])).toBeNull();
      expect(cache.get('test2', ['duckduckgo'])).toBeNull();
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      cache.set('test', ['duckduckgo'], [{ title: 'Test', url: '1', snippet: '1', source: 'duckduckgo' }]);

      const stats = cache.stats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(10);
      expect(stats.ttl).toBe(60);
    });
  });

  describe('cleanExpired', () => {
    it('should remove expired entries', async () => {
      const shortCache = new SearchCache(0.1, 10);

      shortCache.set('test', ['duckduckgo'], [{ title: 'Test', url: '1', snippet: '1', source: 'duckduckgo' }]);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const cleaned = shortCache.cleanExpired();
      expect(cleaned).toBe(1);
    });
  });
});

describe('Global cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should return singleton cache instance', () => {
    const cache1 = getCache();
    const cache2 = getCache();

    expect(cache1).toBe(cache2);
  });

  it('should clear global cache', () => {
    const cache = getCache();
    cache.set('test', ['duckduckgo'], [{ title: 'Test', url: '1', snippet: '1', source: 'duckduckgo' }]);

    clearCache();

    expect(cache.get('test', ['duckduckgo'])).toBeNull();
  });
});
