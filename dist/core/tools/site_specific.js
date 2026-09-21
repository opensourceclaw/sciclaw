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
import { URL } from 'url';
/**
 * Base class for site-specific parsers
 */
export class SiteParser {
    static DOMAINS = [];
    static SELECTORS = {};
    static PRIORITY = 100;
    static REQUIRES_JS = false;
    parse($, url) {
        return { title: '', content: '' };
    }
    /**
     * Check if this parser can handle the URL
     */
    static can_handle(url) {
        if (!this.DOMAINS || this.DOMAINS.length === 0)
            return false;
        let domain;
        try {
            const parsed = new URL(url);
            domain = parsed.hostname.toLowerCase().replace(/^www\./, '');
        }
        catch {
            return false;
        }
        return this.DOMAINS.some(d => domain.includes(d));
    }
    /**
     * Get parser configuration
     */
    static getConfig() {
        return {
            domains: this.DOMAINS,
            selectors: this.SELECTORS,
            requiresJs: this.REQUIRES_JS,
            priority: this.PRIORITY,
        };
    }
}
/**
 * Parser for GitHub repositories and issues
 */
export class GitHubParser extends SiteParser {
    static DOMAINS = ["github.com", "gist.github.com"];
    parse($, url) {
        const result = { title: '', content: '' };
        // Title
        result.title = $('title').text().trim();
        // Repository description
        const desc = $('[itemprop="description"]').text().trim();
        if (desc)
            result.content = desc;
        // Author
        const author = $('[itemprop="author"]').text().trim();
        if (author)
            result.author = author;
        // Date
        const time = $('time').first().attr('datetime');
        if (time)
            result.date = time;
        // README content
        const readme = $('.markdown-body').text().trim();
        if (readme)
            result.content = readme;
        return result;
    }
}
/**
 * Parser for Medium articles
 */
export class MediumParser extends SiteParser {
    static DOMAINS = ["medium.com", "substack.com"];
    parse($, url) {
        const result = { title: '', content: '' };
        // Title
        const ogTitle = $('meta[property="og:title"]').attr('content');
        result.title = ogTitle || $('h1').first().text().trim();
        // Author
        const author = $('a[rel="author"], [class*="author"]').first().text().trim();
        if (author)
            result.author = author;
        // Date
        const time = $('time').first().attr('datetime');
        if (time)
            result.date = time;
        // Content
        const article = $('article, [class*="article"], .post-content').first();
        if (article.length) {
            article.find('.paywall, .subscription, .recommended').remove();
            result.content = article.text().trim();
        }
        return result;
    }
}
/**
 * Parser for Zhihu
 */
export class ZhihuParser extends SiteParser {
    static DOMAINS = ["zhihu.com"];
    parse($, url) {
        const result = { title: '', content: '' };
        // Title
        result.title = $('title').text().replace(/\s*[-|–]\s*Zhihu.*$/, '').trim();
        // Author
        const author = $('[class*="author"], a[class*="name"]').first().text().trim();
        if (author)
            result.author = author;
        // Content
        const content = $('[class*="ContentItem"], [class*="Answer"], [class*="Post"], .zm-item, article, .post-content').first();
        if (content.length)
            result.content = content.text().trim();
        return result;
    }
}
/**
 * Parser for DEV Community
 */
export class DevToParser extends SiteParser {
    static DOMAINS = ["dev.to", "dev.to.it"];
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('a[rel="author"], [class*="user"]').first().text().trim();
        result.date = $('time').first().attr('datetime');
        const article = $('article, .article-content, .crayons-article').first();
        if (article.length) {
            article.find('.crayons-notice, .hidden').remove();
            result.content = article.text().trim();
        }
        return result;
    }
}
/**
 * Parser for Stack Overflow
 */
export class StackOverflowParser extends SiteParser {
    static DOMAINS = ["stackoverflow.com", "serverfault.com", "superuser.com", "askubuntu.com"];
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('title').text().replace(/\s*[-|–]\s*Stack.*$/, '').trim();
        result.author = $('[class*="user"], .post-signature a').first().text().trim();
        result.date = $('time').first().attr('datetime');
        const post = $('.post-text, .answer, .question').first();
        if (post.length)
            result.content = post.text().trim();
        return result;
    }
}
/**
 * Parser for Wikipedia
 */
