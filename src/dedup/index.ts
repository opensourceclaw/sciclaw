/**
 * Deduplication module
 */

import type { SearchResult } from '../types/index.js';

export function deduplicateByUrl(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const result of results) {
    const normalized = normalizeUrl(result.url);
    if (!seen.has(normalized)) {
      seen.set(normalized, result);
    }
  }

  return Array.from(seen.values());
}

export function deduplicateByTitle(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const result of results) {
    const normalized = normalizeTitle(result.title);
    if (!seen.has(normalized)) {
      seen.set(normalized, result);
    }
  }

  return Array.from(seen.values());
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash and common tracking params
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    let normalized = parsed.origin + parsed.pathname;
    if (parsed.search) normalized += parsed.search;
    return normalized.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, ' ');
}
