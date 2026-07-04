/**
 * Research module types
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
export interface ResearchPlan {
    topic: string;
    depth: number;
    queries: string[];
    subtopics: string[];
    status: "pending" | "in_progress" | "completed" | "failed";
}
export interface ResearchSearchResult {
    title: string;
    url: string;
    snippet: string;
    score: number;
    timestamp: Date;
    source: string;
    qualityScore?: number;
    qualityLabel?: string;
}
export interface ExtractedContent {
    title: string;
    url: string;
    text: string;
    metadata?: Record<string, unknown>;
}
export interface ResearchFinding {
    query: string;
    searchResults: ResearchSearchResult[];
    extractedContent: ExtractedContent[];
    timestamp: Date;
}
export interface Finding {
    content: string;
    source: string;
    url: string;
    title: string;
    author: string;
    date: string;
    relevanceScore: number;
    qualityScore: number;
    metadata: Record<string, unknown>;
}
export interface SynthesisRequest {
    topic: string;
    findings: Finding[];
    maxSections: number;
    includeSources: boolean;
    citationStyle: "markdown" | "apa" | "mla" | "chicago";
    includeSummary: boolean;
    includeToc: boolean;
    language: "en" | "zh";
}
export interface SynthesisSection {
    title: string;
    content: string;
    sources: Finding[];
    confidence: number;
    theme: string;
    keyPoints: string[];
}
export interface SynthesisResult {
    topic: string;
    summary: string;
    sections: SynthesisSection[];
    allSources: Finding[];
    createdAt: Date;
    version: string;
    metadata: Record<string, unknown>;
    success: boolean;
    errorMessage: string;
}
export interface ResearchSection {
    title: string;
    content: string;
    sources: string[];
    confidence: number;
}
export interface ResearchReport {
    topic: string;
    sections: ResearchSection[];
    createdAt: Date;
    version: string;
    metadata: Record<string, unknown>;
}
export interface SectionCandidate {
    title: string;
    content: string;
    startPosition: number;
    endPosition: number;
    confidence: number;
    theme: string;
    keywords: string[];
    parentSection?: string;
}
export interface SectionAnalysis {
    sections: SectionCandidate[];
    themes: string[];
    structureScore: number;
    suggestedOrder: string[];
}
export interface ReportConfig {
    format: "markdown" | "html" | "json" | "pdf";
    includeToc: boolean;
    includeSummary: boolean;
    includeSources: boolean;
    citationStyle: "markdown" | "apa" | "mla" | "chicago";
    language: "en" | "zh";
    theme: "default" | "academic" | "modern";
    maxSections: number;
    maxSources: number;
}
export interface ThemeInfo {
    name: string;
    description: string;
    relatedFindings: number[];
}
export interface LLMEngine {
    chatSimple(prompt: string, systemPrompt?: string): Promise<string>;
    chat?(options: {
        messages: Array<{
            role: string;
            content: string;
        }>;
    }): Promise<{
        content: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map