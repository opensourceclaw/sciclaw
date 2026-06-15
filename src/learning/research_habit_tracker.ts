/**
 * Research Habit Tracker - Tracks user research patterns over time
 *
 * Collects behavioral data across research sessions and builds
 * habit profiles for personalized research recommendations.
 */

import { ResearchHabit } from './types.js';

export class ResearchHabitTracker {
  private habits: Map<string, ResearchHabit> = new Map();
  private searchLog: Map<string, Array<{ query: string; resultsCount: number; timestamp: string }>> = new Map();
  private sourceLog: Map<string, string[]> = new Map();

  trackSearch(userId: string, query: string, resultsCount = 0): void {
    const habit = this.getOrCreateHabit(userId);

    const entry = { query, resultsCount, timestamp: new Date().toISOString() };
    if (!this.searchLog.has(userId)) this.searchLog.set(userId, []);
    this.searchLog.get(userId)!.push(entry);

    habit.totalSearches += 1;
    habit.lastActive = new Date();

    if (habit.totalSearches > 0) {
      habit.averageResultsPerSearch =
        (habit.averageResultsPerSearch * (habit.totalSearches - 1) + resultsCount) / habit.totalSearches;
    }

    this.updateKeywords(habit, query);
  }

  trackDepthChoice(userId: string, depth: string): void {
    const habit = this.getOrCreateHabit(userId);

    habit.depthDistribution[depth] = (habit.depthDistribution[depth] ?? 0) + 1;

    const entries = Object.entries(habit.depthDistribution);
    habit.preferredDepth = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max)[0];
  }

  trackSourcePreference(userId: string, source: string): void {
    const habit = this.getOrCreateHabit(userId);

    if (!this.sourceLog.has(userId)) this.sourceLog.set(userId, []);
    this.sourceLog.get(userId)!.push(source);

    const counter = new Map<string, number>();
    for (const src of this.sourceLog.get(userId)!) {
      counter.set(src, (counter.get(src) ?? 0) + 1);
    }
    habit.topSources = [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([src]) => src);
  }

  trackSessionStart(userId: string): void {
    const habit = this.getOrCreateHabit(userId);
    habit.totalSessions += 1;
    habit.lastActive = new Date();
  }

  trackTopic(userId: string, topic: string): void {
    const habit = this.getOrCreateHabit(userId);
    const topics = [...habit.commonTopics, topic];
    const counter = new Map<string, number>();
    for (const t of topics) counter.set(t, (counter.get(t) ?? 0) + 1);
    habit.commonTopics = [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);
  }

  getHabitSummary(userId: string): ResearchHabit {
    return this.habits.get(userId) ?? {
      userId,
      totalSearches: 0,
      totalSessions: 0,
      topKeywords: [],
      topSources: [],
      preferredDepth: 'standard',
      depthDistribution: {},
      averageResultsPerSearch: 0,
      commonTopics: [],
    };
  }

  getCommonTopics(userId: string, limit = 10): string[] {
    return this.getHabitSummary(userId).commonTopics.slice(0, limit);
  }

  getPreferredDepth(userId: string): string {
    return this.getHabitSummary(userId).preferredDepth;
  }

  getTopSources(userId: string): string[] {
    return this.getHabitSummary(userId).topSources;
  }

  getSearchHistory(userId: string, limit = 20): Array<{ query: string; resultsCount: number; timestamp: string }> {
    return (this.searchLog.get(userId) ?? []).slice(-limit);
  }

  getHabitStats(userId: string): Record<string, unknown> {
    const habit = this.getHabitSummary(userId);
    const uniqueSources = new Set(this.sourceLog.get(userId) ?? []);
    const uniqueKeywords = new Set(
      (this.searchLog.get(userId) ?? [])
        .flatMap((entry) => entry.query.split(' '))
        .filter((w) => w.length > 0),
    );

    return {
      totalSearches: habit.totalSearches,
      totalSessions: habit.totalSessions,
      preferredDepth: habit.preferredDepth,
      averageResultsPerSearch: Math.round(habit.averageResultsPerSearch * 10) / 10,
      uniqueSources: uniqueSources.size,
      uniqueKeywords: uniqueKeywords.size,
      commonTopics: habit.commonTopics.slice(0, 5),
      lastActive: habit.lastActive?.toISOString() ?? null,
    };
  }

  private getOrCreateHabit(userId: string): ResearchHabit {
    if (!this.habits.has(userId)) {
      this.habits.set(userId, {
        userId,
        totalSearches: 0,
        totalSessions: 0,
        topKeywords: [],
        topSources: [],
        preferredDepth: 'standard',
        depthDistribution: {},
        averageResultsPerSearch: 0,
        commonTopics: [],
      });
    }
    return this.habits.get(userId)!;
  }

  private updateKeywords(habit: ResearchHabit, query: string): void {
    const words = query
      .split(' ')
      .map((w) => w.toLowerCase())
      .filter((w) => w.length > 2 && /^[a-z]+$/.test(w));

    habit.topKeywords.push(...words);

    const counter = new Map<string, number>();
    for (const kw of habit.topKeywords) counter.set(kw, (counter.get(kw) ?? 0) + 1);
    habit.topKeywords = [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);
  }
}
