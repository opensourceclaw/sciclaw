/**
 * DeepClaw v3.0.0-rc.3
 * Deep Research Framework — AI-powered multi-source research and synthesis
 */

export const VERSION = '3.3.0';

// Core exports
export * from './types/index.js';
export * from './search/index.js';
export * from './research/index.js';
export * from './tools/index.js';

// v2.0.0-rc.2 — Validation + Knowledge Graph
export * from './validation/index.js';
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

// v3.2.0 — OpenClaw Model Integration
export * from './model/index.js';

// v3.3.0 — Research Orchestrator (Reasoning-Driven Search)
export * from './orchestrator/index.js';
