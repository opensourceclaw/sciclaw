/**
 * Research Habit Tracker - Tracks user research patterns over time
 *
 * Collects behavioral data across research sessions and builds
 * habit profiles for personalized research recommendations.
 */
import { ResearchHabit } from './types.js';
export declare class ResearchHabitTracker {
    private habits;
    private searchLog;
    private sourceLog;
    trackSearch(userId: string, query: string, resultsCount?: number): void;
    trackDepthChoice(userId: string, depth: string): void;
    trackSourcePreference(userId: string, source: string): void;
    trackSessionStart(userId: string): void;
    trackTopic(userId: string, topic: string): void;
    getHabitSummary(userId: string): ResearchHabit;
    getCommonTopics(userId: string, limit?: number): string[];
    getPreferredDepth(userId: string): string;
    getTopSources(userId: string): string[];
    getSearchHistory(userId: string, limit?: number): Array<{
        query: string;
        resultsCount: number;
        timestamp: string;
    }>;
    getHabitStats(userId: string): Record<string, unknown>;
    private getOrCreateHabit;
    private updateKeywords;
}
//# sourceMappingURL=research_habit_tracker.d.ts.map