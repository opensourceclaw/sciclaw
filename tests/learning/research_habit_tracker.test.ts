import { describe, it, expect } from 'vitest';
import { ResearchHabitTracker } from '../../src/learning/research_habit_tracker.js';

describe('ResearchHabitTracker', () => {
  it('should track search queries', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackSearch('user1', 'machine learning', 10);
    const summary = tracker.getHabitSummary('user1');
    expect(summary.totalSearches).toBe(1);
    expect(summary.averageResultsPerSearch).toBe(10);
  });

  it('should track depth choices', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackDepthChoice('user1', 'deep');
    tracker.trackDepthChoice('user1', 'deep');
    tracker.trackDepthChoice('user1', 'quick');
    const summary = tracker.getHabitSummary('user1');
    expect(summary.preferredDepth).toBe('deep');
  });

  it('should track source preferences', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackSourcePreference('user1', 'wikipedia.org');
    tracker.trackSourcePreference('user1', 'wikipedia.org');
    tracker.trackSourcePreference('user1', 'example.com');
    const sources = tracker.getTopSources('user1');
    expect(sources[0]).toBe('wikipedia.org');
  });

  it('should track session starts', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackSessionStart('user1');
    tracker.trackSessionStart('user1');
    const summary = tracker.getHabitSummary('user1');
    expect(summary.totalSessions).toBe(2);
    expect(summary.lastActive).toBeInstanceOf(Date);
  });

  it('should track topics', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackTopic('user1', 'AI');
    tracker.trackTopic('user1', 'AI');
    tracker.trackTopic('user1', 'ML');
    const topics = tracker.getCommonTopics('user1');
    expect(topics[0]).toBe('AI');
  });

  it('should return empty habit for unknown user', () => {
    const tracker = new ResearchHabitTracker();
    const summary = tracker.getHabitSummary('unknown');
    expect(summary.totalSearches).toBe(0);
    expect(summary.totalSessions).toBe(0);
  });

  it('should get preferred depth', () => {
    const tracker = new ResearchHabitTracker();
    expect(tracker.getPreferredDepth('user1')).toBe('standard');
    tracker.trackDepthChoice('user1', 'deep');
    expect(tracker.getPreferredDepth('user1')).toBe('deep');
  });

  it('should get search history', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackSearch('user1', 'test query', 5);
    const history = tracker.getSearchHistory('user1');
    expect(history).toHaveLength(1);
    expect(history[0].query).toBe('test query');
  });

  it('should get habit stats', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackSearch('user1', 'machine learning', 10);
    tracker.trackSessionStart('user1');
    const stats = tracker.getHabitStats('user1');
    expect(stats.totalSearches).toBe(1);
    expect(stats.totalSessions).toBe(1);
  });

  it('should update keywords from queries', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackSearch('user1', 'machine learning deep learning', 5);
    tracker.trackSearch('user1', 'machine learning reinforcement', 3);
    const summary = tracker.getHabitSummary('user1');
    expect(summary.topKeywords).toContain('machine');
    expect(summary.topKeywords).toContain('learning');
  });

  it('should filter short words from keywords', () => {
    const tracker = new ResearchHabitTracker();
    tracker.trackSearch('user1', 'a is it the', 0);
    const summary = tracker.getHabitSummary('user1');
    expect(summary.topKeywords).not.toContain('a');
    expect(summary.topKeywords).not.toContain('is');
  });
});
