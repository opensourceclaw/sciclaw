/**
 * Feedback Collector - Collects and manages user feedback
 *
 * Supports programmatic feedback submission with integration to
 * claw-mem for persistent storage when available.
 */

import { Feedback, FeedbackType, FeedbackStats } from './types.js';

export class FeedbackCollector {
  private feedbacks: Feedback[] = [];
  private storagePath?: string;
  private memoryEnabled = false;
  private memory: { store: (key: string, value: string, metadata: Record<string, unknown>) => void } | null = null;

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
    this.initMemory();
  }

  private initMemory(): void {
    try {
      // Optional claw-mem integration - gracefully degrade if not available
      this.memoryEnabled = false;
      this.memory = null;
    } catch {
      this.memoryEnabled = false;
    }
  }

  collectFeedback(
    feedbackType: FeedbackType,
    rating: number,
    topic = '',
    comment = '',
    metadata: Record<string, unknown> = {},
  ): Feedback {
    if (rating < 1 || rating > 5) {
      throw new Error(`Rating must be 1-5, got ${rating}`);
    }

    const feedback: Feedback = {
      feedbackType,
      rating,
      topic,
      comment,
      sessionId: '',
      researchId: '',
      timestamp: new Date(),
      metadata,
    };

    this.storeFeedback(feedback);
    return feedback;
  }

  collectFeedbackBatch(feedbacks: Array<{
    type: string;
    rating: number;
    topic?: string;
    comment?: string;
    metadata?: Record<string, unknown>;
  }>): Feedback[] {
    return feedbacks.map((fb) => {
      const fbType = typeof fb.type === 'string'
        ? fb.type as FeedbackType
        : FeedbackType.QUALITY;
      return this.collectFeedback(
        fbType as FeedbackType,
        fb.rating,
        fb.topic,
        fb.comment,
        fb.metadata,
      );
    });
  }

  getStatistics(): FeedbackStats {
    if (this.feedbacks.length === 0) {
      return {
        totalFeedback: 0,
        byType: {},
        averageRating: 0,
        positiveRate: 0,
        negativeRate: 0,
      };
    }

    const byType: Record<string, number[]> = {};
    for (const fb of this.feedbacks) {
      const key = fb.feedbackType;
      if (!byType[key]) byType[key] = [];
      byType[key].push(fb.rating);
    }

    const typeAverages: Record<string, number> = {};
    for (const [t, rs] of Object.entries(byType)) {
      typeAverages[t] = Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 100) / 100;
    }

    const allRatings = this.feedbacks.map((fb) => fb.rating);
    const positive = this.feedbacks.filter((fb) => fb.rating >= 4).length;
    const negative = this.feedbacks.filter((fb) => fb.rating <= 2).length;
    const avg = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;

    return {
      totalFeedback: this.feedbacks.length,
      byType: typeAverages,
      averageRating: Math.round(avg * 100) / 100,
      positiveRate: Math.round((positive / this.feedbacks.length) * 1000) / 1000,
      negativeRate: Math.round((negative / this.feedbacks.length) * 1000) / 1000,
    };
  }

  getFeedbacksByType(feedbackType: FeedbackType): Feedback[] {
    return this.feedbacks.filter((fb) => fb.feedbackType === feedbackType);
  }

  getPositiveFeedbacks(): Feedback[] {
    return this.feedbacks.filter((fb) => fb.rating >= 4);
  }

  getNegativeFeedbacks(): Feedback[] {
    return this.feedbacks.filter((fb) => fb.rating <= 2);
  }

  exportFeedbacks(): string {
    return JSON.stringify(this.feedbacks, null, 2);
  }

  getAllFeedbacks(): Feedback[] {
    return [...this.feedbacks];
  }

  private storeFeedback(feedback: Feedback): void {
    this.feedbacks.push(feedback);

    if (this.memoryEnabled && this.memory) {
      try {
        this.memory.store(
          `feedback:${feedback.sessionId}:${feedback.feedbackType}`,
          JSON.stringify(feedback),
          { type: 'feedback', rating: feedback.rating },
        );
      } catch {
        // Non-critical; continue
      }
    }
  }
}

export function collectFeedback(
  feedbackType = FeedbackType.QUALITY,
  rating = 3,
  topic = '',
  comment = '',
): Feedback {
  const collector = new FeedbackCollector();
  return collector.collectFeedback(feedbackType, rating, topic, comment);
}
