import crypto from "crypto";
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
        return "";
    }
}
export class CitationTracker {
    citations = [];
    urlIndex = new Map();
    addCitation(url, title = "", qualityScore = 0.5, snippet = "", publishedDate, author, siteName) {
        const normalized = url.trim().toLowerCase();
        const existing = this.urlIndex.get(normalized);
        if (existing !== undefined) {
            const cit = this.citations[existing];
            if (qualityScore > cit.qualityScore)
                cit.qualityScore = qualityScore;
            if (snippet.length > cit.relevantSnippet.length)
                cit.relevantSnippet = snippet;
            return cit;
        }
        const citation = {
            url,
            title,
            sourceId: crypto.randomBytes(4).toString("hex"),
            domain: extractDomain(url),
            publishedDate,
            accessedDate: new Date(),
            qualityScore,
            relevantSnippet: snippet,
            author,
            siteName,
            metadata: {},
        };
        this.citations.push(citation);
        this.urlIndex.set(normalized, this.citations.length - 1);
        return citation;
    }
    getCitation(sourceId) {
        return this.citations.find((c) => c.sourceId === sourceId);
    }
    getCitationByUrl(url) {
        const idx = this.urlIndex.get(url.trim().toLowerCase());
        return idx !== undefined ? this.citations[idx] : undefined;
    }
    getAllCitations() {
        return [...this.citations];
    }
    getCitationsByDomain(domain) {
        const lower = domain.toLowerCase();
        return this.citations.filter((c) => c.domain && lower.includes(c.domain));
    }
    getCitationsByQuality(minScore) {
        return this.citations.filter((c) => c.qualityScore >= minScore);
    }
    getStatistics() {
        if (this.citations.length === 0) {
            return { totalCitations: 0, uniqueDomains: 0, averageQuality: 0, topDomains: {}, dateRange: null };
        }
        const domainCount = new Map();
        let totalQuality = 0;
        const dates = [];
        for (const c of this.citations) {
            if (c.domain)
                domainCount.set(c.domain, (domainCount.get(c.domain) ?? 0) + 1);
            totalQuality += c.qualityScore;
            if (c.publishedDate)
                dates.push(c.publishedDate);
        }
        const sorted = [...domainCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topDomains = {};
        for (const [d, cnt] of sorted)
            topDomains[d] = cnt;
        return {
            totalCitations: this.citations.length,
            uniqueDomains: domainCount.size,
            averageQuality: Math.round((totalQuality / this.citations.length) * 1000) / 1000,
            topDomains,
            dateRange: dates.length > 0
                ? {
                    earliest: new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString(),
                    latest: new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString(),
                }
                : null,
        };
    }
    removeCitation(sourceId) {
        const idx = this.citations.findIndex((c) => c.sourceId === sourceId);
        if (idx === -1)
            return false;
        this.urlIndex.delete(this.citations[idx].url.trim().toLowerCase());
        this.citations.splice(idx, 1);
        this.urlIndex.clear();
        this.citations.forEach((c, i) => this.urlIndex.set(c.url.trim().toLowerCase(), i));
        return true;
    }
    clear() {
        this.citations = [];
        this.urlIndex.clear();
    }
    toJSON() {
        const data = {
            citations: this.citations.map((c) => ({
                ...c,
                publishedDate: c.publishedDate?.toISOString(),
                accessedDate: c.accessedDate.toISOString(),
            })),
            statistics: this.getStatistics(),
        };
        return JSON.stringify(data, null, 2);
    }
    static fromJSON(json) {
        const data = JSON.parse(json);
        const tracker = new CitationTracker();
        for (const citData of data.citations ?? []) {
            const citation = {
                url: citData.url ?? "",
                title: citData.title ?? "",
                sourceId: citData.sourceId ?? crypto.randomBytes(4).toString("hex"),
                domain: citData.domain ?? "",
                publishedDate: citData.publishedDate ? new Date(citData.publishedDate) : undefined,
                accessedDate: citData.accessedDate ? new Date(citData.accessedDate) : new Date(),
                qualityScore: citData.qualityScore ?? 0.5,
                relevantSnippet: citData.relevantSnippet ?? "",
                author: citData.author,
                siteName: citData.siteName,
                metadata: citData.metadata ?? {},
            };
            tracker.citations.push(citation);
            tracker.urlIndex.set(citation.url.trim().toLowerCase(), tracker.citations.length - 1);
        }
        return tracker;
    }
}
//# sourceMappingURL=citation_tracker.js.map