import { describe, it, expect } from 'vitest';
import { FeedbackCollector, collectFeedback } from '../../src/learning/feedback_collector.js';
import { FeedbackType } from '../../src/learning/types.js';

describe('FeedbackCollector', () => {
  it('should collect feedback with valid parameters', () => {
    const collector = new FeedbackCollector();
    const fb = collector.collectFeedback(FeedbackType.QUALITY, 4, 'test topic', 'Great work');
    expect(fb.feedbackType).toBe(FeedbackType.QUALITY);
    expect(fb.rating).toBe(4);
    expect(fb.topic).toBe('test topic');
    expect(fb.comment).toBe('Great work');
    expect(fb.timestamp).toBeInstanceOf(Date);
  });

  it('should throw on invalid rating', () => {
    const collector = new FeedbackCollector();
    expect(() => collector.collectFeedback(FeedbackType.QUALITY, 0)).toThrow();
    expect(() => collector.collectFeedback(FeedbackType.QUALITY, 6)).toThrow();
  });

  it('should collect feedback batch', () => {
    const collector = new FeedbackCollector();
    const results = collector.collectFeedbackBatch([
      { type: 'quality', rating: 5 },
      { type: 'accuracy', rating: 3, topic: 'test' },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.rating).toBe(5);
    expect(results[1]!.feedbackType).toBe(FeedbackType.ACCURACY);
  });

  it('should compute statistics', () => {
    const collector = new FeedbackCollector();
    collector.collectFeedback(FeedbackType.QUALITY, 5);
    collector.collectFeedback(FeedbackType.ACCURACY, 3);
    collector.collectFeedback(FeedbackType.RELEVANCE, 4);
    const stats = collector.getStatistics();
    expect(stats.totalFeedback).toBe(3);
    expect(stats.averageRating).toBe(4);
    expect(stats.positiveRate).toBeGreaterThan(0);
  });

  it('should return empty stats for no feedback', () => {
    const collector = new FeedbackCollector();
    const stats = collector.getStatistics();
    expect(stats.totalFeedback).toBe(0);
    expect(stats.averageRating).toBe(0);
  });

  it('should filter by type', () => {
    const collector = new FeedbackCollector();
    collector.collectFeedback(FeedbackType.QUALITY, 5);
    collector.collectFeedback(FeedbackType.ACCURACY, 3);
    const quality = collector.getFeedbacksByType(FeedbackType.QUALITY);
    expect(quality).toHaveLength(1);
  });

  it('should get positive feedbacks', () => {
    const collector = new FeedbackCollector();
    collector.collectFeedback(FeedbackType.QUALITY, 5);
    collector.collectFeedback(FeedbackType.ACCURACY, 2);
    const positive = collector.getPositiveFeedbacks();
    expect(positive).toHaveLength(1);
  });

  it('should get negative feedbacks', () => {
    const collector = new FeedbackCollector();
    collector.collectFeedback(FeedbackType.QUALITY, 5);
    collector.collectFeedback(FeedbackType.ACCURACY, 2);
    const negative = collector.getNegativeFeedbacks();
    expect(negative).toHaveLength(1);
  });

  it('should export feedbacks as JSON', () => {
    const collector = new FeedbackCollector();
    collector.collectFeedback(FeedbackType.QUALITY, 4);
    const exported = collector.exportFeedbacks();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].feedbackType).toBe('quality');
  });

  it('should get all feedbacks', () => {
    const collector = new FeedbackCollector();
    collector.collectFeedback(FeedbackType.QUALITY, 4);
    expect(collector.getAllFeedbacks()).toHaveLength(1);
  });
});

describe('collectFeedback (convenience)', () => {
  it('should collect feedback with defaults', () => {
    const fb = collectFeedback();
    expect(fb.feedbackType).toBe(FeedbackType.QUALITY);
    expect(fb.rating).toBe(3);
  });
});