export class WikipediaParser extends SiteParser {
    static DOMAINS = ["wikipedia.org", "wikimedia.org"];
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('title').text().replace(/\s*[-|–]\s*Wikipedia.*$/, '').trim();
        if (!result.title) {
            result.title = $('h1#firstHeading').text().trim();
        }
        const content = $('#mw-content-text, .mw-parser-output').first();
        if (content.length) {
            content.find('.reference, .mw-editsection, .navbox').remove();
            result.content = content.text().trim();
        }
        return result;
    }
}
/**
 * Parser for Reddit
 */
export class RedditParser extends SiteParser {
    static DOMAINS = ["reddit.com", "old.reddit.com"];
    static SELECTORS = {
        title: "[data-testid='post-title'], .title",
        content: ".post-content, [data-testid='post-content']",
    };
    static PRIORITY = 120;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('[class*="author"], a[data-testid="author"]').first().text().trim();
        result.date = $('time').first().attr('datetime');
        const post = $('[class*="Post"], [class*="shreddit"], .entry').first();
        if (post.length)
            result.content = post.text().trim();
        return result;
    }
}
/**
 * Parser for Hacker News
 */
export class HackerNewsParser extends SiteParser {
    static DOMAINS = ["news.ycombinator.com", "hn.firechat.co"];
    static SELECTORS = {
        title: "title, .titleline a",
        content: ".comment",
        author: ".hnuser",
    };
    static PRIORITY = 200;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('.titleline a').first().text().trim();
        result.author = $('.hnuser').first().text().trim();
        result.date = $('.age').first().attr('title');
        const comment = $('.comment').first();
        if (comment.length)
            result.content = comment.text().trim();
        return result;
    }
}
/**
 * Parser for TechCrunch
 */
export class TechCrunchParser extends SiteParser {
    static DOMAINS = ["techcrunch.com", "techcrunch.jp"];
    static SELECTORS = {
        title: "article h1, .article-title",
        content: ".article-content, .article-body",
    };
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') ||
            $('article h1, .article-title').first().text().trim();
        result.author = $('meta[name="author"]').attr('content');
        result.date = $('meta[property="article:published_time"]').attr('content');
        const article = $('.article-content, .article-body, article').first();
        if (article.length) {
            article.find('.ad, .newsletter, .share').remove();
            result.content = article.text().trim();
        }
        return result;
    }
}
/**
 * Parser for The Verge
 */
export class VergeParser extends SiteParser {
    static DOMAINS = ["theverge.com", "www.theverge.com"];
    static SELECTORS = {
        title: "h1, [data-testid='title']",
        content: ".article-body, .c-entry-content",
    };
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('meta[name="author"]').attr('content');
        result.date = $('meta[property="article:published_time"]').attr('content');
        const article = $('.article-body, .c-entry-content, article').first();
        if (article.length)
            result.content = article.text().trim();
        return result;
    }
}
/**
 * Parser for Ars Technica
 */
export class ArsTechnicaParser extends SiteParser {
    static DOMAINS = ["arstechnica.com"];
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('meta[name="author"]').attr('content');
        result.date = $('meta[property="article:published_time"]').attr('content');
        const article = $('.article-content, .post-content, article').first();
        if (article.length)
            result.content = article.text().trim();
        return result;
    }
}
/**
 * Parser for V2EX
 */
export class V2exParser extends SiteParser {
    static DOMAINS = ["v2ex.com", "www.v2ex.com"];
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('.header .topic').text().trim();
        result.author = $('.header a.username').text().trim();
        const content = $('.topic_content').first();
        if (content.length)
            result.content = content.text().trim();
        return result;
    }
}
/**
 * Parser for Product Hunt
 */
