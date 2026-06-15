/**
 * Explainer - Facade for reasoning explanation and logging
 */
import { ReasoningLogger } from './logger.js';
import { ConfidenceEvaluator } from './confidence.js';
import { ExplanationGenerator } from './generator.js';
export { ReasoningLogger } from './logger.js';
export { ConfidenceEvaluator } from './confidence.js';
export { ExplanationGenerator } from './generator.js';
export class Explainer {
    logger;
    confidenceEvaluator;
    generator;
    constructor() {
        this.logger = new ReasoningLogger();
        this.confidenceEvaluator = new ConfidenceEvaluator();
        this.generator = new ExplanationGenerator();
    }
    evaluateConfidence(evidence, chainLength, sourceAuthority) {
        return this.confidenceEvaluator.evaluate(evidence, chainLength, sourceAuthority);
    }
    generateExplanation(chain, confidence) {
        const factors = confidence ?? this.confidenceEvaluator.evaluateFromResults(chain.steps.map((s) => ({ confidence: s.confidence, status: s.step.status })));
        return this.generator.generate(chain, factors);
    }
    getLogs() {
        return this.logger.getAll();
    }
    clearLogs() {
        this.logger.clear();
    }
}
//# sourceMappingURL=index.js.map