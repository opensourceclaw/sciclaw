/**
 * SciClaw v3.9.0 — Bias Detection Gate
 */
export class BiasDetectionGate {
    name = "bias-detection";
    stage = "validate";
    async check(context) {
        const details = [];
        const selectionBias = this.checkSelectionBias(context);
        details.push({ item: "selection", score: selectionBias, reason: "Source diversity" });
        const confirmationBias = this.checkConfirmationBias(context);
        details.push({ item: "confirmation", score: confirmationBias, reason: "Argument balance" });
        const temporalBias = this.checkTemporalBias(context);
        details.push({ item: "temporal", score: temporalBias, reason: "Time coverage" });
        const avgBias = details.reduce((sum, d) => sum + d.score, 0) / details.length;
        return { passed: avgBias <= 0.3, score: avgBias, threshold: 0.3, details, recommendations: this.recommendMitigations(details) };
    }
    checkSelectionBias(context) {
        const domains = new Set(context.searchResults.map(r => this.extractDomain(r.url)));
        const diversity = domains.size / Math.max(context.searchResults.length, 1);
        return Math.max(0, 1 - diversity);
    }
    checkConfirmationBias(context) {
        if (!context.synthesis)
            return 0.5;
        const hasCounter = context.synthesis.arguments.some(a => a.counterArguments && a.counterArguments.length > 0);
        return hasCounter ? 0.15 : 0.5;
    }
    checkTemporalBias(context) {
        const timestamps = context.searchResults.map(r => new Date(r.timestamp).getTime()).filter(t => !isNaN(t));
        if (timestamps.length < 2)
            return 0.5;
        const range = Math.max(...timestamps) - Math.min(...timestamps);
        const years = range / (1000 * 60 * 60 * 24 * 365);
        return years > 5 ? 0.2 : years > 2 ? 0.3 : 0.5;
    }
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        }
        catch {
            return url;
        }
    }
    recommendMitigations(details) {
        const recs = [];
        const selection = details.find(d => d.item === "selection");
        if (selection && selection.score > 0.3)
            recs.push("Diversify information sources");
        const confirmation = details.find(d => d.item === "confirmation");
        if (confirmation && confirmation.score > 0.3)
            recs.push("Add counter-arguments to strengthen analysis");
        return recs;
    }
}
//# sourceMappingURL=bias-detection-gate.js.map