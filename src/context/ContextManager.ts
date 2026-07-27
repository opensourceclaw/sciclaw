/**
 * Licensed under the Apache License, Version 2.0
 * DeepClaw v3.9.0 — Context Manager (claw-ctx integration)
 */

import {
  ModelAwareOptimizer,
  modelProfileRegistry,
  type ModelProfile,
  type OptimizationHint,
  type OptimizationStrategy,
} from "claw-ctx";
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

export class ContextManager {
  private optimizer: ModelAwareOptimizer;
  private modelId: string;
  private maxTokens: number;

  constructor(config?: ContextManagerConfig) {
    this.modelId = config?.modelProfile?.id ?? "deepseek-v4-flash";
    this.maxTokens = config?.maxTokens ?? 100000;

    this.optimizer = new ModelAwareOptimizer(modelProfileRegistry);
  }

  async optimize(context: ResearchContext): Promise<OptimizedContext> {
    const profile = modelProfileRegistry.resolve(this.modelId);
    const strategy = profile?.optimization.strategy ?? ("hybrid" as OptimizationStrategy);
    const threshold = profile?.optimization.compressionThreshold ?? this.maxTokens;
    const effectiveRatio = profile?.context.effectiveWindowRatio ?? 0.8;
    const maxContextTokens = profile?.context.maxTokens ?? 128000;
    const preloadPriority = profile?.optimization.preloadPriority ?? ["docs", "code"];
    const cacheStaticPrefix = profile?.cache.staticPrefixBonus ?? false;
    const prefersSummary = profile?.context.prefersSummary ?? false;

    const hints: OptimizationHint[] = [{
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

  setModelProfile(profile: ModelProfile): void {
    this.modelId = profile.id;
    this.maxTokens = profile.context.maxTokens;
  }

  getModelId(): string {
    return this.modelId;
  }

  getContextWindow(): { max: number; effective: number } {
    return this.optimizer.getContextWindow(this.modelId);
  }

  getCompressionThreshold(): number {
    return this.optimizer.getCompressionThreshold(this.modelId);
  }

  private estimateTokens(context: ResearchContext): number {
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
