/**
 * ReasoningEngine - Main entry point for reasoning capabilities
 *
 * Integrates ChainOfThought, CausalAnalyzer, Explainer, and Visualizer
 * into a unified interface.
 */

import type { LLMEngine } from '../summarization/types.js';
import type { ReasoningOptions, ReasoningResult, ReasoningConfig } from './types.js';
import type { DecomposedStep, ReasoningChain } from './chain_of_thought/types.js';
import type { CausalGraph } from './causal_analysis/types.js';
import type { Explanation } from './explainer/types.js';
import type { VisualizationTree } from './visualization/types.js';
import { ChainOfThought, DecompositionStrategy } from './chain_of_thought/index.js';
import { CausalAnalyzer } from './causal_analysis/index.js';
import { Explainer } from './explainer/index.js';
import { Visualizer } from './visualization/index.js';

export { ChainOfThought } from './chain_of_thought/index.js';
export { CausalAnalyzer } from './causal_analysis/index.js';
export { Explainer } from './explainer/index.js';
export { Visualizer } from './visualization/index.js';
export { DecompositionStrategy, StepStatus } from './chain_of_thought/types.js';
export type { ReasoningOptions, ReasoningResult, ReasoningConfig } from './types.js';
export type { DecomposedStep, ReasoningStepResult, ReasoningChain } from './chain_of_thought/types.js';
export type { CausalVariable, CausalRelation, CausalGraph } from './causal_analysis/types.js';
export type { Explanation, ConfidenceFactors, LogEntry } from './explainer/types.js';
export type { TreeNode, VisualizationTree, ExportOptions } from './visualization/types.js';

export class ReasoningEngine {
  private chainOfThought: ChainOfThought;
  private causalAnalyzer: CausalAnalyzer;
  private explainer: Explainer;
  private visualizer: Visualizer;
  private config: ReasoningConfig;

  constructor(llmEngine?: LLMEngine, config?: Partial<ReasoningConfig>) {
    this.config = {
      maxDepth: 5,
      maxSteps: 20,
      retryCount: 3,
      timeoutMs: 30000,
      enableCausalAnalysis: true,
      enableVisualization: true,
      ...config,
    };

    this.chainOfThought = new ChainOfThought(
      llmEngine ?? (null as unknown as LLMEngine),
      {
        maxDepth: this.config.maxDepth,
        maxSteps: this.config.maxSteps,
        retryCount: this.config.retryCount,
        timeoutMs: this.config.timeoutMs,
      },
    );
    this.causalAnalyzer = new CausalAnalyzer();
    this.explainer = new Explainer();
    this.visualizer = new Visualizer();
  }

  async run(question: string, options?: ReasoningOptions): Promise<ReasoningResult> {
    const startTime = Date.now();
    const strategy = options?.strategy ?? DecompositionStrategy.BALANCED;

    // 1. Decompose
    const steps = await this.chainOfThought.decompose(question, strategy);

    // 2. Execute
    const chain = await this.chainOfThought.execute(steps);

    // 3. Optional: causal analysis
    let causalGraph: CausalGraph | undefined;
    if (options?.enableCausalAnalysis ?? this.config.enableCausalAnalysis) {
      causalGraph = this.causalAnalyzer.analyze(question);
    }

    // 4. Explain
    const explanation = this.explainer.generateExplanation(chain);

    // 5. Optional: visualize
    let visualization: VisualizationTree | undefined;
    if (options?.enableVisualization ?? this.config.enableVisualization) {
      visualization = this.visualizer.buildTree(chain, options?.maxDepth);
    }

    const totalDurationMs = Date.now() - startTime;
    const successfulSteps = chain.steps.filter((s) => s.step.status === 'completed').length;
    const failedSteps = chain.steps.filter((s) => s.step.status === 'failed').length;

    return {
      chain,
      causalGraph,
      explanation,
      visualization,
      metrics: {
        totalSteps: chain.steps.length,
        successfulSteps,
        failedSteps,
        totalDurationMs,
        averageConfidence: chain.confidence,
      },
    };
  }

  async decompose(question: string, strategy?: DecompositionStrategy): Promise<DecomposedStep[]> {
    return this.chainOfThought.decompose(question, strategy);
  }

  async analyzeCausal(text: string): Promise<CausalGraph> {
    return this.causalAnalyzer.analyze(text);
  }

  async explain(chain: ReasoningChain): Promise<Explanation> {
    return this.explainer.generateExplanation(chain);
  }

  async visualize(chain: ReasoningChain, maxDepth?: number): Promise<VisualizationTree> {
    return this.visualizer.buildTree(chain, maxDepth);
  }
}
