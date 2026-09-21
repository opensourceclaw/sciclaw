/**
 * SciClaw v3.7.0
 * Deep Research Framework — AI-powered multi-source research and synthesis
 */
export const VERSION = '3.7.0';
// Core module exports (src/core, merged 2026-09-21)
export * from './core/index.js';
// Deep Research specific modules
export * from './research/index.js';
// v2.0.0-rc.2 — Validation + Knowledge Graph
// Validation moved to the core module
export * from './knowledge/index.js';
// v2.0.0-rc.3 — Multi-Agent System + Benchmark
export * from './agents/index.js';
export * from './benchmark/index.js';
// v3.0.0-beta.3 — Synthesis Engine
export * from './synthesis/index.js';
// v3.0.0-rc.1 — Learning Engine
export * from './learning/index.js';
// v3.0.0-rc.2 — Personalization Layer
export * from './personalization/index.js';
// v3.3.0 — Research Orchestrator (Reasoning-Driven Search)
export * from './orchestrator/index.js';
// v3.9.0 — Context + Observability Integration
export { ContextManager, contextManager } from './context/index.js';
export { ResearchMetricsCollector, researchMetricsCollector } from './observe/index.js';
//# sourceMappingURL=index.js.map