/**
 * JavaScript-Rendered Content Detection
 *
 * Detects if a page is likely rendered via JavaScript (SPA)
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import * as cheerio from 'cheerio';
import { URL } from 'url';
/**
 * Known SPA frameworks
 */
export const SPA_FRAMEWORKS = [
    "react",
    "vue",
    "angular",
    "svelte",
    "nextjs",
    "nuxt",
    "gatsby",
    "remix",
    "ember",
    "backbone",
    "mithril",
    "alpine",
];
/**
 * Known JS-heavy sites
 */
export const JS_HEAVY_SITES = [
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "tiktok.com",
    "youtube.com",
    "reddit.com",
    "linkedin.com",
    "pinterest.com",
    "airbnb.com",
    "spotify.com",
    "notion.so",
    "slack.com",
    "figma.com",
    "canva.com",
];
/**
 * Sites that require headless browser
 */
const NEED_HEADLESS = [
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "tiktok.com",
    "reddit.com",
    "linkedin.com",
];
/**
 * Detector for JavaScript-rendered sites
 */
export class JSSiteDetector {
    spaPattern;
    constructor() {
        this.spaPattern = new RegExp(SPA_FRAMEWORKS.join('|'), 'i');
    }
    /**
     * Check if URL is likely a SPA
     */
    isLikelySpa(url, html = "") {
        // Check domain against known JS-heavy sites
        let domain;
        try {
            const parsed = new URL(url);
            domain = parsed.hostname.toLowerCase();
        }
        catch {
            return false;
        }
        // Check for known JS-heavy sites
        for (const site of JS_HEAVY_SITES) {
            if (domain.includes(site)) {
                return true;
            }
        }
        // If we have HTML, analyze it
        if (html) {
            return this.analyzeHtml(html);
        }
        return false;
    }
    /**
     * Analyze HTML for SPA indicators
     */
    analyzeHtml(html) {
        const $ = cheerio.load(html);
        // Check for root div with no content
        const root = $('div[id*="root"], div[id*="app"], div[id*="main"]').first();
        if (root.length) {
            const text = root.text().trim();
            if (text.length < 50) {
                return true;
            }
        }
        // Check for framework scripts
        let found = false;
        $('script[src]').each((_, el) => {
            const src = $(el).attr('src') || '';
            if (this.spaPattern.test(src)) {
                found = true;
                return false; // break
            }
        });
        if (found)
            return true;
        // Check for data attributes commonly used in SPAs
        if ($('[data-server-rendered="true"]').length) {
            return true;
        }
        // Check for noscript with minimal content
        const noscript = $('noscript').text().trim();
        if (noscript && noscript.length < 20) {
            return true;
        }
        return false;
    }
    /**
     * Check if site should be accessed via headless browser
     */
    shouldUseHeadless(url) {
        let domain;
        try {
            const parsed = new URL(url);
            domain = parsed.hostname.toLowerCase();
        }
        catch {
            return false;
        }
        for (const site of NEED_HEADLESS) {
            if (domain.includes(site)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Get recommendation for handling the site
     */
    getRecommendation(url, html = "") {
        const isSpa = this.isLikelySpa(url, html);
        const needHeadless = this.shouldUseHeadless(url);
        return {
            url,
            likelySpa: isSpa,
            recommendHeadless: needHeadless,
            fallbackMessage: this.getFallbackMessage(needHeadless),
        };
    }
    /**
     * Get recommendation message
     */
    getFallbackMessage(needHeadless) {
        if (needHeadless) {
            return ("This site likely requires JavaScript rendering. " +
                "Consider using a headless browser (Playwright/Selenium) " +
                "for content extraction.");
        }
        return ("Standard HTTP request should work. " +
            "If content is empty, try using a headless browser.");
    }
}
// Default detector instance
let defaultDetector = null;
/**
 * Check if URL is likely a JS-rendered site
 */
export function detectJsSite(url, html = "") {
    if (!defaultDetector) {
        defaultDetector = new JSSiteDetector();
    }
    return defaultDetector.isLikelySpa(url, html);
}
/**
 * Check if headless browser recommended
 */
export function shouldUseHeadless(url) {
    if (!defaultDetector) {
        defaultDetector = new JSSiteDetector();
    }
    return defaultDetector.shouldUseHeadless(url);
}
/**
 * Get handling recommendation
 */
export function getRecommendation(url, html = "") {
    if (!defaultDetector) {
        defaultDetector = new JSSiteDetector();
    }
    return defaultDetector.getRecommendation(url, html);
}
// Export all
export default {
    JSSiteDetector,
    SPA_FRAMEWORKS,
    JS_HEAVY_SITES,
    detectJsSite,
    shouldUseHeadless,
    getRecommendation,
};
//# sourceMappingURL=js_detection.js.map