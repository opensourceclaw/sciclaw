/**
 * Feedback Collector - Collects user feedback during research
 */

import type { UserFeedback, FeedbackType, FeedbackCollectorOptions } from './types.js';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const VALID_TYPES: FeedbackType[] = ['positive', 'negative', 'modify', 'supplement', 'pause'];

export class FeedbackCollector {
  private history: UserFeedback[] = [];
  private options: FeedbackCollectorOptions;

  constructor(options?: Partial<FeedbackCollectorOptions>) {
    this.options = {
      timeoutMs: 30000,
      maxHistory: 100,
      ...options,
    };
  }

  collect(type: FeedbackType, content: string, target?: string): UserFeedback {
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`Invalid feedback type: ${type}`);
    }
    if (!content || !content.trim()) {
      throw new Error('Feedback content cannot be empty');
    }

    const feedback: UserFeedback = {
      id: generateId(),
      type,
      content: content.trim(),
      target,
      source: 'user',
      timestamp: new Date(),
    };

    this.history.push(feedback);

    if (this.history.length > this.options.maxHistory) {
      this.history.shift();
    }

    return feedback;
  }

  collectBatch(inputs: Array<{ type: FeedbackType; content: string; target?: string }>): UserFeedback[] {
    return inputs.map((i) => this.collect(i.type, i.content, i.target));
  }

  getHistory(limit?: number): UserFeedback[] {
    if (limit && limit > 0) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  getByType(type: FeedbackType): UserFeedback[] {
    return this.history.filter((f) => f.type === type);
  }

  clear(): void {
    this.history = [];
  }

  stats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const f of this.history) {
      byType[f.type] = (byType[f.type] ?? 0) + 1;
    }
    return { total: this.history.length, byType };
  }
}
