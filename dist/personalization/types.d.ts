/**
 * SciClaw v3.0.0-rc.2 — Personalization Types
 *
 * User preference learning, style adaptation, topic tracking.
 */
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
    formality: number;
    technicality: number;
    conciseness: number;
}
export interface StyleStructure {
    includeAbstract: boolean;
    includeMethodology: boolean;
    includeExecutiveSummary: boolean;
    includeCodeExamples: boolean;
    includeAppendix: boolean;
    maxSections: number;
}
export interface UserPreferences {
    depth: ResearchDepth;
    style: ResearchStyle;
    format: OutputFormat;
    language: string;
    maxSources: number;
    preferRecency: boolean;
}
export declare const DEFAULT_PREFERENCES: UserPreferences;
export interface TopicInterest {
    topic: string;
    weight: number;
    lastResearched: Date;
    frequency: number;
    relatedTopics: string[];
}
export interface UserProfile {
    id: string;
    preferences: UserPreferences;
    interests: TopicInterest[];
    researchCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface PreferenceEvent {
    userId: string;
    type: PreferenceEventType;
    detail: string;
    timestamp: Date;
}
export type PreferenceEventType = "depth_change" | "style_change" | "format_change" | "topic_researched" | "explicit_feedback" | "behavior_signal";
//# sourceMappingURL=types.d.ts.map