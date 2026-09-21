import type { SearchResult, SearchEngine } from "../types/index.js";
import type { WarmerConfig } from "./types.js";
import type { CacheAnalytics } from "./analytics.js";
export type SearchFn = (query: string, engines: SearchEngine[]) => Promise<SearchResult[]>;
export declare class CacheWarmer {
    private config;
    private analytics;
    private searchFn;
    private extraQueries;
    constructor(config: WarmerConfig | undefined, analytics: CacheAnalytics, searchFn: SearchFn);
    warm(): Promise<{
        warmed: number;
        failed: number;
        durationMs: number;
    }>;
    addQuery(query: string): void;
    private collectQueries;
    private warmOne;
    private extractQueryFromKey;
}
//# sourceMappingURL=warmer.d.ts.map