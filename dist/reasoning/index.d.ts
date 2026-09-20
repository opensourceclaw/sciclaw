/**
 * SciClaw v3.0.0 — Reasoning Engine
 *
 * Unified reasoning engine coordinating chain reasoning and causal analysis.
 */
import type { ReasoningChain, InferenceResult, CausalGraph, ReasoningConfig } from "./types.js";
import { ReasoningChainManager } from "./chain.js";
import { CausalAnalyzer } from "./causal.js";
export * from "./types.js";
export * from "./chain.js";
export * from "./causal.js";
export interface ReasoningEngineConfig {
    chain?: Partial<ReasoningConfig>;
    causal?: Partial<ReasoningConfig>;
}
export declare class ReasoningEngine {
    private chainManager;
    private causalAnalyzer;
    constructor(config?: ReasoningEngineConfig);
    createChain(topic: string, goal: string): ReasoningChain;
    infer(chain: ReasoningChain, context: Record<string, unknown>): InferenceResult;
    analyzeCausal(entities: Array<{
        name: string;
        relations: Array<{
            target: string;
            type: string;
        }>;
    }>): CausalGraph;
    inferWithCausalSupport(chain: ReasoningChain, entities: Array<{
        name: string;
        relations: Array<{
            target: string;
            type: string;
        }>;
    }>, context: Record<string, unknown>): {
        inference: InferenceResult;
        causalGraph: CausalGraph;
    };
    getChainManager(): ReasoningChainManager;
    getCausalAnalyzer(): CausalAnalyzer;
}
export declare function createReasoningEngine(config?: ReasoningEngineConfig): ReasoningEngine;
//# sourceMappingURL=index.d.ts.map