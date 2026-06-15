/**
 * Learning module types - Feedback collection, learning pipeline, and habit tracking
 */

export enum FeedbackType {
  QUALITY = 'quality',
  ACCURACY = 'accuracy',
  RELEVANCE = 'relevance',
  COMPLETENESS = 'completeness',
  USEFULNESS = 'usefulness',
}

export interface Feedback {
  feedbackType: FeedbackType;
  rating: number; // 1-5
  topic: string;
  comment: string;
  sessionId: string;
  researchId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface LearningConfig {
  minRatingForLearning: number;
  autoLearn: boolean;
  learnFromPositive: boolean;
  learnFromNegative: boolean;
  maxRulesPerSession: number;
  ruleStorePath?: string;
}

export interface LearningResult {
  feedbackCount: number;
  patternsFound: number;
  rulesGenerated: number;
  rules: Record<string, unknown>[];
  insights: string[];
  timestamp: Date;
  success: boolean;
  errorMessage: string;
}

export interface ResearchHabit {
  userId: string;
  totalSearches: number;
  totalSessions: number;
  topKeywords: string[];
  topSources: string[];
  preferredDepth: string;
  depthDistribution: Record<string, number>;
  averageResultsPerSearch: number;
  lastActive?: Date;
  commonTopics: string[];
}

export interface FeedbackStats {
  totalFeedback: number;
  byType: Record<string, number>;
  averageRating: number;
  positiveRate: number;
  negativeRate: number;
}