export class ProductHuntParser extends SiteParser {
    static DOMAINS = ["producthunt.com", "www.producthunt.com"];
    static PRIORITY = 150;
    static REQUIRES_JS = true;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.content = $('meta[property="og:description"]').attr('content') || '';
        return result;
    }
}
/**
 * Parser for Bilibili
 */
export class BiliBiliParser extends SiteParser {
    static DOMAINS = ["bilibili.com", "www.bilibili.com"];
    static PRIORITY = 150;
    static REQUIRES_JS = true;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.content = $('meta[property="og:description"]').attr('content') || '';
        return result;
    }
}
/**
 * Parser for CSDN
 */
export class CSDNParser extends SiteParser {
    static DOMAINS = ["blog.csdn.net", "csdn.net"];
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') ||
            $('h1, .title-article').first().text().trim();
        result.author = $('[class*="author"], .username').first().text().trim();
        const content = $('.article_content, .blog-content').first();
        if (content.length)
            result.content = content.text().trim();
        return result;
    }
}
/**
 * Parser for JianShu
 */
export class JianShuParser extends SiteParser {
    static DOMAINS = ["jianshu.com", "www.jianshu.com"];
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('[class*="author"], a[rel="author"]').first().text().trim();
        const content = $('.content, .article, article').first();
        if (content.length)
            result.content = content.text().trim();
        return result;
    }
}
/**
 * Parser for SegmentFault
 */
export class SegmentFaultParser extends SiteParser {
    static DOMAINS = ["segmentfault.com", "www.segmentfault.com"];
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('[class*="author"]').first().text().trim();
        const content = $('.article-content, .post-content').first();
        if (content.length)
            result.content = content.text().trim();
        return result;
    }
}
/**
 * Parser for YouTube
 */
export class YouTubeParser extends SiteParser {
    static DOMAINS = ["youtube.com", "youtu.be"];
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('meta[name="author"]').attr('content');
        result.date = $('meta[name="date"]').attr('content');
        result.content = $('meta[property="og:description"]').attr('content') || '';
        return result;
    }
}
/**
 * Parser for Twitter/X
 */
export class TwitterParser extends SiteParser {
    static DOMAINS = ["twitter.com", "x.com", "fxtwitter.com", "vxtwitter.com"];
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') || '';
        result.author = $('meta[name="twitter:creator"]').attr('content');
        result.content = $('meta[property="og:description"]').attr('content') || '';
        return result;
    }
}
/**
 * Parser for news sites
 */
export class NewsSiteParser extends SiteParser {
    static DOMAINS = [
        "news.google.com", "bbc.com", "bbc.co.uk", "cnn.com",
        "reuters.com", "apnews.com", "nytimes.com", "theguardian.com",
        "washingtonpost.com", "wsj.com",
    ];
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('meta[property="og:title"]').attr('content') ||
            $('title').text().trim();
        result.author = $('meta[name="author"]').attr('content') ||
            $('meta[property="article:author"]').attr('content');
        result.date = $('meta[property="article:published_time"]').attr('content');
        const article = $('article, [class*="article"], [class*="story"], .article-body, .story-body').first();
        if (article.length) {
            article.find('.ad, .share, .social, .newsletter, .promo, .paywall').remove();
            result.content = article.text().trim();
        }
        return result;
    }
}
/**
 * Parser for Juejin
 */
export class JuejinParser extends SiteParser {
    static DOMAINS = ["juejin.cn", "juejin.im"];
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('h1.title, .article-title').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') || '';
        result.author = $('.author-name, .user-name').first().text().trim();
        result.date = $('.time, .publish-time').first().text().trim();
        const content = $('.article-content, .markdown-body, .content, article').first();
        if (content.length) {
            content.find('.code-block-wrapper, script, style').remove();
            result.content = content.text().trim();
        }
        return result;
    }
}
/**
 * Parser for Substack
 */
