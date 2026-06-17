/**
 * DeepClaw v3.0.0-rc.1 — Learning Engine
 *
 * Unified learning engine implementing the LearningEngine interface.
 * Coordinates feedback learning, strategy optimization, and knowledge evolution.
 */
import type {
  LearningEngine,
  UserFeedback,
  ResearchHistory,
  Strategy,
  Fact,
  LearningMetrics,
} from "./types.js";
import {
  FeedbackLearner,
  createFeedbackLearner,
  type FeedbackLearnerConfig,
} from "./feedback_learner.js";
import {
  SelfImprover,
  createSelfImprover,
  type SelfImproverConfig,
} from "./self_improver.js";
import {
  KnowledgeEvolution,
  createKnowledgeEvolution,
  type KnowledgeEvolutionConfig,
} from "./knowledge_evolution.js";

export * from "./types.js";
export * from "./feedback_learner.js";
export * from "./self_improver.js";
export * from "./knowledge_evolution.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface DeepClawLearningConfig {
  feedback?: Partial<FeedbackLearnerConfig>;
  selfImprove?: Partial<SelfImproverConfig>;
  knowledge?: Partial<KnowledgeEvolutionConfig>;
}

// ── DeepClaw Learning Engine ───────────────────────────────────────────

export class DeepClawLearningEngine implements LearningEngine {
  private feedbackLearner: FeedbackLearner;
  private selfImprover: SelfImprover;
  private knowledgeEvolution: KnowledgeEvolution;

  constructor(config?: DeepClawLearningConfig) {
    this.feedbackLearner = createFeedbackLearner(config?.feedback);
    this.selfImprover = createSelfImprover(config?.selfImprove);
    this.knowledgeEvolution = createKnowledgeEvolution(config?.knowledge);
  }

  async learnFromFeedback(feedback: UserFeedback[]): Promise<void> {
    await this.feedbackLearner.learnFromFeedback(feedback);
  }

  async optimizeStrategy(history: ResearchHistory): Promise<Strategy> {
    // Extract implicit feedback first
    const implicit = this.feedbackLearner.extractImplicitFeedback(history);
    if (implicit.length > 0) {
      await this.feedbackLearner.learnFromFeedback(implicit);
    }
    return this.selfImprover.optimizeStrategy(history);
  }

  async updateKnowledge(newFacts: Fact[]): Promise<void> {
    await this.knowledgeEvolution.updateKnowledge(newFacts);
  }

  getLearningMetrics(): LearningMetrics {
    return {
      totalFeedback: this.feedbackLearner.totalFeedback,
      strategyImprovements: this.selfImprover.strategyImprovements,
      knowledgeUpdates: this.knowledgeEvolution.knowledgeUpdates,
      accuracyTrend: this.selfImprover.getAccuracyTrend(),
      topErrorPatterns: this.selfImprover.getErrorPatterns(),
      freshnessReport: this.knowledgeEvolution.getFreshnessReport(),
    };
  }

  /** Get the feedback learner for direct access */
  getFeedbackLearner(): FeedbackLearner {
    return this.feedbackLearner;
  }

  /** Get the self improver for direct access */
  getSelfImprover(): SelfImprover {
    return this.selfImprover;
  }

  /** Get the knowledge evolution manager for direct access */
  getKnowledgeEvolution(): KnowledgeEvolution {
    return this.knowledgeEvolution;
  }
}

/** Factory function for the learning engine */
export function createLearningEngine(
  config?: DeepClawLearningConfig,
): DeepClawLearningEngine {
  return new DeepClawLearningEngine(config);
}
