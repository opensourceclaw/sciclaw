/**
 * Search module - Multi-engine search
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SearchOptions, SearchResult, SearchEngine } from '../types/index.js';

export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const engines = options.engines ?? ['duckduckgo'];
  const maxResults = options.maxResults ?? 20;

  const results: SearchResult[] = [];

  for (const engine of engines) {
    const engineResults = await searchWithEngine(engine, options.query, maxResults);
    results.push(...engineResults);
  }

  // Deduplicate and sort
  return deduplicateResults(results).slice(0, maxResults);
}

async function searchWithEngine(
  engine: SearchEngine,
  query: string,
  maxResults: number
): Promise<SearchResult[]> {
  switch (engine) {
    case 'duckduckgo':
      return searchDuckDuckGo(query, maxResults);
    case 'google':
      return searchGoogle(query, maxResults);
    case 'bing':
      return searchBing(query, maxResults);
    default:
      throw new Error(`Unknown search engine: ${engine}`);
  }
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
  // Use DuckDuckGo HTML version for scraping
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeepClaw/2.0)',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((i, el) => {
      if (results.length >= maxResults) return;

      const titleEl = $(el).find('.result__title a');
      const snippetEl = $(el).find('.result__snippet');

      const title = titleEl.text().trim();
      const href = titleEl.attr('href') ?? '';
      const snippet = snippetEl.text().trim();

      if (title && href) {
        results.push({
          title,
          url: href,
          snippet,
          source: 'duckduckgo',
          rank: i + 1,
        });
      }
    });

    return results;
  } catch (error) {
    console.warn('DuckDuckGo search failed:', error);
    return [];
  }
}

async function searchGoogle(query: string, maxResults: number): Promise<SearchResult[]> {
  // Placeholder - Google requires API key
  console.warn('Google search not implemented, use DuckDuckGo');
  return [];
}

async function searchBing(query: string, maxResults: number): Promise<SearchResult[]> {
  // Placeholder - Bing requires API key
  console.warn('Bing search not implemented, use DuckDuckGo');
  return [];
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export { search as default };
