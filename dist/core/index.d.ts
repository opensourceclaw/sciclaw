/**
 * sciclaw core (v1.0.0) — merged from the former deepclaw-core repo (2026-09-21).
 * Shared core for the SciClaw research framework.
 *
 * Copyright 2026 Peter Cheng
 * Licensed under Apache-2.0
 */
export declare const CORE_VERSION = "1.0.0";
export type { SearchOptions, SearchEngine, SearchResult, ResearchOptions, ResearchResult, ResearchSection, SourceCitation, ReportOptions, Report, ApiResponse, CacheOptions, LoggingOptions, SciClawConfig, LLMOptions, } from './types/index.js';
export { SearchOptimizer, createSearchOptimizer, SearchCoordinator, getCoordinator, BatchQueue, ConnectionPool, SearchStream, PerformanceMetrics, search, searchStream, getSearchMetrics, registerSearchSource, } from './search/index.js';
export { LLMEngine, LLMEngineOptions, ModelInfo, } from './llm/index.js';
export { OpenClawModelAdapter, ModelRouter, FallbackHandler, CostOptimizer, } from './model/index.js';
export { SearchCache, CacheAnalytics, InvalidationManager, CacheCompressor, CacheWarmer, DistributedCache, getCache, clearCache, setGlobalCache, } from './cache/index.js';
export * from './tools/index.js';
export { ClaimType, RiskLevel, CitationStyle, VerificationStatus, RiskScorer, assessRisk, FactCheckService, verifyClaim, verifySource, } from './validation/index.js';
export type { NumericClaim, Claim, DomainScore, FreshnessScore, SourceScore, AuthorityScore, RiskAssessment, Citation, VerificationResult, SourceVerificationSummary, } from './validation/index.js';
export * from './nlp/index.js';
export { extractContent } from './extractor/index.js';
export { loadConfig, defaultConfig } from './config.js';
//# sourceMappingURL=index.d.ts.map