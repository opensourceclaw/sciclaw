/**
 * SciClaw v3.9.0 — Source Credibility Gate
 */
const HIGH_CRED = ["arxiv.org", "nature.com", "science.org", "ieee.org", "acm.org", "springer.com", "wiley.com"];
const MEDIUM_CRED = ["wikipedia.org", ".edu", ".gov", "medium.com"];
export class SourceCredibilityGate {
    name = "source-credibility";
    stage = "search";
    async check(context) {
        const details = [];
        for (const result of context.searchResults) {
            const score = this.scoreSource(result);
            details.push({ item: result.url, score, reason: this.explainScore(score) });
        }
        const avgScore = details.length > 0 ? details.reduce((sum, d) => sum + d.score, 0) / details.length : 0;
        return { passed: avgScore >= 0.7, score: avgScore, threshold: 0.7, details, recommendations: this.recommend(details) };
    }
    scoreSource(result) {
        const domain = this.extractDomain(result.url);
        const domainScore = this.scoreDomain(domain);
        const recencyScore = this.scoreRecency(result.timestamp);
        const relevanceScore = Math.min(1, result.relevanceScore);
        return domainScore * 0.3 + recencyScore * 0.2 + relevanceScore * 0.2 + 0.3;
    }
    scoreDomain(domain) {
        if (HIGH_CRED.some(d => domain.includes(d)))
            return 0.95;
        if (MEDIUM_CRED.some(d => domain.includes(d)))
            return 0.75;
        if (domain.includes("blog") || domain.includes("forum"))
            return 0.4;
        return 0.6;
    }
    scoreRecency(timestamp) {
        const age = Date.now() - new Date(timestamp).getTime();
        const days = age / (1000 * 60 * 60 * 24);
        if (days < 30)
            return 1.0;
        if (days < 365)
            return 0.8;
        if (days < 1825)
            return 0.6;
        return 0.4;
    }
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        }
        catch {
            return url;
        }
    }
    explainScore(score) {
        if (score >= 0.9)
            return "High credibility";
        if (score >= 0.7)
            return "Good credibility";
        if (score >= 0.5)
            return "Moderate credibility";
        return "Low credibility";
    }
    recommend(details) {
        const lowScore = details.filter(d => d.score < 0.5);
        if (lowScore.length > 0)
            return [`Consider replacing ${lowScore.length} low-credibility sources`];
        return [];
    }
}
//# sourceMappingURL=source-credibility-gate.js.map