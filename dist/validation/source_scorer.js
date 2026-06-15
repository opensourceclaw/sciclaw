const KNOWN_DOMAINS = {
    "wikipedia.org": 0.85,
    "arxiv.org": 0.95,
    "scholar.google.com": 0.9,
    "ieee.org": 0.95,
    "acm.org": 0.9,
    "springer.com": 0.9,
    "nature.com": 0.95,
    "science.org": 0.95,
    "sciencedirect.com": 0.9,
    "pubmed.ncbi.nlm.nih.gov": 0.95,
    "researchgate.net": 0.7,
    "semanticscholar.org": 0.85,
    "who.int": 0.95,
    "un.org": 0.9,
    "nist.gov": 0.95,
    "nasa.gov": 0.9,
    "noaa.gov": 0.9,
    "cdc.gov": 0.95,
    "nih.gov": 0.95,
    "nsf.gov": 0.9,
    "data.gov": 0.85,
    "github.com": 0.8,
    "stackoverflow.com": 0.7,
    "docs.python.org": 0.9,
    "developer.mozilla.org": 0.9,
    "w3.org": 0.9,
    "pypi.org": 0.75,
    "npmjs.com": 0.75,
    "docker.com": 0.75,
    "reuters.com": 0.8,
    "apnews.com": 0.8,
    "bbc.com": 0.75,
    "bbc.co.uk": 0.75,
    "bloomberg.com": 0.75,
    "economist.com": 0.8,
    "wsj.com": 0.75,
    "nytimes.com": 0.7,
    "theguardian.com": 0.7,
    "techcrunch.com": 0.65,
    "wired.com": 0.7,
    "arstechnica.com": 0.75,
    "theverge.com": 0.6,
    "hackernews.com": 0.5,
    "medium.com": 0.45,
    "reddit.com": 0.35,
    "quora.com": 0.3,
    "blogspot.com": 0.25,
    "wordpress.com": 0.25,
    "tumblr.com": 0.2,
    "facebook.com": 0.2,
    "twitter.com": 0.2,
    "x.com": 0.2,
    "youtube.com": 0.3,
};
const EDUCATIONAL_TLDS = [".edu", ".ac.uk", ".ac.jp", ".ac.kr", ".ac.cn", ".ac.in", ".ac.au", ".ac.nz", ".ac.za", ".edu.cn", ".edu.hk", ".edu.tw"];
const GOVERNMENT_TLDS = [".gov", ".gov.uk", ".gov.au", ".gov.cn", ".gov.sg", ".gov.hk", ".gov.jp", ".go.jp", ".go.kr", ".mil"];
const FRESHNESS_CATEGORIES = [
    { maxDays: 30, score: 1.0, category: "very_recent" },
    { maxDays: 90, score: 0.9, category: "recent" },
    { maxDays: 180, score: 0.7, category: "current" },
    { maxDays: 365, score: 0.5, category: "acceptable" },
    { maxDays: 730, score: 0.3, category: "dated" },
    { maxDays: Infinity, score: 0.1, category: "outdated" },
];
const DATE_FORMATS = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/,
    /^(\d{4})\/(\d{2})\/(\d{2})$/,
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
];
function extractDomain(url) {
    try {
        const cleaned = url.startsWith("http") ? url : `https://${url}`;
        const parsed = new URL(cleaned);
        let domain = parsed.hostname.toLowerCase();
        if (domain.startsWith("www."))
            domain = domain.slice(4);
        return domain;
    }
    catch {
        return url.toLowerCase();
    }
}
function hasTld(domain, tlds) {
    return tlds.some((tld) => domain.endsWith(tld));
}
function parseDate(dateStr) {
    const trimmed = dateStr.trim();
    for (const fmt of DATE_FORMATS) {
        const m = trimmed.match(fmt);
        if (m) {
            const [, y, mo, d] = m;
            const parsed = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
            if (!isNaN(parsed.getTime()))
                return parsed;
        }
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime()))
        return parsed;
    const yearMatch = trimmed.match(/\b(\d{4})\b/);
    if (yearMatch) {
        const parsed2 = new Date(parseInt(yearMatch[1]), 0, 1);
        if (!isNaN(parsed2.getTime()))
            return parsed2;
    }
    return null;
}
export class DomainScorer {
    scoreDomain(url) {
        const domain = extractDomain(url);
        let reputation = 0.5;
        let category = "unknown";
        for (const [knownDomain, score] of Object.entries(KNOWN_DOMAINS)) {
            if (domain === knownDomain || domain.endsWith("." + knownDomain)) {
                reputation = score;
                if (score >= 0.85)
                    category = "academic";
                else if (score >= 0.7)
                    category = "news";
                else if (score >= 0.5)
                    category = "tech";
                else
                    category = "low_trust";
                return { domain, reputation, category };
            }
        }
        if (hasTld(domain, EDUCATIONAL_TLDS)) {
            reputation = 0.7;
            category = "educational";
        }
        else if (hasTld(domain, GOVERNMENT_TLDS)) {
            reputation = 0.75;
            category = "government";
        }
        if (url.startsWith("https://")) {
            reputation = Math.min(1, reputation + 0.05);
        }
        return { domain, reputation: Math.round(reputation * 1000) / 1000, category };
    }
}
export class FreshnessScorer {
    scoreFreshness(pubDate, modDate) {
        if (!pubDate && !modDate) {
            return { score: 0.5, daysSincePublished: 0, category: "unknown" };
        }
        const pub = pubDate ? parseDate(pubDate) : null;
        const mod = modDate ? parseDate(modDate) : null;
        const effective = pub && mod ? (pub > mod ? pub : mod) : pub ?? mod;
        if (!effective) {
            return { score: 0.5, daysSincePublished: 0, category: "unknown" };
        }
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24));
        for (const cat of FRESHNESS_CATEGORIES) {
            if (daysSince < cat.maxDays) {
                return { score: cat.score, daysSincePublished: Math.max(0, daysSince), publishedDate: pubDate, category: cat.category };
            }
        }
        return { score: 0.1, daysSincePublished: Math.max(0, daysSince), publishedDate: pubDate, category: "outdated" };
    }
}
export class SourceScorer {
    domainWeight;
    freshnessWeight;
    authorityWeight;
    domainScorer;
    freshnessScorer;
    constructor(weights) {
        this.domainWeight = weights?.domain ?? 0.4;
        this.freshnessWeight = weights?.freshness ?? 0.3;
        this.authorityWeight = weights?.authority ?? 0.3;
        const total = this.domainWeight + this.freshnessWeight + this.authorityWeight;
        if (Math.abs(total - 1.0) > 0.001) {
            throw new Error(`Weights must sum to 1.0, got ${total}`);
        }
        this.domainScorer = new DomainScorer();
        this.freshnessScorer = new FreshnessScorer();
    }
    scoreSource(url, pubDate, authorityScore) {
        const domainScore = this.domainScorer.scoreDomain(url);
        const freshness = this.freshnessScorer.scoreFreshness(pubDate);
        const authority = { score: authorityScore ?? 0.5, hasCredentials: false };
        const overall = domainScore.reputation * this.domainWeight + freshness.score * this.freshnessWeight + authority.score * this.authorityWeight;
        return {
            domain: domainScore,
            freshness,
            authority,
            overall: Math.round(overall * 1000) / 1000,
        };
    }
}
export function scoreSource(url, pubDate) {
    const scorer = new SourceScorer();
    return scorer.scoreSource(url, pubDate);
}
//# sourceMappingURL=source_scorer.js.map