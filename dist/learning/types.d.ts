/**
 * SciClaw v3.0.0-rc.1 — Learning Engine Types
 *
 * Continuous Learning + Self-Improvement + Knowledge Evolution
 */
export type FeedbackType = "explicit" | "implicit";
export type FeedbackSentiment = "positive" | "negative" | "neutral";
export type FeedbackCategory = "quality" | "accuracy" | "relevance" | "completeness" | "usefulness";
export interface UserFeedback {
    id: string;
    sessionId: string;
    type: FeedbackType;
    sentiment: FeedbackSentiment;
    category: FeedbackCategory;
    rating: number;
    comment?: string;
    context?: FeedbackContext;
    timestamp: Date;
}
export interface FeedbackContext {
    researchId?: string;
    topic?: string;
    query?: string;
    stage?: ResearchStage;
}
export type ResearchStage = "search" | "analysis" | "synthesis" | "report";
export interface FeedbackPattern {
    category: FeedbackCategory;
    frequency: number;
    avgRating: number;
    trend: "improving" | "stable" | "declining";
    recentFeedback: UserFeedback[];
}
export interface ResearchHistory {
    sessionId: string;
    topic: string;
    stages: ResearchStageRecord[];
    duration: number;
    outcome: ResearchOutcome;
    userActions: UserAction[];
}
export interface ResearchStageRecord {
    stage: ResearchStage;
    startTime: Date;
    endTime: Date;
    actions: number;
    success: boolean;
}
export interface ResearchOutcome {
    reportGenerated: boolean;
    sourcesFound: number;
    userAccepted: boolean;
    userModified: boolean;
}
export interface UserAction {
    type: "pause" | "modify" | "accept" | "reject" | "refine";
    timestamp: Date;
    detail?: string;
}
export interface Strategy {
    id: string;
    name: string;
    parameters: StrategyParameters;
    score: number;
    adaptations: StrategyAdaptation[];
    createdAt: Date;
    updatedAt: Date;
}
export interface StrategyParameters {
    searchDepth: "shallow" | "medium" | "deep";
    maxSources: number;
    preferRecency: boolean;
    crossDomainEnabled: boolean;
    verificationRounds: number;
    sourceQualityThreshold: number;
}
export interface StrategyAdaptation {
    parameter: keyof StrategyParameters;
    oldValue: unknown;
    newValue: unknown;
    reason: string;
    timestamp: Date;
}
export interface Fact {
    id: string;
    statement: string;
    domain: string;
    confidence: number;
    sources: string[];
    freshness: number;
    lastVerified: Date;
    createdAt: Date;
    version: number;
}
export interface FactUpdate {
    factId: string;
    field: keyof Fact;
    oldValue: unknown;
    newValue: unknown;
    reason: string;
    timestamp: Date;
}
export interface FreshnessReport {
    totalFacts: number;
    fresh: number;
    stale: number;
    outdated: number;
    freshnessRatio: number;
}
export interface ErrorPattern {
    id: string;
    category: string;
    description: string;
    occurrences: number;
    lastSeen: Date;
    mitigation?: string;
}
export interface LearningMetrics {
    totalFeedback: number;
    strategyImprovements: number;
    knowledgeUpdates: number;
    accuracyTrend: number[];
    topErrorPatterns: ErrorPattern[];
    freshnessReport: FreshnessReport;
}
export interface LearningEngine {
    learnFromFeedback(feedback: UserFeedback[]): Promise<void>;
    optimizeStrategy(history: ResearchHistory): Promise<Strategy>;
    updateKnowledge(newFacts: Fact[]): Promise<void>;
    getLearningMetrics(): LearningMetrics;
}
//# sourceMappingURL=types.d.ts.map