/**
 * Core type definitions for DeepClaw
 */

// Search types
export interface SearchOptions {
  query: string;
  engines?: SearchEngine[];
  maxResults?: number;
  timeout?: number;
  useCache?: boolean;
}

export type SearchEngine = 'duckduckgo' | 'google' | 'bing';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: SearchEngine;
  rank?: number;
}

// Research types
export interface ResearchOptions {
  topic: string;
  depth?: 'shallow' | 'medium' | 'deep';
  sources?: string[];
  outputFormat?: 'markdown' | 'html' | 'pdf';
}

export interface ResearchResult {
  id: string;
  topic: string;
  summary: string;
  sections: ResearchSection[];
  sources: SourceCitation[];
  createdAt: Date;
}

export interface ResearchSection {
  title: string;
  content: string;
  sources: SourceCitation[];
}

export interface SourceCitation {
  title: string;
  url: string;
  accessedAt: Date;
}

// Report types
export interface ReportOptions {
  format?: 'markdown' | 'html' | 'pdf';
  outputPath?: string;
  includeMetadata?: boolean;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'pdf';
  createdAt: Date;
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// LLM types
export interface LLMProvider {
  name: string;
  complete(prompt: string, options?: LLMOptions): Promise<string>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Cache types
export interface CacheOptions {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

// Logging types
export interface LoggingOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
}

// Config types
export interface DeepClawConfig {
  defaultEngine: SearchEngine;
  maxResults: number;
  timeout: number;
  outputFormat: 'markdown' | 'html' | 'pdf';
  llm?: {
    provider: string;
    model?: string;
    apiKey?: string;
  };
  api?: {
    port: number;
    host: string;
  };
  cache?: CacheOptions;
  logging?: LoggingOptions;
}
