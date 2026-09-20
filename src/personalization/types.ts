/**
 * SciClaw v3.0.0-rc.2 — Personalization Types
 *
 * User preference learning, style adaptation, topic tracking.
 */

// ── Research Style ─────────────────────────────────────────────────────

export type ResearchDepth = "shallow" | "medium" | "deep";
export type ResearchStyle = "academic" | "business" | "technical" | "quick";
export type OutputFormat = "markdown" | "pdf" | "html";

export interface StyleProfile {
  style: ResearchStyle;
  tone: StyleTone;
  structure: StyleStructure;
  citationStyle: "apa" | "mla" | "chicago" | "inline";
}

export interface StyleTone {
  formality: number; // 0-1, 1 = most formal
  technicality: number; // 0-1
  conciseness: number; // 0-1, 1 = most concise
}

export interface StyleStructure {
  includeAbstract: boolean;
  includeMethodology: boolean;
  includeExecutiveSummary: boolean;
  includeCodeExamples: boolean;
  includeAppendix: boolean;
  maxSections: number;
}

// ── Preferences ────────────────────────────────────────────────────────

export interface UserPreferences {
  depth: ResearchDepth;
  style: ResearchStyle;
  format: OutputFormat;
  language: string;
  maxSources: number;
  preferRecency: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  depth: "medium",
  style: "technical",
  format: "markdown",
  language: "en",
  maxSources: 10,
  preferRecency: true,
};

// ── Topic Interest ─────────────────────────────────────────────────────

export interface TopicInterest {
  topic: string;
  weight: number; // 0-1
  lastResearched: Date;
  frequency: number;
  relatedTopics: string[];
}

// ── User Profile ───────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  preferences: UserPreferences;
  interests: TopicInterest[];
  researchCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Preference Event ───────────────────────────────────────────────────

export interface PreferenceEvent {
  userId: string;
  type: PreferenceEventType;
  detail: string;
  timestamp: Date;
}

export type PreferenceEventType =
  | "depth_change"
  | "style_change"
  | "format_change"
  | "topic_researched"
  | "explicit_feedback"
  | "behavior_signal";
