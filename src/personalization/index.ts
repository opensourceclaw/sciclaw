/**
 * DeepClaw v3.0.0-rc.2 — Personalization Layer
 *
 * User preference learning, style adaptation, and topic tracking.
 * Provides personalized research experiences through adaptive profiles.
 */
import type { UserPreferences, ResearchStyle, UserProfile, TopicInterest } from "./types.js";
import {
  PreferenceLearner,
  createPreferenceLearner,
  type PreferenceLearnerConfig,
} from "./preference_learner.js";
import {
  StyleAdapter,
  createStyleAdapter,
} from "./style_adapter.js";
import {
  TopicTracker,
  createTopicTracker,
  type TopicTrackerConfig,
} from "./topic_tracker.js";

export * from "./types.js";
export * from "./preference_learner.js";
export * from "./style_adapter.js";
export * from "./topic_tracker.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface PersonalizationConfig {
  preference?: Partial<PreferenceLearnerConfig>;
  topic?: Partial<TopicTrackerConfig>;
}

// ── Personalization Engine ─────────────────────────────────────────────

export class PersonalizationEngine {
  private preferenceLearner: PreferenceLearner;
  private styleAdapter: StyleAdapter;
  private topicTracker: TopicTracker;

  constructor(config?: PersonalizationConfig) {
    this.preferenceLearner = createPreferenceLearner(config?.preference);
    this.styleAdapter = createStyleAdapter();
    this.topicTracker = createTopicTracker(config?.topic);
  }

  /** Get or create user profile */
  getProfile(userId: string): UserProfile {
    return this.preferenceLearner.getProfile(userId);
  }

  /** Record a research session, updating preferences and topics */
  recordResearch(userId: string, topic: string): UserProfile {
    const profile = this.preferenceLearner.recordResearch(userId, topic);
    this.topicTracker.recordResearch(topic);

    // Sync topic interests into profile
    profile.interests = this.topicTracker.getInterests();

    // Apply learned style
    this.styleAdapter.applyPreferences(profile.preferences);

    return profile;
  }

  /** Set an explicit user preference */
  setPreference<K extends keyof UserPreferences>(
    userId: string,
    key: K,
    value: UserPreferences[K],
  ): UserProfile {
    return this.preferenceLearner.setPreference(userId, key, value);
  }

  /** Get style-appropriate section order */
  getSectionOrder(userId?: string): string[] {
    if (userId) {
      const profile = this.preferenceLearner.getProfile(userId);
      this.styleAdapter.applyPreferences(profile.preferences);
    }
    return this.styleAdapter.getSectionOrder();
  }

  /** Get tone guidelines for the current style */
  getToneGuidelines(userId?: string): string[] {
    if (userId) {
      const profile = this.preferenceLearner.getProfile(userId);
      this.styleAdapter.applyPreferences(profile.preferences);
    }
    return this.styleAdapter.getToneGuidelines();
  }

  /** Suggest topics the user might be interested in */
  suggestTopics(n?: number): string[] {
    return this.topicTracker.suggestTopics(n);
  }

  /** Get top interests */
  getTopInterests(n?: number): TopicInterest[] {
    return this.topicTracker.getTopInterests(n);
  }

  /** Get current style profile */
  getStyleProfile() {
    return this.styleAdapter.getProfile();
  }

  /** Get the preference learner */
  getPreferenceLearner(): PreferenceLearner {
    return this.preferenceLearner;
  }

  /** Get the style adapter */
  getStyleAdapter(): StyleAdapter {
    return this.styleAdapter;
  }

  /** Get the topic tracker */
  getTopicTracker(): TopicTracker {
    return this.topicTracker;
  }
}

/** Factory */
export function createPersonalizationEngine(
  config?: PersonalizationConfig,
): PersonalizationEngine {
  return new PersonalizationEngine(config);
}
