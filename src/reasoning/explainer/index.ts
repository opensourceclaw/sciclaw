/**
 * Explainer - Facade for reasoning explanation and logging
 */

import { ReasoningLogger } from './logger.js';
import { ConfidenceEvaluator } from './confidence.js';
import { ExplanationGenerator } from './generator.js';
import type { LogEntry, ConfidenceFactors, Explanation, EvidenceItem } from './types.js';
import type { ReasoningChain } from '../chain_of_thought/types.js';

export { ReasoningLogger } from './logger.js';
export { ConfidenceEvaluator } from './confidence.js';
export { ExplanationGenerator } from './generator.js';
export type {
  LogEntry,
  ConfidenceFactors,
  Explanation,
  ExplanationStep,
  EvidenceItem,
} from './types.js';

export class Explainer {
  public logger: ReasoningLogger;
  private confidenceEvaluator: ConfidenceEvaluator;
  private generator: ExplanationGenerator;

  constructor() {
    this.logger = new ReasoningLogger();
    this.confidenceEvaluator = new ConfidenceEvaluator();
    this.generator = new ExplanationGenerator();
  }

  evaluateConfidence(evidence: EvidenceItem[], chainLength: number, sourceAuthority?: number): ConfidenceFactors {
    return this.confidenceEvaluator.evaluate(evidence, chainLength, sourceAuthority);
  }

  generateExplanation(chain: ReasoningChain, confidence?: ConfidenceFactors): Explanation {
    const factors = confidence ?? this.confidenceEvaluator.evaluateFromResults(
      chain.steps.map((s) => ({ confidence: s.confidence, status: s.step.status })),
    );
    return this.generator.generate(chain, factors);
  }

  getLogs(): LogEntry[] {
    return this.logger.getAll();
  }

  clearLogs(): void {
    this.logger.clear();
  }
}
