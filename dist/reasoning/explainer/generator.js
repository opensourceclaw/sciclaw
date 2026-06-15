/**
 * Explanation Generator - Converts reasoning chains to natural language explanations
 */
function generateId() {
    return Math.random().toString(36).slice(2, 10);
}
export class ExplanationGenerator {
    generate(chain, confidence) {
        const steps = chain.steps.map((stepResult, _index) => ({
            stepNumber: stepResult.step.stepNumber,
            claim: stepResult.reasoning,
            justification: this.buildJustification(stepResult, confidence),
            confidence: stepResult.confidence,
            citations: stepResult.sources,
        }));
        const evidence = this.collectEvidence(chain, steps);
        const summary = this.buildSummary(chain, confidence, steps);
        return {
            chainId: chain.id,
            summary,
            steps,
            confidence,
            evidence,
            generatedAt: new Date(),
        };
    }
    buildJustification(stepResult, confidence) {
        const confidencePhrase = stepResult.confidence >= 0.7
            ? 'high confidence'
            : stepResult.confidence >= 0.4
                ? 'moderate confidence'
                : 'low confidence';
        if (stepResult.error) {
            return `Step failed: ${stepResult.error}`;
        }
        const parts = [
            `Analysis with ${confidencePhrase} (${Math.round(stepResult.confidence * 100)}%).`,
        ];
        if (stepResult.sources.length > 0) {
            parts.push(`Supported by ${stepResult.sources.length} source(s).`);
        }
        if (confidence.evidenceConsistency > 0.7) {
            parts.push('Evidence is consistent across sources.');
        }
        else if (confidence.evidenceConsistency < 0.3) {
            parts.push('Some evidence conflicts.');
        }
        return parts.join(' ');
    }
    collectEvidence(chain, steps) {
        const evidence = [];
        for (const step of steps) {
            for (const citation of step.citations) {
                evidence.push({
                    id: generateId(),
                    content: step.claim.slice(0, 200),
                    source: citation,
                    relevance: step.confidence,
                    supportsClaim: step.confidence >= 0.5,
                });
            }
        }
        return evidence;
    }
    buildSummary(chain, confidence, steps) {
        const totalSteps = steps.length;
        const completedSteps = steps.filter((s) => s.confidence > 0);
        const failedSteps = totalSteps - completedSteps.length;
        const confidencePhrase = confidence.overall >= 0.7
            ? 'high confidence'
            : confidence.overall >= 0.4
                ? 'moderate confidence'
                : 'low confidence';
        let summary = `Reasoning completed with ${confidencePhrase} (${Math.round(confidence.overall * 100)}%). `;
        summary += `${completedSteps.length} of ${totalSteps} step(s) completed successfully.`;
        if (failedSteps > 0) {
            summary += ` ${failedSteps} step(s) encountered issues.`;
        }
        if (chain.confidence < 0.3) {
            summary += ' The results should be treated as preliminary.';
        }
        return summary;
    }
}
//# sourceMappingURL=generator.js.map