export class SubstackParser extends SiteParser {
    static DOMAINS = ["substack.com"];
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('h1.post-title, h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') || '';
        result.author = $('.author-name, .byline-name, [class*="author"]').first().text().trim();
        result.date = $('time, .date, .published-date').first().text().trim();
        const content = $('.post-body, .article-body, .article-content, .content-body, article').first();
        if (content.length) {
            content.find('.paywall, .subscribe-cta, script, style').remove();
            result.content = content.text().trim();
        }
        return result;
    }
}
/**
 * Parser for Hashnode
 */
export class HashnodeParser extends SiteParser {
    static DOMAINS = ["hashnode.dev", "hashnode.io"];
    static PRIORITY = 150;
    parse($, url) {
        const result = { title: '', content: '' };
        result.title = $('h1, .article-title, .post-title').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') || '';
        result.author = $('.author-name, .user-info-name, [class*="author"] a').first().text().trim();
        result.date = $('time, .published-date, .date').first().text().trim();
        const content = $('.article-content, .post-content, .prose, article, .content').first();
        if (content.length) {
            content.find('.code-block, pre, script, style').remove();
            result.content = content.text().trim();
        }
        return result;
    }
}
/**
 * Registry of all parsers (ordered by priority)
 */
export const SITE_PARSERS = [
    // High-priority specific parsers
    HackerNewsParser,
    ProductHuntParser,
    BiliBiliParser,
    V2exParser,
    CSDNParser,
    JianShuParser,
    SegmentFaultParser,
    JuejinParser,
    TechCrunchParser,
    VergeParser,
    ArsTechnicaParser,
    SubstackParser,
    HashnodeParser,
    // Standard parsers
    GitHubParser,
    MediumParser,
    ZhihuParser,
    DevToParser,
    StackOverflowParser,
    WikipediaParser,
    RedditParser,
    YouTubeParser,
    TwitterParser,
    NewsSiteParser,
];
// Parser registry for dynamic registration
const PARSER_REGISTRY = new Map();
/**
 * Register a new parser dynamically
 */
export function registerParser(parserClass) {
    for (const domain of parserClass.DOMAINS) {
        PARSER_REGISTRY.set(domain, parserClass);
    }
}
/**
 * Unregister a parser by domain
 */
export function unregisterParser(domain) {
    PARSER_REGISTRY.delete(domain);
}
/**
 * Get list of all registered domains
 */
export function getRegisteredDomains() {
    return Array.from(PARSER_REGISTRY.keys());
}
/**
 * Get appropriate parser for URL
 */
export function getParser(url) {
    // Check registered parsers first
    let domain;
    try {
        const parsed = new URL(url);
        domain = parsed.hostname.toLowerCase().replace(/^www\./, '');
    }
    catch {
        return null;
    }
    const registered = PARSER_REGISTRY.get(domain);
    if (registered) {
        return new registered();
    }
    // Fall back to built-in parsers
    for (const parserClass of SITE_PARSERS) {
        if (parserClass.can_handle(url)) {
            return new parserClass();
        }
    }
    return null;
}
/**
 * Check if URL has a specific parser
 */
export function canHandle(url) {
    return getParser(url) !== null;
}
/**
 * Parse site-specific content
 */
export function parseSite(url, html) {
    const $ = cheerio.load(html);
    const parser = getParser(url);
    if (parser) {
        return parser.parse($, url);
    }
    return { title: '', content: '' };
}
// Export all
export default {
    SiteParser,
    SiteParserConfig: {},
    SITE_PARSERS,
    getParser,
    canHandle,
    parseSite,
    registerParser,
    unregisterParser,
    getRegisteredDomains,
    // Parser classes
    GitHubParser,
    MediumParser,
    ZhihuParser,
    DevToParser,
    StackOverflowParser,
    WikipediaParser,
    RedditParser,
    YouTubeParser,
    TwitterParser,
    NewsSiteParser,
    HackerNewsParser,
    TechCrunchParser,
    VergeParser,
    ArsTechnicaParser,
    V2exParser,
    ProductHuntParser,
    BiliBiliParser,
    CSDNParser,
    JianShuParser,
    SegmentFaultParser,
    JuejinParser,
    SubstackParser,
    HashnodeParser,
};
//# sourceMappingURL=site_specific.js.map