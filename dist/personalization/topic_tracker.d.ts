/**
 * SciClaw v3.0.0-rc.2 — Topic Tracker
 *
 * Tracks user research interests over time, maintains topic weights,
 * and provides interest-based suggestions.
 */
import type { TopicInterest } from "./types.js";
export interface TopicTrackerConfig {
    decayRate: number;
    minWeight: number;
    maxTopics: number;
    boostFactor: number;
    relatedTopicsBoost: number;
}
export declare const DEFAULT_TOPIC_TRACKER_CONFIG: TopicTrackerConfig;
export declare class TopicTracker {
    private config;
    private interests;
    constructor(config?: Partial<TopicTrackerConfig>);
    /** Record a research topic, boosting its weight */
    recordResearch(topic: string): TopicInterest;
    /** Apply time-based decay to all interests */
    applyDecay(): void;
    /** Get all tracked interests sorted by weight */
    getInterests(): TopicInterest[];
    /** Get top N interests */
    getTopInterests(n?: number): TopicInterest[];
    /** Get interest for a specific topic */
    getInterest(topic: string): TopicInterest | undefined;
    /** Suggest related topics the user hasn't researched yet */
    suggestTopics(n?: number): string[];
    /** Get interest diversity score (0-1, higher = more diverse) */
    getDiversityScore(): number;
    /** Clear all tracked interests */
    clear(): void;
    get trackedCount(): number;
    private _findRelated;
    private _boostRelated;
    private _enforceMaxTopics;
}
/** Factory */
export declare function createTopicTracker(config?: Partial<TopicTrackerConfig>): TopicTracker;
//# sourceMappingURL=topic_tracker.d.ts.map