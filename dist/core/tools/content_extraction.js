/**
 * Content Extraction Tool - Enhanced with text density analysis, readability,
 * fallback selectors, and performance optimization.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import * as cheerio from 'cheerio';
import axios from 'axios';
import Turndown from 'turndown';
import { URL } from 'url';
// Noise patterns to remove
const NOISE_TAGS = [
    "script", "style", "nav", "header", "footer", "aside",
    "form", "iframe", "noscript", "svg", "canvas", "video", "audio",
    "button", "input", "select", "textarea", "menu", "menuitem"
];
const NOISE_CLASSES = [
    "advertisement", "ad", "ads", "sidebar", "comment", "comments",
    "social", "share", "sharing", "related", "recommended", "newsletter",
    "subscribe", "popup", "modal", "banner", "promo", "promotion",
    "cookie", "consent", "tracking", "analytics", "metric",
    "footer", "header", "nav", "navigation", "menu",
    "widget", "sidebar", "breadcrumb", "pagination", "loading",
    "spinner", "skeleton", "placeholder", "hidden", "visually-hidden"
];
const NOISE_IDS = [
    "advertisement", "comments", "sidebar", "footer", "header",
    "nav", "navigation", "social", "share", "related", "cookies",
    "tracking", "analytics", "menu", "widget", "loading"
];
/**
 * Web content extraction tool with enhanced readability
 */
