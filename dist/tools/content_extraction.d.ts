/**
 * Content Extraction Tool - Enhanced with text density analysis, readability,
 * fallback selectors, and performance optimization.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Extracted web content
 */
export interface ExtractedContent {
    url: string;
    title: string;
    text: string;
    html: string;
    author?: string;
    publishedDate?: string;
    excerpt?: string;
    siteName?: string;
}
/**
 * Web content extraction tool with enhanced readability
 */
export declare class ContentExtractor {
    private timeout;
    private turndown;
    private static DEFAULT_HEADERS;
    private static CONTENT_SELECTORS;
    private static FALLBACK_SELECTORS;
    private static MIN_TEXT_LENGTH;
    private static MIN_TEXT_DENSITY;
    constructor(timeout?: number);
    /**
     * Extract content from a URL
     */
    extract(url: string): Promise<ExtractedContent | null>;
    /**
     * Remove noise elements from the page
     */
    private cleanNoise;
    /**
     * Extract page title
     */
    private extractTitle;
    /**
     * Extract main content using multiple strategies
     */
    private extractMainContent;
    /**
     * Extract content using CSS selectors
     */
    private extractBySelectors;
    /**
     * Extract content using fallback selectors
     */
    private extractByFallbackSelectors;
    /**
     * Extract content using text density analysis
     */
    private extractByTextDensity;
    /**
     * Extract content using readability-style algorithm
     */
    private extractByReadability;
    /**
     * Extract author from page
     */
    private extractAuthor;
    /**
     * Extract publication date from page
     */
    private extractDate;
    /**
     * Extract excerpt/description from page
     */
    private extractExcerpt;
    /**
     * Extract site name
     */
    private extractSiteName;
}
/**
 * Extract content from a URL
 */
export declare function extractContent(url: string, timeout?: number): Promise<ExtractedContent | null>;
/**
 * Clean HTML by removing noise elements
 */
export declare function cleanHtml(html: string): string;
/**
 * Extract text from HTML
 */
export declare function extractText(html: string): string;
declare const _default: {
    ContentExtractor: typeof ContentExtractor;
    extractContent: typeof extractContent;
    cleanHtml: typeof cleanHtml;
    extractText: typeof extractText;
    NOISE_TAGS: string[];
    NOISE_CLASSES: string[];
    NOISE_IDS: string[];
};
export default _default;
//# sourceMappingURL=content_extraction.d.ts.map