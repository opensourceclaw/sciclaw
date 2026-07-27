/**
 * Licensed under the Apache License, Version 2.0
 * DeepClaw v3.9.0 — Context Manager (claw-ctx integration)
 */
import { type ModelProfile, type OptimizationHint } from "claw-ctx";
import type { ResearchContext } from "./ResearchContext.js";
export interface ContextManagerConfig {
    modelProfile?: ModelProfile;
    maxTokens?: number;
    enableCompaction?: boolean;
}
export interface OptimizedContext {
    context: ResearchContext;
    tokenCount: number;
    hints: OptimizationHint[];
    compactionRatio: number;
}
export declare class ContextManager {
    private optimizer;
    private modelId;
    private maxTokens;
    constructor(config?: ContextManagerConfig);
    optimize(context: ResearchContext): Promise<OptimizedContext>;
    setModelProfile(profile: ModelProfile): void;
    getModelId(): string;
    getContextWindow(): {
        max: number;
        effective: number;
    };
    getCompressionThreshold(): number;
    private estimateTokens;
}
export declare const contextManager: ContextManager;
//# sourceMappingURL=ContextManager.d.ts.map