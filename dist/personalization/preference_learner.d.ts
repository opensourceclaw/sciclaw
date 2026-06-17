/**
 * DeepClaw v3.0.0-rc.2 — Preference Learner
 *
 * Learns user preferences from explicit feedback and behavioral signals.
 * Adapts depth, style, format, and other research parameters over time.
 */
import type { UserPreferences, UserProfile, PreferenceEvent } from "./types.js";
export interface PreferenceLearnerConfig {
    learningRate: number;
    minEventsForAdaptation: number;
    decayFactor: number;
}
export declare const DEFAULT_PREFERENCE_LEARNER_CONFIG: PreferenceLearnerConfig;
export declare class PreferenceLearner {
    private config;
    private events;
    private profiles;
    constructor(config?: Partial<PreferenceLearnerConfig>);
    /** Get or create a user profile */
    getProfile(userId: string): UserProfile;
    /** Record a preference event and adapt */
    recordEvent(event: PreferenceEvent): UserProfile;
    /** Record that a topic was researched (behavioral signal) */
    recordResearch(userId: string, topic: string, detail?: string): UserProfile;
    /** Explicitly set a preference */
    setPreference<K extends keyof UserPreferences>(userId: string, key: K, value: UserPreferences[K]): UserProfile;
    /** Get preference history for analysis */
    getEvents(userId?: string): PreferenceEvent[];
    private _shouldAdapt;
    private _adaptPreferences;
    private _clampDepth;
    private _bestStyle;
}
/** Factory */
export declare function createPreferenceLearner(config?: Partial<PreferenceLearnerConfig>): PreferenceLearner;
//# sourceMappingURL=preference_learner.d.ts.map