/**
 * Shared types for the reasoning module
 */

import type { DecompositionStrategy, ReasoningChain } from './chain_of_thought/types.js';
import type { CausalGraph } from './causal_analysis/types.js';
import type { Explanation } from './explainer/types.js';
import type { VisualizationTree } from './visualization/types.js';

export interface ReasoningOptions {
  strategy?: DecompositionStrategy;
  maxDepth?: number;
  maxSteps?: number;
  confidenceThreshold?: number;
  enableCausalAnalysis?: boolean;
  enableVisualization?: boolean;
  timeoutMs?: number;
}

export interface ReasoningResult {
  chain: ReasoningChain;
  causalGraph?: CausalGraph;
  explanation?: Explanation;
  visualization?: VisualizationTree;
  metrics: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    totalDurationMs: number;
    averageConfidence: number;
  };
}

export interface ReasoningConfig {
  maxDepth: number;
  maxSteps: number;
  retryCount: number;
  timeoutMs: number;
  enableCausalAnalysis: boolean;
  enableVisualization: boolean;
}
