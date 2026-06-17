/**
 * Search module - Multi-engine search with caching
 */
import type { SearchOptions, SearchResult } from '../types/index.js';
export { SearchOptimizer, createSearchOptimizer } from './optimizer.js';
export declare function search(options: SearchOptions): Promise<SearchResult[]>;
export { search as default };
//# sourceMappingURL=index.d.ts.map