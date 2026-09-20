/**
 * SciClaw v3.0.0 — Reasoning Engine
 *
 * Unified reasoning engine coordinating chain reasoning and causal analysis.
 */
import type {
  ReasoningChain,
  InferenceResult,
  CausalGraph,
  ReasoningConfig,
} from "./types.js";
import {
  ReasoningChainManager,
  createReasoningChainManager,
} from "./chain.js";
import { CausalAnalyzer, createCausalAnalyzer } from "./causal.js";

export * from "./types.js";
export * from "./chain.js";
export * from "./causal.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface ReasoningEngineConfig {
  chain?: Partial<ReasoningConfig>;
  causal?: Partial<ReasoningConfig>;
}

// ── ReasoningEngine ────────────────────────────────────────────────────

export class ReasoningEngine {
  private chainManager: ReasoningChainManager;
  private causalAnalyzer: CausalAnalyzer;

  constructor(config?: ReasoningEngineConfig) {
    this.chainManager = createReasoningChainManager(config?.chain);
    this.causalAnalyzer = createCausalAnalyzer(config?.causal);
  }

  createChain(topic: string, goal: string): ReasoningChain {
    return this.chainManager.createChain(topic, goal);
  }

  infer(
    chain: ReasoningChain,
    context: Record<string, unknown>,
  ): InferenceResult {
    return this.chainManager.executeChain(chain, context);
  }

  analyzeCausal(
    entities: Array<{
      name: string;
      relations: Array<{ target: string; type: string }>;
    }>,
  ): CausalGraph {
    return this.causalAnalyzer.analyzeCausal(entities);
  }

  inferWithCausalSupport(
    chain: ReasoningChain,
    entities: Array<{
      name: string;
      relations: Array<{ target: string; type: string }>;
    }>,
    context: Record<string, unknown>,
  ): { inference: InferenceResult; causalGraph: CausalGraph } {
    const causalGraph = this.causalAnalyzer.analyzeCausal(entities);

    // Enhance chain with causal evidence: for each causal path found,
    // add evidence to relevant steps
    const enhancedSteps = chain.steps.map((step) => {
      const causalEvidence: string[] = [];
      for (const edge of causalGraph.edges) {
        if (
          step.statement.includes(edge.source) ||
          step.statement.includes(edge.target)
        ) {
          causalEvidence.push(
            `Causal relation: ${edge.relation} (strength: ${edge.strength})`,
          );
        }
      }
      return {
        ...step,
        evidence: [...step.evidence, ...causalEvidence.slice(0, 3)],
      };
    });

    const enhancedChain: ReasoningChain = {
      ...chain,
      steps: enhancedSteps,
    };

    const inference = this.chainManager.executeChain(enhancedChain, context);
    return { inference, causalGraph };
  }

  getChainManager(): ReasoningChainManager {
    return this.chainManager;
  }

  getCausalAnalyzer(): CausalAnalyzer {
    return this.causalAnalyzer;
  }
}

export function createReasoningEngine(
  config?: ReasoningEngineConfig,
): ReasoningEngine {
  return new ReasoningEngine(config);
}
