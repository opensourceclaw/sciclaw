/**
 * SciClaw v3.0.0 — Interactive Research Types
 */

// ── Enums ────────────────────────────────────────────────────────────────

export enum InteractionMode {
  GUIDED = "guided",
  EXPLORATORY = "exploratory",
  COLLABORATIVE = "collaborative",
}

export enum QueryType {
  CLARIFICATION = "clarification",
  DIRECTION = "direction",
  DEPTH = "depth",
  VALIDATION = "validation",
  PREFERENCE = "preference",
}

export enum FeedbackAction {
  ACCEPT = "accept",
  REJECT = "reject",
  MODIFY = "modify",
  REFINE = "refine",
  SKIP = "skip",
  REDIRECT = "redirect",
}

export enum SessionStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  WAITING_USER = "waiting_user",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

// ── Session ──────────────────────────────────────────────────────────────

export interface InteractionSession {
  id: string;
  topic: string;
  userId: string;
  mode: InteractionMode;
  status: SessionStatus;
  history: InteractionTurn[];
  context: SessionContext;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface InteractionTurn {
  id: string;
  turnNumber: number;
  systemMessage?: SystemMessage;
  userInput?: UserInput;
  timestamp: Date;
  latencyMs: number;
}

export interface SystemMessage {
  id: string;
  type: "question" | "suggestion" | "progress" | "result" | "error";
  content: string;
  options?: string[];
  requiresResponse: boolean;
}

export interface UserInput {
  id: string;
  action: FeedbackAction;
  content: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionContext {
  topic: string;
  depth: number;
  focus: string[];
  exploredTopics: string[];
  excludedTopics: string[];
  preferences: UserPreference[];
  confidence: number;
}

export interface UserPreference {
  key: string;
  value: string | number | boolean;
  source: "explicit" | "inferred";
  confidence: number;
}

// ── Queries ──────────────────────────────────────────────────────────────

export interface AdaptiveQuery {
  id: string;
  type: QueryType;
  question: string;
  context: string;
  priority: number;
  options?: string[];
  expectedResponseType: "text" | "choice" | "boolean" | "rating";
  generatedAt: Date;
}

export interface QueryResponse {
  queryId: string;
  answer: string;
  action?: FeedbackAction;
  timestamp: Date;
}

// ── Research Update ──────────────────────────────────────────────────────

export interface ResearchUpdate {
  sessionId: string;
  phase: "query" | "response" | "analysis" | "direction_change";
  summary: string;
  newQueries?: AdaptiveQuery[];
  updatedContext?: Partial<SessionContext>;
  suggestions: string[];
}

// ── Feedback ─────────────────────────────────────────────────────────────

export interface FeedbackResult {
  inputId: string;
  sessionId: string;
  action: FeedbackAction;
  sentiment: "positive" | "negative" | "neutral";
  extractedPreferences: UserPreference[];
  contextChanges: Partial<SessionContext>;
  suggestions: string[];
  processedAt: Date;
}

// ── Config ────────────────────────────────────────────────────────────────

export interface InteractiveConfig {
  mode: InteractionMode;
  sessionTimeoutMs: number;
  maxTurns: number;
  adaptiveQueryMaxPerTurn: number;
  feedbackProcessingDelayMs: number;
  queryGenerationTimeoutMs: number;
}

export const DEFAULT_INTERACTIVE_CONFIG: InteractiveConfig = {
  mode: InteractionMode.COLLABORATIVE,
  sessionTimeoutMs: 1800000,
  maxTurns: 50,
  adaptiveQueryMaxPerTurn: 3,
  feedbackProcessingDelayMs: 100,
  queryGenerationTimeoutMs: 500,
};
