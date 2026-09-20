/**
 * SciClaw v3.0.0-beta.3 — Synthesis Engine
 *
 * Cross-domain synthesis, iterative verification, and discovery loop.
 */
export {
  CrossDomainSynthesizer,
  createCrossDomainSynthesizer,
  DEFAULT_CROSS_DOMAIN_CONFIG,
} from "./cross_domain_synthesizer.js";
export type { CrossDomainConfig } from "./cross_domain_synthesizer.js";

export {
  IterativeVerifier,
  createIterativeVerifier,
  DEFAULT_VERIFIER_CONFIG,
} from "./iterative_verifier.js";
export type { VerifierConfig } from "./iterative_verifier.js";

export {
  DiscoveryEngine,
  createDiscoveryEngine,
  DEFAULT_DISCOVERY_CONFIG,
} from "./discovery_engine.js";
export type { DiscoveryConfig } from "./discovery_engine.js";

export type {
  CrossDomainResult,
  DomainConnection,
  CrossDomainInsight,
  VerificationLoop,
  VerificationIteration,
  DiscoveredPattern,
  ResearchGap,
  DiscoveryResult,
  DomainEvidence,
} from "./types.js";
