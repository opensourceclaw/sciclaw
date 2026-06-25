import type { ReasoningStep, ReasoningChain, InferenceResult, ReasoningConfig } from "./types.js";
export declare class ReasoningChainManager {
    private config;
    constructor(config?: Partial<ReasoningConfig>);
    createChain(topic: string, goal: string): ReasoningChain;
    addStep(chain: ReasoningChain, step: Omit<ReasoningStep, "id" | "timestamp">): ReasoningChain;
    validateChain(chain: ReasoningChain): {
        valid: boolean;
        errors: string[];
    };
    executeChain(chain: ReasoningChain, context: Record<string, unknown>): InferenceResult;
    getStepCount(chain: ReasoningChain): number;
    getAverageConfidence(chain: ReasoningChain): number;
    getChainSummary(chain: ReasoningChain): string;
    exportChain(chain: ReasoningChain): ReasoningStep[];
}
export declare function createReasoningChainManager(config?: Partial<ReasoningConfig>): ReasoningChainManager;
//# sourceMappingURL=chain.d.ts.map