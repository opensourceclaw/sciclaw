import { createReasoningChainManager, } from "./chain.js";
import { createCausalAnalyzer } from "./causal.js";
export * from "./types.js";
export * from "./chain.js";
export * from "./causal.js";
// ── ReasoningEngine ────────────────────────────────────────────────────
export class ReasoningEngine {
    chainManager;
    causalAnalyzer;
    constructor(config) {
        this.chainManager = createReasoningChainManager(config?.chain);
        this.causalAnalyzer = createCausalAnalyzer(config?.causal);
    }
    createChain(topic, goal) {
        return this.chainManager.createChain(topic, goal);
    }
    infer(chain, context) {
        return this.chainManager.executeChain(chain, context);
    }
    analyzeCausal(entities) {
        return this.causalAnalyzer.analyzeCausal(entities);
    }
    inferWithCausalSupport(chain, entities, context) {
        const causalGraph = this.causalAnalyzer.analyzeCausal(entities);
        // Enhance chain with causal evidence: for each causal path found,
        // add evidence to relevant steps
        const enhancedSteps = chain.steps.map((step) => {
            const causalEvidence = [];
            for (const edge of causalGraph.edges) {
                if (step.statement.includes(edge.source) ||
                    step.statement.includes(edge.target)) {
                    causalEvidence.push(`Causal relation: ${edge.relation} (strength: ${edge.strength})`);
                }
            }
            return {
                ...step,
                evidence: [...step.evidence, ...causalEvidence.slice(0, 3)],
            };
        });
        const enhancedChain = {
            ...chain,
            steps: enhancedSteps,
        };
        const inference = this.chainManager.executeChain(enhancedChain, context);
        return { inference, causalGraph };
    }
    getChainManager() {
        return this.chainManager;
    }
    getCausalAnalyzer() {
        return this.causalAnalyzer;
    }
}
export function createReasoningEngine(config) {
    return new ReasoningEngine(config);
}
//# sourceMappingURL=index.js.map