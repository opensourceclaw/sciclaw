export const DEFAULT_VERIFIER_CONFIG = {
    maxIterations: 5,
    confirmThreshold: 0.7,
    rejectThreshold: 0.3,
    minSourcesForPass: 2,
};
// ── Contradiction patterns ───────────────────────────────────────────
const CONTRADICTION_PATTERNS = [
    /\b(?:however|but|on the other hand|conversely|nevertheless|although)\b/i,
    /\b(?:contradict|disagree|refute|dispute|challenge)\b/i,
];
const NEGATION_PATTERNS = [
    /\b(?:not|no|never|neither|nor|cannot|isn't|aren't|don't|doesn't)\b/i,
];
// ── IterativeVerifier ────────────────────────────────────────────────
export class IterativeVerifier {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_VERIFIER_CONFIG, ...config };
    }
    /**
     * Run a verification loop for a hypothesis against available evidence.
     */
    verify(hypothesis, evidenceSets) {
        const iterations = [];
        let confidence = 0.5; // start neutral
        const allClaims = evidenceSets.flatMap((e) => e.claims);
        const allSources = evidenceSets.flatMap((e) => e.sources);
        for (let round = 1; round <= this.config.maxIterations; round++) {
            const iter = this._runIteration(round, hypothesis, allClaims, allSources, confidence);
            iterations.push(iter);
            // Adjust confidence based on result
            confidence = this._updateConfidence(confidence, iter.result, round);
        }
        const conclusion = this._determineConclusion(confidence);
        return {
            hypothesis,
            iterations,
            conclusion,
            confidence: Math.round(confidence * 100) / 100,
        };
    }
    // ── Private ──────────────────────────────────────────────────────────
    _runIteration(round, hypothesis, claims, sources, currentConfidence) {
        const hypoTerms = this._extractKeyTerms(hypothesis);
        // Score each claim against the hypothesis
        const scored = claims.map((claim) => ({
            claim,
            score: this._semanticOverlap(hypoTerms, claim),
        }));
        const supporting = scored.filter((s) => s.score > 0.3);
        const contradicting = scored.filter((s) => s.score < -0.2);
        let result;
        let evidence;
        let refinement;
        if (supporting.length >= this.config.minSourcesForPass) {
            result = "pass";
            evidence = supporting
                .slice(0, 3)
                .map((s) => s.claim.slice(0, 120));
            refinement = hypothesis;
        }
        else if (contradicting.length > 0) {
            result = "fail";
            evidence = contradicting
                .slice(0, 3)
                .map((s) => s.claim.slice(0, 120));
            refinement = this._refineHypothesis(hypothesis, contradicting.map((s) => s.claim), round);
        }
        else {
            result = "partial";
            evidence = scored
                .filter((s) => s.score > 0)
                .slice(0, 3)
                .map((s) => s.claim.slice(0, 120));
            refinement = this._refineHypothesis(hypothesis, [], round);
        }
        // Add source info
        if (sources.length > 0 && evidence.length > 0) {
            evidence.push(`Sources considered: ${sources.length}`);
        }
        return {
            round,
            test: `Round ${round}: Evaluating "${hypothesis.slice(0, 80)}..."`,
            result,
            evidence,
            refinement,
        };
    }
    _extractKeyTerms(text) {
        const stopWords = new Set([
            "the", "a", "an", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "could", "should", "may", "might", "can", "shall",
            "to", "of", "in", "for", "on", "with", "at", "by", "from",
            "and", "or", "but", "not", "this", "that", "it", "its",
        ]);
        return text
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length >= 3 && !stopWords.has(w));
    }
    _semanticOverlap(hypoTerms, claim) {
        const claimLower = claim.toLowerCase();
        const matches = hypoTerms.filter((t) => claimLower.includes(t));
        // Check for negation in claim
        const hasNegation = NEGATION_PATTERNS.some((p) => p.test(claim));
        const hasContradiction = CONTRADICTION_PATTERNS.some((p) => p.test(claim));
        const baseScore = hypoTerms.length > 0 ? matches.length / hypoTerms.length : 0;
        // Negation/contradiction inverts the score
        if (hasNegation || hasContradiction) {
            return -baseScore;
        }
        return baseScore;
    }
    _updateConfidence(current, result, round) {
        const learningRate = 0.15 / round; // decreasing step size
        switch (result) {
            case "pass":
                return Math.min(1, current + learningRate * 2);
            case "fail":
                return Math.max(0, current - learningRate);
            case "partial":
                return current; // partial evidence doesn't change confidence
        }
    }
    _refineHypothesis(hypothesis, contradictions, round) {
        if (contradictions.length === 0 && round === 1) {
            return `${hypothesis} (needs more evidence)`;
        }
        if (contradictions.length > 0) {
            const prefix = round > 2 ? "Partial: " : "";
            return `${prefix}${hypothesis} — contradicted by evidence`;
        }
        return hypothesis;
    }
    _determineConclusion(confidence) {
        if (confidence >= this.config.confirmThreshold)
            return "confirmed";
        if (confidence <= this.config.rejectThreshold)
            return "rejected";
        return "inconclusive";
    }
}
/** Factory function for IterativeVerifier */
export function createIterativeVerifier(config) {
    return new IterativeVerifier(config);
}
//# sourceMappingURL=iterative_verifier.js.map