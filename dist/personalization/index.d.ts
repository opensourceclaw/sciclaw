/**
 * SciClaw v3.0.0-rc.2 — Personalization Layer
 *
 * User preference learning, style adaptation, and topic tracking.
 * Provides personalized research experiences through adaptive profiles.
 */
import type { UserPreferences, UserProfile, TopicInterest } from "./types.js";
import { PreferenceLearner, type PreferenceLearnerConfig } from "./preference_learner.js";
import { StyleAdapter } from "./style_adapter.js";
import { TopicTracker, type TopicTrackerConfig } from "./topic_tracker.js";
export * from "./types.js";
export * from "./preference_learner.js";
export * from "./style_adapter.js";
export * from "./topic_tracker.js";
export interface PersonalizationConfig {
    preference?: Partial<PreferenceLearnerConfig>;
    topic?: Partial<TopicTrackerConfig>;
}
export declare class PersonalizationEngine {
    private preferenceLearner;
    private styleAdapter;
    private topicTracker;
    constructor(config?: PersonalizationConfig);
    /** Get or create user profile */
    getProfile(userId: string): UserProfile;
    /** Record a research session, updating preferences and topics */
    recordResearch(userId: string, topic: string): UserProfile;
    /** Set an explicit user preference */
    setPreference<K extends keyof UserPreferences>(userId: string, key: K, value: UserPreferences[K]): UserProfile;
    /** Get style-appropriate section order */
    getSectionOrder(userId?: string): string[];
    /** Get tone guidelines for the current style */
    getToneGuidelines(userId?: string): string[];
    /** Suggest topics the user might be interested in */
    suggestTopics(n?: number): string[];
    /** Get top interests */
    getTopInterests(n?: number): TopicInterest[];
    /** Get current style profile */
    getStyleProfile(): import("./types.js").StyleProfile;
    /** Get the preference learner */
    getPreferenceLearner(): PreferenceLearner;
    /** Get the style adapter */
    getStyleAdapter(): StyleAdapter;
    /** Get the topic tracker */
    getTopicTracker(): TopicTracker;
}
/** Factory */
export declare function createPersonalizationEngine(config?: PersonalizationConfig): PersonalizationEngine;
//# sourceMappingURL=index.d.ts.map