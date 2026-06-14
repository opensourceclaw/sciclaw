/**
 * Search module - Multi-engine search with caching
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getCache } from '../cache/index.js';
import type { SearchOptions, SearchResult, SearchEngine } from '../types/index.js';

export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const engines = options.engines ?? ['duckduckgo'];
  const maxResults = options.maxResults ?? 20;
  const useCache = options.useCache ?? true;

  // Check cache first
  if (useCache) {
    const cache = getCache();
    const cached = cache.get(options.query, engines);
    if (cached) {
      return cached.slice(0, maxResults);
    }
  }

  const results: SearchResult[] = [];

  // Search in parallel for better performance
  const searchPromises = engines.map((engine) =>
    searchWithEngine(engine, options.query, maxResults)
  );

  const allResults = await Promise.all(searchPromises);
  results.push(...allResults.flat());

  // Deduplicate and sort
  const finalResults = deduplicateResults(results).slice(0, maxResults);

  // Store in cache
  if (useCache) {
    const cache = getCache();
    cache.set(options.query, engines, finalResults);
  }

  return finalResults;
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
  // Google Custom Search API or HTML scraping
  // Using a simplified approach - in production, use official API
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (apiKey && cx) {
    // Use official Google Custom Search API
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${maxResults}`;
      const response = await axios.get(url, { timeout: 10000 });

      return (response.data.items ?? []).map((item: any, i: number) => ({
        title: item.title ?? '',
        url: item.link ?? '',
        snippet: item.snippet ?? '',
        source: 'google' as const,
        rank: i + 1,
      }));
    } catch (error) {
      console.warn('Google API search failed:', error);
    }
  }

  // Fallback: return empty (HTML scraping is blocked by Google)
  console.warn('Google search requires GOOGLE_API_KEY and GOOGLE_CX environment variables');
  return [];
}

async function searchBing(query: string, maxResults: number): Promise<SearchResult[]> {
  // Bing Search API
  const apiKey = process.env.BING_API_KEY;

  if (apiKey) {
    try {
      const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${maxResults}`;
      const response = await axios.get(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        timeout: 10000,
      });

      return (response.data.webPages?.value ?? []).map((item: any, i: number) => ({
        title: item.name ?? '',
        url: item.url ?? '',
        snippet: item.snippet ?? '',
        source: 'bing' as const,
        rank: i + 1,
      }));
    } catch (error) {
      console.warn('Bing API search failed:', error);
    }
  }

  // Fallback: return empty
  console.warn('Bing search requires BING_API_KEY environment variable');
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
