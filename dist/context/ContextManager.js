/**
 * Licensed under the Apache License, Version 2.0
 * DeepClaw v3.9.0 — Context Manager (claw-ctx integration)
 */
import { ModelAwareOptimizer, modelProfileRegistry, } from "claw-ctx";
export class ContextManager {
    optimizer;
    modelId;
    maxTokens;
    constructor(config) {
        this.modelId = config?.modelProfile?.id ?? "deepseek-v4-flash";
        this.maxTokens = config?.maxTokens ?? 100000;
        this.optimizer = new ModelAwareOptimizer(modelProfileRegistry);
    }
    async optimize(context) {
        const profile = modelProfileRegistry.resolve(this.modelId);
        const strategy = profile?.optimization.strategy ?? "hybrid";
        const threshold = profile?.optimization.compressionThreshold ?? this.maxTokens;
        const effectiveRatio = profile?.context.effectiveWindowRatio ?? 0.8;
        const maxContextTokens = profile?.context.maxTokens ?? 128000;
        const preloadPriority = profile?.optimization.preloadPriority ?? ["docs", "code"];
        const cacheStaticPrefix = profile?.cache.staticPrefixBonus ?? false;
        const prefersSummary = profile?.context.prefersSummary ?? false;
        const hints = [{
                strategy,
                preloadPriority,
                cacheStaticPrefix,
                preferSummary: prefersSummary,
                compressionThreshold: threshold,
                effectiveWindowRatio: effectiveRatio,
                maxContextTokens,
                dynamicLoadingPreferred: strategy === "dynamic-load",
                stablePrefixRatio: 0.4,
            }];
        const estimatedTokens = this.estimateTokens(context);
        const compactionRatio = threshold > 0 ? Math.min(1, estimatedTokens / threshold) : 1;
        return {
            context,
            tokenCount: estimatedTokens,
            hints,
            compactionRatio,
        };
    }
    setModelProfile(profile) {
        this.modelId = profile.id;
        this.maxTokens = profile.context.maxTokens;
    }
    getModelId() {
        return this.modelId;
    }
    getContextWindow() {
        return this.optimizer.getContextWindow(this.modelId);
    }
    getCompressionThreshold() {
        return this.optimizer.getCompressionThreshold(this.modelId);
    }
    estimateTokens(context) {
        let tokens = 0;
        tokens += (context.topic?.length ?? 0) * 0.3;
        tokens += context.questions.reduce((sum, q) => sum + q.length * 0.3, 0);
        tokens += context.searchResults.length * 200;
        tokens += context.extractions.reduce((sum, e) => sum + e.content.length * 0.25, 0);
        if (context.synthesis) {
            tokens += context.synthesis.summary.length * 0.3;
            tokens += context.synthesis.conclusions.reduce((sum, c) => sum + c.length * 0.3, 0);
        }
        return Math.floor(tokens);
    }
}
export const contextManager = new ContextManager();
//# sourceMappingURL=ContextManager.js.map