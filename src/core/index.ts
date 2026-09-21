/**
 * sciclaw core (v1.0.0) — merged from the former deepclaw-core repo (2026-09-21).
 * Shared core for the SciClaw research framework.
 *
 * Copyright 2026 Peter Cheng
 * Licensed under Apache-2.0
 */

export const CORE_VERSION = '1.0.0';

// Types - 共享类型定义
export type {
  SearchOptions,
  SearchEngine,
  SearchResult,
  ResearchOptions,
  ResearchResult,
  ResearchSection,
  SourceCitation,
  ReportOptions,
  Report,
  ApiResponse,
  CacheOptions,
  LoggingOptions,
  SciClawConfig,
  LLMOptions,
} from './types/index.js';

// Search - 通用搜索引擎
export {
  SearchOptimizer,
  createSearchOptimizer,
  SearchCoordinator,
  getCoordinator,
  BatchQueue,
  ConnectionPool,
  SearchStream,
  PerformanceMetrics,
  search,
  searchStream,
  getSearchMetrics,
  registerSearchSource,
} from './search/index.js';

// LLM - LLM 调用层
export {
  LLMEngine,
  LLMEngineOptions,
  ModelInfo,
} from './llm/index.js';

// Model - 模型路由
export {
  OpenClawModelAdapter,
  ModelRouter,
  FallbackHandler,
  CostOptimizer,
} from './model/index.js';

// Cache - 缓存层
export {
  SearchCache,
  CacheAnalytics,
  InvalidationManager,
  CacheCompressor,
  CacheWarmer,
  DistributedCache,
  getCache,
  clearCache,
  setGlobalCache,
} from './cache/index.js';

// Tools - 通用工具
export * from './tools/index.js';

// Validation - 验证框架
export {
  ClaimType,
  RiskLevel,
  CitationStyle,
  VerificationStatus,
  RiskScorer,
  assessRisk,
  FactCheckService,
  verifyClaim,
  verifySource,
  ClaimExtractor,
  extractClaims,
} from './validation/index.js';
export type {
  NumericClaim,
  Claim,
  DomainScore,
  FreshnessScore,
  SourceScore,
  AuthorityScore,
  RiskAssessment,
  Citation,
  VerificationResult,
  SourceVerificationSummary,
} from './validation/index.js';

// NLP - NLP 基础
export * from './nlp/index.js';

// Extractor - 内容提取
export { extractContent } from './extractor/index.js';

// Config - 配置管理
export { loadConfig, defaultConfig } from './config.js';
