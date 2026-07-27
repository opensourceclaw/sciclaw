/**
 * DeepClaw v3.9.0 — Citation Integrity Gate
 */
export class CitationIntegrityGate {
    name = "citation-integrity";
    stage = "report";
    async check(context) {
        if (!context.synthesis) {
            return { passed: false, score: 0, threshold: 0.95, details: [{ item: "synthesis", score: 0, reason: "No synthesis available" }] };
        }
        const citations = context.synthesis.citations;
        if (citations.length === 0) {
            return { passed: false, score: 0, threshold: 0.95, details: [{ item: "citations", score: 0, reason: "No citations found" }] };
        }
        const details = [];
        for (const citation of citations) {
            const score = this.checkCitation(citation, context);
            details.push({ item: citation.id, score, reason: this.explainCitationScore(score) });
        }
        const avgScore = details.reduce((sum, d) => sum + d.score, 0) / details.length;
        return { passed: avgScore >= 0.95, score: avgScore, threshold: 0.95, details, recommendations: this.findIssues(details, citations) };
    }
    checkCitation(citation, context) {
        let score = 0;
        if (citation.source)
            score += 0.25;
        if (citation.id)
            score += 0.25;
        if (citation.accessedAt)
            score += 0.25;
        if (citation.url)
            score += 0.15;
        const exists = context.searchResults.some(r => r.url === citation.url || r.title.includes(citation.source));
        if (exists)
            score += 0.1;
        return Math.min(1, score);
    }
    explainCitationScore(score) {
        if (score >= 0.95)
            return "Complete citation";
        if (score >= 0.75)
            return "Good citation";
        if (score >= 0.5)
            return "Incomplete citation";
        return "Poor citation";
    }
    findIssues(details, _citations) {
        const issues = details.filter(d => d.score < 0.75);
        if (issues.length > 0)
            return [`Fix ${issues.length} incomplete citations`];
        return [];
    }
}
//# sourceMappingURL=citation-integrity-gate.js.map