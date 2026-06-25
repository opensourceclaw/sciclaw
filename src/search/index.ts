/**
 * Search module - Multi-engine search with caching
 *
 * v3.0.3: Added SearchCoordinator, BatchQueue, ConnectionPool, SearchStream, PerformanceMetrics
 */
import axios from "axios";
import * as cheerio from "cheerio";
import { getCache } from "../cache/index.js";
import { SearchOptimizer } from "./optimizer.js";
import { getCoordinator, SearchCoordinator } from "./coordinator.js";
import { SearchStream } from "./stream.js";
import type { SearchOptions, SearchResult, SearchEngine } from "../types/index.js";
import type { SearchSourceConfig, MetricsSnapshot, SearchSourceFn } from "./types.js";

// New module exports
export { SearchOptimizer, createSearchOptimizer } from "./optimizer.js";
export { SearchCoordinator, getCoordinator } from "./coordinator.js";
export { BatchQueue } from "./batch.js";
export { ConnectionPool } from "./pool.js";
export { SearchStream } from "./stream.js";
export { PerformanceMetrics } from "./metrics.js";
export type {
  SearchSourceConfig, SearchTask, SearchSourceResult,
  AggregatedResults, StreamEvent, BatchConfig, PoolConfig, PoolStats,
  LatencyRecord, MetricsSnapshot, CoordinatorConfig, SearchFn,
} from "./types.js";

// ── Builtin search source definitions ──────────────────────────────────

const BUILTIN_SOURCES: SearchSourceConfig[] = [
  { id: "duckduckgo", name: "DuckDuckGo", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 },
  { id: "google", name: "Google", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.2 },
  { id: "bing", name: "Bing", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 },
];

// ── Search engine implementations (adapter for Coordinator) ────────────

async function duckduckgoSearch(query: string, maxResults: number, _signal: AbortSignal): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DeepClaw/3.0)" },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];
    $(".result").each((_i, el) => {
      if (results.length >= maxResults) return;
      const titleEl = $(el).find(".result__title a");
      const snippetEl = $(el).find(".result__snippet");
      const title = titleEl.text().trim();
      const href = titleEl.attr("href") ?? "";
      const snippet = snippetEl.text().trim();
      if (title && href) {
        results.push({ title, url: href, snippet, source: "duckduckgo", rank: results.length + 1 });
      }
    });
    return results;
  } catch {
    return [];
  }
}

async function googleSearch(query: string, maxResults: number, _signal: AbortSignal): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (apiKey && cx) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${maxResults}`;
      const response = await axios.get(url, { timeout: 10000 });
      return (response.data.items ?? []).map((item: any, i: number) => ({
        title: item.title ?? "", url: item.link ?? "", snippet: item.snippet ?? "",
        source: "google" as const, rank: i + 1,
      }));
    } catch { /* fallthrough */ }
  }
  return [];
}

async function bingSearch(query: string, maxResults: number, _signal: AbortSignal): Promise<SearchResult[]> {
  const apiKey = process.env.BING_API_KEY;
  if (apiKey) {
    try {
      const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${maxResults}`;
      const response = await axios.get(url, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
        timeout: 10000,
      });
      return (response.data.webPages?.value ?? []).map((item: any, i: number) => ({
        title: item.name ?? "", url: item.url ?? "", snippet: item.snippet ?? "",
        source: "bing" as const, rank: i + 1,
      }));
    } catch { /* fallthrough */ }
  }
  return [];
}

const BUILTIN_SOURCE_FNS: Record<string, SearchSourceFn> = {
  duckduckgo: duckduckgoSearch,
  google: googleSearch,
  bing: bingSearch,
};

function ensureCoordinator(): SearchCoordinator {
  return getCoordinator(BUILTIN_SOURCES, BUILTIN_SOURCE_FNS);
}

// ── Public API ────────────────────────────────────────────────────────

export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const engines = options.engines ?? ["duckduckgo"];
  const maxResults = options.maxResults ?? 20;
  const useCache = options.useCache ?? true;

  if (useCache) {
    const cache = getCache();
    const cached = await cache.get(options.query, engines);
    if (cached) return cached.slice(0, maxResults);
  }

  // Use Coordinator for concurrent search (v3.0.3)
  const coordinator = ensureCoordinator();
  const sources = coordinator.getSources().filter((s) => engines.includes(s.id as SearchEngine));
  const result = await coordinator.search({ query: options.query, sources, options: { maxResults } });

  const finalResults = result.results.slice(0, maxResults);

  if (useCache) {
    const cache = getCache();
    cache.set(options.query, engines, finalResults);
  }

  return finalResults;
}

/** Stream search results as they arrive. (v3.0.3) */
export function searchStream(options: SearchOptions): SearchStream {
  const engines = options.engines ?? ["duckduckgo"];
  const coordinator = ensureCoordinator();
  const sources = coordinator.getSources().filter((s) => engines.includes(s.id as SearchEngine));
  return coordinator.searchStream({
    query: options.query,
    sources,
    options: { maxResults: options.maxResults ?? 20, streaming: true },
  });
}

/** Get search performance metrics. (v3.0.3) */
export function getSearchMetrics(): MetricsSnapshot {
  return ensureCoordinator().getMetrics();
}

/** Register a custom search source at runtime. (v3.0.3) */
export function registerSearchSource(source: SearchSourceConfig, fn: SearchSourceFn): void {
  ensureCoordinator().registerSource(source, fn);
}

export { search as default };
