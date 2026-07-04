/**
 * Site-Specific Content Parsers
 *
 * Features:
 * - Extensible parser registry with dynamic registration
 * - Support for 20+ popular sites
 * - Domain pattern matching with subdomain support
 * - Custom extraction rules per site
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import * as cheerio from 'cheerio';
/**
 * Configuration for a site parser
 */
export interface SiteParserConfig {
    domains: string[];
    selectors: Record<string, string>;
    requiresJs: boolean;
    priority: number;
}
/**
 * Parsed content result
 */
export interface ParsedContent {
    title: string;
    content: string;
    author?: string;
    date?: string;
}
/**
 * Base class for site-specific parsers
 */
export declare class SiteParser {
    static DOMAINS: string[];
    static SELECTORS: Record<string, string>;
    static PRIORITY: number;
    static REQUIRES_JS: boolean;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
    /**
     * Check if this parser can handle the URL
     */
    static can_handle(url: string): boolean;
    /**
     * Get parser configuration
     */
    static getConfig(): SiteParserConfig;
}
/**
 * Parser for GitHub repositories and issues
 */
export declare class GitHubParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Medium articles
 */
export declare class MediumParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Zhihu
 */
export declare class ZhihuParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for DEV Community
 */
export declare class DevToParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Stack Overflow
 */
export declare class StackOverflowParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Wikipedia
 */
export declare class WikipediaParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Reddit
 */
export declare class RedditParser extends SiteParser {
    static DOMAINS: string[];
    static SELECTORS: {
        title: string;
        content: string;
    };
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Hacker News
 */
export declare class HackerNewsParser extends SiteParser {
    static DOMAINS: string[];
    static SELECTORS: {
        title: string;
        content: string;
        author: string;
    };
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for TechCrunch
 */
export declare class TechCrunchParser extends SiteParser {
    static DOMAINS: string[];
    static SELECTORS: {
        title: string;
        content: string;
    };
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for The Verge
 */
export declare class VergeParser extends SiteParser {
    static DOMAINS: string[];
    static SELECTORS: {
        title: string;
        content: string;
    };
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Ars Technica
 */
export declare class ArsTechnicaParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for V2EX
 */
export declare class V2exParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Product Hunt
 */
export declare class ProductHuntParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    static REQUIRES_JS: boolean;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Bilibili
 */
export declare class BiliBiliParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    static REQUIRES_JS: boolean;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for CSDN
 */
export declare class CSDNParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for JianShu
 */
export declare class JianShuParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for SegmentFault
 */
export declare class SegmentFaultParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for YouTube
 */
export declare class YouTubeParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Twitter/X
 */
export declare class TwitterParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for news sites
 */
export declare class NewsSiteParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Juejin
 */
export declare class JuejinParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Substack
 */
export declare class SubstackParser extends SiteParser {
    static DOMAINS: string[];
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Parser for Hashnode
 */
export declare class HashnodeParser extends SiteParser {
    static DOMAINS: string[];
    static PRIORITY: number;
    parse($: cheerio.CheerioAPI, url: string): ParsedContent;
}
/**
 * Registry of all parsers (ordered by priority)
 */
export declare const SITE_PARSERS: typeof SiteParser[];
/**
 * Register a new parser dynamically
 */
export declare function registerParser(parserClass: typeof SiteParser): void;
/**
 * Unregister a parser by domain
 */
export declare function unregisterParser(domain: string): void;
/**
 * Get list of all registered domains
 */
export declare function getRegisteredDomains(): string[];
/**
 * Get appropriate parser for URL
 */
export declare function getParser(url: string): SiteParser | null;
/**
 * Check if URL has a specific parser
 */
export declare function canHandle(url: string): boolean;
/**
 * Parse site-specific content
 */
export declare function parseSite(url: string, html: string): ParsedContent;
declare const _default: {
    SiteParser: typeof SiteParser;
    SiteParserConfig: SiteParserConfig;
    SITE_PARSERS: (typeof SiteParser)[];
    getParser: typeof getParser;
    canHandle: typeof canHandle;
    parseSite: typeof parseSite;
    registerParser: typeof registerParser;
    unregisterParser: typeof unregisterParser;
    getRegisteredDomains: typeof getRegisteredDomains;
    GitHubParser: typeof GitHubParser;
    MediumParser: typeof MediumParser;
    ZhihuParser: typeof ZhihuParser;
    DevToParser: typeof DevToParser;
    StackOverflowParser: typeof StackOverflowParser;
    WikipediaParser: typeof WikipediaParser;
    RedditParser: typeof RedditParser;
    YouTubeParser: typeof YouTubeParser;
    TwitterParser: typeof TwitterParser;
    NewsSiteParser: typeof NewsSiteParser;
    HackerNewsParser: typeof HackerNewsParser;
    TechCrunchParser: typeof TechCrunchParser;
    VergeParser: typeof VergeParser;
    ArsTechnicaParser: typeof ArsTechnicaParser;
    V2exParser: typeof V2exParser;
    ProductHuntParser: typeof ProductHuntParser;
    BiliBiliParser: typeof BiliBiliParser;
    CSDNParser: typeof CSDNParser;
    JianShuParser: typeof JianShuParser;
    SegmentFaultParser: typeof SegmentFaultParser;
    JuejinParser: typeof JuejinParser;
    SubstackParser: typeof SubstackParser;
    HashnodeParser: typeof HashnodeParser;
};
export default _default;
//# sourceMappingURL=site_specific.d.ts.map