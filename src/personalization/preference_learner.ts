/**
 * DeepClaw v3.0.0-rc.2 — Preference Learner
 *
 * Learns user preferences from explicit feedback and behavioral signals.
 * Adapts depth, style, format, and other research parameters over time.
 */
import type {
  UserPreferences,
  UserProfile,
  PreferenceEvent,
  ResearchDepth,
  ResearchStyle,
  OutputFormat,
} from "./types.js";
import { DEFAULT_PREFERENCES } from "./types.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface PreferenceLearnerConfig {
  learningRate: number; // adjustment step size
  minEventsForAdaptation: number;
  decayFactor: number; // older signals weight decay
}

export const DEFAULT_PREFERENCE_LEARNER_CONFIG: PreferenceLearnerConfig = {
  learningRate: 0.1,
  minEventsForAdaptation: 2,
  decayFactor: 0.95,
};

// ── Depth weights per signal ───────────────────────────────────────────

const DEPTH_SIGNALS: Record<string, number> = {
  "topic_researched-deep_topic": 0.2, // complex topic → deeper
  "topic_researched-simple_topic": -0.15,
  "depth_change-deep": 0.3,
  "depth_change-shallow": -0.3,
  "explicit_feedback-want_more_detail": 0.15,
  "explicit_feedback-want_less_detail": -0.15,
};

const STYLE_SIGNALS: Record<string, number> = {
  "behavior_signal-reads_full_paper": 0.2, // → academic
  "behavior_signal-skips_to_summary": -0.15, // → quick
  "explicit_feedback-want_code_examples": 0.2, // → technical
  "explicit_feedback-want_executive_summary": 0.15, // → business
};

// ── Preference Learner ─────────────────────────────────────────────────

export class PreferenceLearner {
  private config: PreferenceLearnerConfig;
  private events: PreferenceEvent[] = [];
  private profiles: Map<string, UserProfile> = new Map();

  constructor(config?: Partial<PreferenceLearnerConfig>) {
    this.config = { ...DEFAULT_PREFERENCE_LEARNER_CONFIG, ...config };
  }

  /** Get or create a user profile */
  getProfile(userId: string): UserProfile {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = {
        id: userId,
        preferences: { ...DEFAULT_PREFERENCES },
        interests: [],
        researchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.profiles.set(userId, profile);
    }
    return profile;
  }

  /** Record a preference event and adapt */
  recordEvent(event: PreferenceEvent): UserProfile {
    this.events.push(event);
    const profile = this.getProfile(event.userId);

    if (this._shouldAdapt(event.userId)) {
      this._adaptPreferences(profile);
    }

    return profile;
  }

  /** Record that a topic was researched (behavioral signal) */
  recordResearch(
    userId: string,
    topic: string,
    detail?: string,
  ): UserProfile {
    const profile = this.getProfile(userId);
    profile.researchCount++;

    this.recordEvent({
      userId,
      type: "topic_researched",
      detail: detail ?? topic,
      timestamp: new Date(),
    });

    return profile;
  }

  /** Explicitly set a preference */
  setPreference<K extends keyof UserPreferences>(
    userId: string,
    key: K,
    value: UserPreferences[K],
  ): UserProfile {
    const profile = this.getProfile(userId);
    profile.preferences[key] = value;
    profile.updatedAt = new Date();

    this.recordEvent({
      userId,
      type: `${key}_change` as PreferenceEvent["type"],
      detail: String(value),
      timestamp: new Date(),
    });

    return profile;
  }

  /** Get preference history for analysis */
  getEvents(userId?: string): PreferenceEvent[] {
    if (!userId) return [...this.events];
    return this.events.filter((e) => e.userId === userId);
  }

  // ── Private ──────────────────────────────────────────────────────────

  private _shouldAdapt(userId: string): boolean {
    const userEvents = this.events.filter((e) => e.userId === userId);
    return userEvents.length >= this.config.minEventsForAdaptation;
  }

  private _adaptPreferences(profile: UserProfile): void {
    const userEvents = this.events.filter((e) => e.userId === profile.id);
    const recent = userEvents.slice(-10);

    // Adapt depth
    let depthScore = 0;
    for (const e of recent) {
      const signalKey = `${e.type}-${e.detail}`;
      const signal = DEPTH_SIGNALS[signalKey] ?? 0;
      depthScore += signal * this.config.learningRate;
    }
    profile.preferences.depth = this._clampDepth(
      profile.preferences.depth,
      depthScore,
    );

    // Adapt style
    let styleScores: Partial<Record<ResearchStyle, number>> = {};
    for (const e of recent) {
      const signalKey = `${e.type}-${e.detail}`;
      const signal = STYLE_SIGNALS[signalKey] ?? 0;
      if (signal > 0) {
        // Identify target style from signal
        if (e.detail.includes("paper")) styleScores.academic = (styleScores.academic ?? 0) + signal;
        if (e.detail.includes("code") || e.detail.includes("technical"))
          styleScores.technical = (styleScores.technical ?? 0) + signal;
        if (e.detail.includes("summary") || e.detail.includes("executive"))
          styleScores.business = (styleScores.business ?? 0) + signal;
      }
    }
    const bestStyle = this._bestStyle(styleScores);
    if (bestStyle) {
      profile.preferences.style = bestStyle;
    }

    profile.updatedAt = new Date();
  }

  private _clampDepth(
    current: ResearchDepth,
    score: number,
  ): ResearchDepth {
    if (score > 0.15) return "deep";
    if (score < -0.15) return "shallow";
    // Small positive → stay medium or move toward deep
    if (score > 0.05 && current === "shallow") return "medium";
    if (score > 0.05 && current === "medium") return "deep";
    if (score < -0.05 && current === "deep") return "medium";
    if (score < -0.05 && current === "medium") return "shallow";
    return current;
  }

  private _bestStyle(
    scores: Partial<Record<ResearchStyle, number>>,
  ): ResearchStyle | null {
    let best: ResearchStyle | null = null;
    let bestScore = 0;
    for (const [style, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        best = style as ResearchStyle;
      }
    }
    return best;
  }
}

/** Factory */
export function createPreferenceLearner(
  config?: Partial<PreferenceLearnerConfig>,
): PreferenceLearner {
  return new PreferenceLearner(config);
}
