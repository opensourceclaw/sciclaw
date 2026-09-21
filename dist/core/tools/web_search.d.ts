/**
 * Web Search Tool
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Web search result
 */
export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
    publishedDate?: string;
}
/**
 * Web search tool interface
 */
export declare class WebSearchTool {
    private apiKey?;
    constructor(apiKey?: string);
    /**
     * Search the web
     */
    search(query: string, numResults?: number, language?: string): Promise<WebSearchResult[]>;
    /**
     * Mock search implementation
     */
    private mockSearch;
}
/**
 * Build search URL for a search engine
 */
export declare function buildSearchUrl(engine: string, query: string): string;
/**
 * Search the web for information
 */
export declare function searchWeb(query: string, numResults?: number, apiKey?: string): Promise<WebSearchResult[]>;
declare const _default: {
    WebSearchResult: WebSearchResult;
    WebSearchTool: typeof WebSearchTool;
    searchWeb: typeof searchWeb;
    buildSearchUrl: typeof buildSearchUrl;
};
export default _default;
//# sourceMappingURL=web_search.d.ts.map