/**
 * JavaScript-Rendered Content Detection
 *
 * Detects if a page is likely rendered via JavaScript (SPA)
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Known SPA frameworks
 */
export declare const SPA_FRAMEWORKS: string[];
/**
 * Known JS-heavy sites
 */
export declare const JS_HEAVY_SITES: string[];
/**
 * Detector for JavaScript-rendered sites
 */
export declare class JSSiteDetector {
    private spaPattern;
    constructor();
    /**
     * Check if URL is likely a SPA
     */
    isLikelySpa(url: string, html?: string): boolean;
    /**
     * Analyze HTML for SPA indicators
     */
    private analyzeHtml;
    /**
     * Check if site should be accessed via headless browser
     */
    shouldUseHeadless(url: string): boolean;
    /**
     * Get recommendation for handling the site
     */
    getRecommendation(url: string, html?: string): {
        url: string;
        likelySpa: boolean;
        recommendHeadless: boolean;
        fallbackMessage: string;
    };
    /**
     * Get recommendation message
     */
    private getFallbackMessage;
}
/**
 * Check if URL is likely a JS-rendered site
 */
export declare function detectJsSite(url: string, html?: string): boolean;
/**
 * Check if headless browser recommended
 */
export declare function shouldUseHeadless(url: string): boolean;
/**
 * Get handling recommendation
 */
export declare function getRecommendation(url: string, html?: string): {
    url: string;
    likelySpa: boolean;
    recommendHeadless: boolean;
    fallbackMessage: string;
};
declare const _default: {
    JSSiteDetector: typeof JSSiteDetector;
    SPA_FRAMEWORKS: string[];
    JS_HEAVY_SITES: string[];
    detectJsSite: typeof detectJsSite;
    shouldUseHeadless: typeof shouldUseHeadless;
    getRecommendation: typeof getRecommendation;
};
export default _default;
//# sourceMappingURL=js_detection.d.ts.map