export class ContentExtractor {
    timeout;
    turndown;
    // Default headers
    static DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    };
    // Extended content selectors (priority order)
    static CONTENT_SELECTORS = [
        // Semantic HTML5
        "article",
        "main",
        "[role='main']",
        "[role='article']",
        "[role='content']",
        "[itemprop='articleBody']",
        // Blog platforms
        ".post-content",
        ".article-content",
        ".entry-content",
        ".content-body",
        ".article-body",
        ".story-body",
        ".post-body",
        ".node-content",
        ".blog-post",
        ".blog-content",
        ".single-post",
        // News sites
        ".news-content",
        ".news-body",
        ".article__body",
        ".story__content",
        ".headline-body",
        // CMS platforms
        ".wp-block-columns",
        ".elementor-widget",
        ".fl-builder-content",
        // Common IDs
        "#content",
        "#main-content",
        "#article-content",
        "#post-content",
        "#page-content",
        ".content",
        "#content-area",
        "#main",
        "#primary",
    ];
    // Fallback selectors
    static FALLBACK_SELECTORS = [
        ".container main",
        ".wrapper main",
        "div[class*='container']",
        "div[class*='main']",
        "div[class*='content']",
        "section[class*='content']",
    ];
    // Minimum text length
    static MIN_TEXT_LENGTH = 100;
    // Minimum text density ratio
    static MIN_TEXT_DENSITY = 0.25;
    constructor(timeout = 30) {
        this.timeout = timeout * 1000; // Convert to milliseconds
        this.turndown = new Turndown({
            linkStyle: 'referenced',
            headingStyle: 'atx',
        });
    }
    /**
     * Extract content from a URL
     */
    async extract(url) {
        try {
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: ContentExtractor.DEFAULT_HEADERS,
                responseType: 'text',
            });
            const $ = cheerio.load(response.data);
            // Extract metadata first
            const title = this.extractTitle($);
            const author = this.extractAuthor($);
            const publishedDate = this.extractDate($);
            const excerpt = this.extractExcerpt($);
            const siteName = this.extractSiteName($, url);
            // Clean noise elements
            this.cleanNoise($);
            // Extract main content using multiple strategies
            const html = this.extractMainContent($);
            const text = html ? this.turndown.turndown(html) : "";
            return {
                url,
                title,
                text: text.trim(),
                html,
                author,
                publishedDate,
                excerpt,
                siteName,
            };
        }
        catch (error) {
            console.error(`Failed to extract content from ${url}: ${error.message}`);
            return null;
        }
    }
    /**
     * Remove noise elements from the page
     */
    cleanNoise($) {
        // Remove script and style elements
        for (const tag of NOISE_TAGS) {
            $(tag).remove();
        }
        // Remove elements with noise classes
        for (const noiseClass of NOISE_CLASSES) {
            $(`[class*="${noiseClass}"]`).each((_, el) => {
                const $el = $(el);
                const text = $el.text().trim();
                if (text.length < 50) {
                    $el.remove();
                }
            });
        }
        // Remove elements with noise IDs
        for (const noiseId of NOISE_IDS) {
            $(`[id*="${noiseId}"]`).each((_, el) => {
                const $el = $(el);
                if (!$el.children().length) {
                    $el.remove();
                }
            });
        }
        // Remove hidden elements
        $('[style*="display:none"], [style*="visibility:hidden"]').remove();
        // Remove empty elements
        $('*').each((_, el) => {
            if (el.type !== 'tag')
                return;
            const $el = $(el);
            const tagName = el.tagName.toLowerCase();
            if (['br', 'hr', 'img', 'input'].includes(tagName))
                return;
            const text = $el.text().trim();
            if (!text && !$el.find('img').length && !$el.find('input').length) {
                $el.remove();
            }
        });
    }
    /**
     * Extract page title
     */
    extractTitle($) {
        // Try og:title first
        const ogTitle = $('meta[property="og:title"]').attr('content');
        if (ogTitle)
            return ogTitle.trim();
        // Try twitter:title
        const twitterTitle = $('meta[name="twitter:title"]').attr('content');
        if (twitterTitle)
            return twitterTitle.trim();
        // Try regular title tag
        const titleTag = $('title').text();
        if (titleTag) {
            // Clean up common title patterns
            return titleTag.replace(/\s*[-|–]\s*.+$/, '').trim();
        }
        // Try h1
        const h1 = $('h1').first().text();
        if (h1)
            return h1.trim();
        return "";
    }
    /**
     * Extract main content using multiple strategies
     */
    extractMainContent($) {
        // Strategy 1: Try CSS selectors
        const htmlBySelector = this.extractBySelectors($);
        if (htmlBySelector && htmlBySelector.length > ContentExtractor.MIN_TEXT_LENGTH * 10) {
            return htmlBySelector;
        }
        // Strategy 2: Try fallback selectors
        const htmlByFallback = this.extractByFallbackSelectors($);
        if (htmlByFallback && htmlByFallback.length > ContentExtractor.MIN_TEXT_LENGTH * 10) {
            return htmlByFallback;
        }
        // Strategy 3: Text density analysis
        const htmlByDensity = this.extractByTextDensity($);
        if (htmlByDensity && htmlByDensity.length > ContentExtractor.MIN_TEXT_LENGTH * 10) {
            return htmlByDensity;
        }
        // Strategy 4: Readability-style extraction
        const htmlByReadability = this.extractByReadability($);
        if (htmlByReadability) {
            return htmlByReadability;
        }
        // Fallback to body
        const body = $('body').html();
        if (body)
            return body;
        return $.html();
    }
    /**
     * Extract content using CSS selectors
     */
    extractBySelectors($) {
        for (const selector of ContentExtractor.CONTENT_SELECTORS) {
            try {
                const $content = $(selector).first();
                if ($content.length) {
                    const text = $content.text().trim();
                    if (text.length >= ContentExtractor.MIN_TEXT_LENGTH) {
                        return $content.html() || '';
                    }
                }
            }
            catch {
                continue;
            }
        }
        return "";
    }
    /**
     * Extract content using fallback selectors
     */
    extractByFallbackSelectors($) {
        for (const selector of ContentExtractor.FALLBACK_SELECTORS) {
            try {
                const $elements = $(selector);
                const results = [];
                $elements.each((_, el) => {
                    const $el = $(el);
                    const text = $el.text().trim();
                    if (text.length >= ContentExtractor.MIN_TEXT_LENGTH * 2) {
                        results.push($el.html() || '');
                        return false; // break the loop
                    }
                });
                if (results.length > 0)
                    return results[0];
            }
            catch {
                continue;
            }
        }
        return "";
    }
    /**
     * Extract content using text density analysis
     */
    extractByTextDensity($) {
        const candidates = [];
        $('div, section, article').each((_, el) => {
            const $el = $(el);
            const classAttr = ($el.attr('class') || '').toLowerCase();
            const idAttr = ($el.attr('id') || '').toLowerCase();
            // Skip if has noise class/id
            if (NOISE_CLASSES.some(nc => classAttr.includes(nc)) ||
                NOISE_IDS.some(ni => idAttr.includes(ni))) {
                return;
            }
            const text = $el.text().trim();
            const html = $el.html() || '';
            const htmlLen = html.length;
            if (htmlLen < 200)
                return;
            const textLen = text.length;
            const density = textLen / htmlLen;
            if (density >= ContentExtractor.MIN_TEXT_DENSITY && textLen >= ContentExtractor.MIN_TEXT_LENGTH) {
                candidates.push({
                    html,
                    length: textLen,
                    density,
                });
            }
        });
        if (candidates.length === 0)
            return "";
        // Sort by score (length * density)
        candidates.sort((a, b) => (b.length * b.density) - (a.length * a.density));
        return candidates[0]?.html ?? "";
    }
    /**
     * Extract content using readability-style algorithm
     */
    extractByReadability($) {
        const paragraphScores = new Map();
        $('p').each((_, p) => {
            const $p = $(p);
            const parent = $p.parent()[0];
            if (!parent)
                return;
            const text = $p.text().trim();
            if (text.length < 25)
                return;
            const existing = paragraphScores.get(parent);
            if (existing) {
                existing.score += text.length;
                existing.textLength += text.length;
            }
            else {
                paragraphScores.set(parent, { score: text.length, textLength: text.length });
            }
        });
        if (paragraphScores.size === 0)
            return "";
        // Get best candidate by converting to array and finding max
        const entries = Array.from(paragraphScores.entries());
        if (entries.length === 0)
            return "";
        let bestEntry = entries[0];
        for (const entry of entries) {
            if (!bestEntry || entry[1].score > bestEntry[1].score) {
                bestEntry = entry;
            }
        }
        if (bestEntry && bestEntry[1].textLength >= ContentExtractor.MIN_TEXT_LENGTH) {
            return $(bestEntry[0]).html() || '';
        }
        return "";
    }
    /**
     * Extract author from page
     */
    extractAuthor($) {
        // Try meta tags
        const authorMeta = $('meta[name="author"]').attr('content');
        if (authorMeta)
            return authorMeta.trim();
        // Try article:author
        const authorOg = $('meta[property="article:author"]').attr('content');
        if (authorOg)
            return authorOg.trim();
        // Try schema.org
        const authorSchema = $('[itemprop="author"]').text();
        if (authorSchema)
            return authorSchema.trim();
        // Try common class names
        const authorClass = $('[class*="author"]').first().text();
        if (authorClass)
            return authorClass.trim();
        return undefined;
    }
    /**
     * Extract publication date from page
     */
    extractDate($) {
        // Try article:published_time
        const dateMeta = $('meta[property="article:published_time"]').attr('content');
        if (dateMeta)
            return dateMeta.trim();
        // Try article:modified_time
        const modifiedMeta = $('meta[property="article:modified_time"]').attr('content');
        if (modifiedMeta)
            return modifiedMeta.trim();
        // Try time tag
        const timeTag = $('time[datetime]').attr('datetime');
        if (timeTag)
            return timeTag;
        const timeText = $('time').text();
        if (timeText)
            return timeText.trim();
        // Try datePublished schema
        const dateSchema = $('[itemprop="datePublished"]').attr('content') ||
            $('[itemprop="datePublished"]').text();
        if (dateSchema)
            return dateSchema.trim();
        return undefined;
    }
    /**
     * Extract excerpt/description from page
     */
    extractExcerpt($) {
        // Try og:description
        const ogDesc = $('meta[property="og:description"]').attr('content');
        if (ogDesc)
            return ogDesc.trim();
        // Try twitter:description
        const twitterDesc = $('meta[name="twitter:description"]').attr('content');
        if (twitterDesc)
            return twitterDesc.trim();
        // Try meta description
        const metaDesc = $('meta[name="description"]').attr('content');
        if (metaDesc)
            return metaDesc.trim();
        return undefined;
    }
    /**
     * Extract site name
     */
    extractSiteName($, url) {
        // Try og:site_name
        const ogSite = $('meta[property="og:site_name"]').attr('content');
        if (ogSite)
            return ogSite.trim();
        // Fallback to domain
        try {
            const parsed = new URL(url);
            const domain = parsed.hostname.replace(/^www\./, '');
            const parts = domain.split('.');
            const siteName = parts[0] || '';
            if (siteName) {
                return siteName.charAt(0).toUpperCase() + siteName.slice(1);
            }
            return undefined;
        }
        catch {
            return undefined;
        }
    }
}
/**
 * Extract content from a URL
 */
export async function extractContent(url, timeout = 30) {
    const extractor = new ContentExtractor(timeout);
    return extractor.extract(url);
}
/**
 * Clean HTML by removing noise elements
 */
export function cleanHtml(html) {
    // Remove HTML comments first (before loading into cheerio)
    let cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
    const $ = cheerio.load(cleaned);
    // Remove noise tags
    for (const tag of NOISE_TAGS) {
        $(tag).remove();
    }
    return $.html().trim();
}
/**
 * Extract text from HTML
 */
export function extractText(html) {
    const $ = cheerio.load(html);
    return $('body').text().replace(/\s+/g, ' ').trim();
}
// Export all
export default {
    ContentExtractor,
    extractContent,
    cleanHtml,
    extractText,
    NOISE_TAGS,
    NOISE_CLASSES,
    NOISE_IDS,
};
//# sourceMappingURL=content_extraction.js.map