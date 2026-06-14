/**
 * Search result cache - LRU with TTL
 */

import type { SearchResult } from '../types/index.js';

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

export class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor(ttl: number = 3600, maxSize: number = 100) {
    this.ttl = ttl * 1000; // Convert to milliseconds
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from query and engines
   */
  private getKey(query: string, engines: string[]): string {
    return `${engines.sort().join(',')}:${query}`;
  }

  /**
   * Get cached results if available and not expired
   */
  get(query: string, engines: string[]): SearchResult[] | null {
    const key = this.getKey(query, engines);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  /**
   * Store results in cache
   */
  set(query: string, engines: string[], results: SearchResult[]): void {
    const key = this.getKey(query, engines);

    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl / 1000,
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Global cache instance
let globalCache: SearchCache | null = null;

export function getCache(ttl?: number, maxSize?: number): SearchCache {
  if (!globalCache) {
    globalCache = new SearchCache(ttl, maxSize);
  }
  return globalCache;
}

export function clearCache(): void {
  globalCache?.clear();
}
