/**
 * DeepClaw v3.0.0-rc.1 — Feedback Learner
 *
 * Learns from both explicit (ratings/comments) and implicit (pause/modify/refine)
 * user feedback. Extracts patterns and adjusts behavior accordingly.
 */
import type {
  UserFeedback,
  FeedbackPattern,
  FeedbackCategory,
  FeedbackType,
  FeedbackSentiment,
  ResearchHistory,
  UserAction,
} from "./types.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface FeedbackLearnerConfig {
  minRatingForLearning: number;
  minFeedbackForPattern: number;
  decayFactor: number; // older feedback weight decay
  implicitActionWeights: Record<string, number>;
}

export const DEFAULT_FEEDBACK_LEARNER_CONFIG: FeedbackLearnerConfig = {
  minRatingForLearning: 3,
  minFeedbackForPattern: 3,
  decayFactor: 0.95,
  implicitActionWeights: {
    accept: 0.1,
    reject: -0.15,
    modify: -0.1,
    refine: -0.05,
    pause: 0,
  },
};

// ── Feedback Learner ───────────────────────────────────────────────────

export class FeedbackLearner {
  private config: FeedbackLearnerConfig;
  private feedbackStore: UserFeedback[] = [];
  private patterns: Map<FeedbackCategory, FeedbackPattern> = new Map();
  private preferences: Map<string, number> = new Map(); // topic → weight

  constructor(config?: Partial<FeedbackLearnerConfig>) {
    this.config = { ...DEFAULT_FEEDBACK_LEARNER_CONFIG, ...config };
  }

  /** Process and learn from user feedback */
  async learnFromFeedback(feedback: UserFeedback[]): Promise<void> {
    for (const fb of feedback) {
      this.feedbackStore.push(fb);
      this._updatePatterns(fb);
      if (fb.context?.topic) {
        this._updatePreferences(fb);
      }
    }

    // Apply decay to old feedback
    this._applyDecay();
  }

  /** Extract implicit feedback from user actions in research history */
  extractImplicitFeedback(history: ResearchHistory): UserFeedback[] {
    const implicit: UserFeedback[] = [];

    for (const action of history.userActions) {
      const weight = this.config.implicitActionWeights[action.type];
      if (weight === undefined || weight === 0) continue;

      const sentiment: FeedbackSentiment =
        weight > 0 ? "positive" : "negative";

      implicit.push({
        id: `implicit-${history.sessionId}-${action.timestamp.getTime()}`,
        sessionId: history.sessionId,
        type: "implicit",
        sentiment,
        category: this._inferCategory(action),
        rating: sentiment === "positive" ? 4 : 2,
        context: { topic: history.topic },
        timestamp: action.timestamp,
      });
    }

    return implicit;
  }

  /** Get detected feedback patterns */
  getPatterns(): FeedbackPattern[] {
    return Array.from(this.patterns.values());
  }

  /** Get learned topic preferences */
  getPreferences(): Map<string, number> {
    return new Map(this.preferences);
  }

  /** Recommend search depth based on learned preferences */
  recommendDepth(topic: string): "shallow" | "medium" | "deep" {
    const pref = this.preferences.get(topic);
    if (pref === undefined) return "medium";
    if (pref > 0.6) return "deep";
    if (pref < 0.3) return "shallow";
    return "medium";
  }

  /** Recommend whether cross-domain analysis is desired for a topic */
  recommendCrossDomain(topic: string): boolean {
    const pref = this.preferences.get(topic);
    return pref !== undefined && pref >= 0.5;
  }

  get totalFeedback(): number {
    return this.feedbackStore.length;
  }

  // ── Private ──────────────────────────────────────────────────────────

  private _updatePatterns(fb: UserFeedback): void {
    let pattern = this.patterns.get(fb.category);
    if (!pattern) {
      pattern = {
        category: fb.category,
        frequency: 0,
        avgRating: 0,
        trend: "stable",
        recentFeedback: [],
      };
      this.patterns.set(fb.category, pattern);
    }

    pattern.frequency++;
    const total = pattern.avgRating * (pattern.frequency - 1) + fb.rating;
    pattern.avgRating = total / pattern.frequency;

    // Keep last 10 recent feedback
    pattern.recentFeedback.push(fb);
    if (pattern.recentFeedback.length > 10) {
      pattern.recentFeedback.shift();
    }

    // Detect trend from recent feedback
    pattern.trend = this._detectTrend(pattern.recentFeedback);
  }

  private _updatePreferences(fb: UserFeedback): void {
    const topic = fb.context!.topic!;
    const current = this.preferences.get(topic) ?? 0.5;
    const delta =
      fb.sentiment === "positive" ? 0.1 : fb.sentiment === "negative" ? -0.1 : 0;
    this.preferences.set(
      topic,
      Math.max(0, Math.min(1, current + delta)),
    );
  }

  private _applyDecay(): void {
    for (const pattern of this.patterns.values()) {
      pattern.frequency = Math.max(
        0,
        Math.round(pattern.frequency * this.config.decayFactor),
      );
    }
  }

  private _detectTrend(
    recent: UserFeedback[],
  ): "improving" | "stable" | "declining" {
    if (recent.length < 2) return "stable";
    const mid = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, mid);
    const secondHalf = recent.slice(mid);
    const firstAvg =
      firstHalf.reduce((s, f) => s + f.rating, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((s, f) => s + f.rating, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > 0.3) return "improving";
    if (diff < -0.3) return "declining";
    return "stable";
  }

  private _inferCategory(action: UserAction): FeedbackCategory {
    switch (action.type) {
      case "reject":
        return "accuracy";
      case "modify":
      case "refine":
        return "completeness";
      case "accept":
        return "quality";
      default:
        return "usefulness";
    }
  }
}

/** Factory function for FeedbackLearner */
export function createFeedbackLearner(
  config?: Partial<FeedbackLearnerConfig>,
): FeedbackLearner {
  return new FeedbackLearner(config);
}
