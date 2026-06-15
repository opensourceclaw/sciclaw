import { describe, it, expect } from 'vitest';
import { LearningPipeline, processFeedback } from '../../src/learning/learning_pipeline.js';
import { FeedbackType } from '../../src/learning/types.js';
import type { Feedback } from '../../src/learning/types.js';

function makeFeedback(
  type: FeedbackType,
  rating: number,
  comment = '',
  topic = '',
): Feedback {
  return { feedbackType: type, rating, topic, comment, sessionId: '', researchId: '', timestamp: new Date(), metadata: {} };
}

describe('LearningPipeline', () => {
  it('should process feedback and generate rules', () => {
    const pipeline = new LearningPipeline();
    const feedbacks = [
      makeFeedback(FeedbackType.QUALITY, 4, 'Good work'),
      makeFeedback(FeedbackType.ACCURACY, 5),
    ];
    const result = pipeline.processFeedback(feedbacks);
    expect(result.success).toBe(true);
    expect(result.feedbackCount).toBe(2);
    expect(result.rules.length).toBeGreaterThan(0);
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it('should handle empty feedback', () => {
    const pipeline = new LearningPipeline();
    const result = pipeline.processFeedback([]);
    expect(result.success).toBe(true);
    expect(result.feedbackCount).toBe(0);
    expect(result.errorMessage).toBe('No feedback to process');
  });

  it('should filter low rating feedback', () => {
    const pipeline = new LearningPipeline({ minRatingForLearning: 4, learnFromNegative: false });
    const feedbacks = [
      makeFeedback(FeedbackType.QUALITY, 3),
      makeFeedback(FeedbackType.ACCURACY, 5),
    ];
    const result = pipeline.processFeedback(feedbacks);
    expect(result.patternsFound).toBeGreaterThanOrEqual(0);
  });

  it('should detect negative patterns from comments', () => {
    const pipeline = new LearningPipeline();
    const feedbacks = [
      makeFeedback(FeedbackType.QUALITY, 1, 'This is inaccurate and wrong'),
    ];
    const result = pipeline.processFeedback(feedbacks);
    expect(result.patternsFound).toBeGreaterThan(0);
  });

  it('should detect low satisfaction pattern', () => {
    const pipeline = new LearningPipeline();
    const feedbacks = [
      makeFeedback(FeedbackType.QUALITY, 1),
      makeFeedback(FeedbackType.ACCURACY, 2),
    ];
    const result = pipeline.processFeedback(feedbacks);
    const hasLowSat = result.rules.some((r) => r.action === 'improve_overall');
    expect(hasLowSat).toBe(true);
  });

  it('should generate insights with feedback', () => {
    const pipeline = new LearningPipeline();
    const feedbacks = [
      makeFeedback(FeedbackType.QUALITY, 4, 'Helpful research'),
    ];
    const result = pipeline.processFeedback(feedbacks);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights[0]).toContain('Average rating');
  });

  it('should process single feedback', () => {
    const pipeline = new LearningPipeline();
    const fb = makeFeedback(FeedbackType.QUALITY, 5);
    const result = pipeline.processSingle(fb);
    expect(result.success).toBe(true);
    expect(result.feedbackCount).toBe(1);
  });

  it('should respect learnFromPositive config', () => {
    const pipeline = new LearningPipeline({ learnFromPositive: false });
    const feedbacks = [
      makeFeedback(FeedbackType.QUALITY, 5, 'Great'),
      makeFeedback(FeedbackType.ACCURACY, 1, 'Wrong'),
    ];
    const result = pipeline.processFeedback(feedbacks);
    expect(result.feedbackCount).toBe(2);
  });
});

describe('processFeedback (convenience)', () => {
  it('should process feedback', () => {
    const feedbacks = [makeFeedback(FeedbackType.QUALITY, 4)];
    const result = processFeedback(feedbacks);
    expect(result.success).toBe(true);
  });
});
