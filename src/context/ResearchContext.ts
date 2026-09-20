/**
 * Licensed under the Apache License, Version 2.0
 * SciClaw v3.9.0 — Research Context Types
 */

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  source: string;
  timestamp: string;
  relevanceScore: number;
}

export interface Entity {
  name: string;
  type: string;
  mentions: string[];
}

export interface Relation {
  source: string;
  target: string;
  type: string;
  evidence: string;
}

export interface Extraction {
  id: string;
  source: string;
  content: string;
  entities: Entity[];
  relations: Relation[];
  confidence: number;
}

export interface Argument {
  claim: string;
  evidence: string[];
  counterArguments?: string[];
}

export interface Citation {
  id: string;
  source: string;
  url?: string;
  accessedAt: string;
}

export interface Synthesis {
  summary: string;
  arguments: Argument[];
  conclusions: string[];
  citations: Citation[];
}

export type ResearchStage =
  | "observe"
  | "plan"
  | "search"
  | "extract"
  | "synthesize"
  | "validate"
  | "report";

export interface ResearchContext {
  topic: string;
  questions: string[];
  searchResults: SearchResult[];
  extractions: Extraction[];
  synthesis?: Synthesis;
  stage: ResearchStage;
}
