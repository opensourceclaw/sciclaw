/**
 * ReasoningEngine - Main entry point for reasoning capabilities
 *
 * Integrates ChainOfThought, CausalAnalyzer, Explainer, and Visualizer
 * into a unified interface.
 */
import { ChainOfThought, DecompositionStrategy } from './chain_of_thought/index.js';
import { CausalAnalyzer } from './causal_analysis/index.js';
import { Explainer } from './explainer/index.js';
import { Visualizer } from './visualization/index.js';
export { ChainOfThought } from './chain_of_thought/index.js';
export { CausalAnalyzer } from './causal_analysis/index.js';
export { Explainer } from './explainer/index.js';
export { Visualizer } from './visualization/index.js';
export { DecompositionStrategy, StepStatus } from './chain_of_thought/types.js';
export class ReasoningEngine {
    chainOfThought;
    causalAnalyzer;
    explainer;
    visualizer;
    config;
    constructor(llmEngine, config) {
        this.config = {
            maxDepth: 5,
            maxSteps: 20,
            retryCount: 3,
            timeoutMs: 30000,
            enableCausalAnalysis: true,
            enableVisualization: true,
            ...config,
        };
        this.chainOfThought = new ChainOfThought(llmEngine ?? null, {
            maxDepth: this.config.maxDepth,
            maxSteps: this.config.maxSteps,
            retryCount: this.config.retryCount,
            timeoutMs: this.config.timeoutMs,
        });
        this.causalAnalyzer = new CausalAnalyzer();
        this.explainer = new Explainer();
        this.visualizer = new Visualizer();
    }
    async run(question, options) {
        const startTime = Date.now();
        const strategy = options?.strategy ?? DecompositionStrategy.BALANCED;
        // 1. Decompose
        const steps = await this.chainOfThought.decompose(question, strategy);
        // 2. Execute
        const chain = await this.chainOfThought.execute(steps);
        // 3. Optional: causal analysis
        let causalGraph;
        if (options?.enableCausalAnalysis ?? this.config.enableCausalAnalysis) {
            causalGraph = this.causalAnalyzer.analyze(question);
        }
        // 4. Explain
        const explanation = this.explainer.generateExplanation(chain);
        // 5. Optional: visualize
        let visualization;
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
    async decompose(question, strategy) {
        return this.chainOfThought.decompose(question, strategy);
    }
    async analyzeCausal(text) {
        return this.causalAnalyzer.analyze(text);
    }
    async explain(chain) {
        return this.explainer.generateExplanation(chain);
    }
    async visualize(chain, maxDepth) {
        return this.visualizer.buildTree(chain, maxDepth);
    }
}
//# sourceMappingURL=index.js.map