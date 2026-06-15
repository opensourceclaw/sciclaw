/**
 * Query Expander - Expands queries with synonyms and related terms
 */

import type { ExpansionResult } from './types.js';

const DEFAULT_SYNONYMS: Record<string, string[]> = {
  ai: ['artificial intelligence', 'machine learning'],
  performance: ['efficiency', 'throughput', 'latency'],
  security: ['safety', 'protection', 'vulnerability'],
  database: ['storage', 'persistence', 'data store'],
  network: ['connectivity', 'communication', 'protocol'],
  algorithm: ['method', 'approach', 'technique'],
  architecture: ['design', 'structure', 'framework'],
  optimization: ['improvement', 'enhancement', 'tuning'],
};

export class QueryExpander {
  private synonymMap: Map<string, string[]>;

  constructor() {
    this.synonymMap = new Map(Object.entries(DEFAULT_SYNONYMS));
  }

  expand(query: string, maxExpansions = 5): ExpansionResult {
    if (!query || !query.trim()) {
      return { original: query, expansions: [], scores: [] };
    }

    const tokens = query.toLowerCase().split(/\s+/);
    const expansions = new Map<string, number>();

    for (const token of tokens) {
      const synonyms = this.synonymMap.get(token);
      if (!synonyms) continue;

      for (const syn of synonyms) {
        const expanded = query.replace(new RegExp(token, 'i'), syn);
        if (expanded !== query && !expansions.has(expanded)) {
          // Score: more specific expansions get higher scores
          const score = Math.min(0.5 + syn.split(/\s+/).length * 0.2, 0.95);
          expansions.set(expanded, score);
        }
      }
    }

    const sorted = Array.from(expansions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxExpansions);

    return {
      original: query,
      expansions: sorted.map(([e]) => e),
      scores: sorted.map(([, s]) => s),
    };
  }

  expandBatch(queries: string[], maxExpansions?: number): ExpansionResult[] {
    return queries.map((q) => this.expand(q, maxExpansions));
  }

  addSynonym(term: string, synonyms: string[]): void {
    this.synonymMap.set(term.toLowerCase(), synonyms);
  }

  getDefaultSynonyms(): Map<string, string[]> {
    return new Map(Object.entries(DEFAULT_SYNONYMS));
  }
}
