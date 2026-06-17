/**
 * DeepClaw v3.0.0 — Advanced Reasoning Types
 *
 * Type definitions for reasoning chain and causal analysis.
 */

// ── Enums ────────────────────────────────────────────────────────────────

export enum ReasoningStepType {
  OBSERVATION = "observation",
  HYPOTHESIS = "hypothesis",
  INFERENCE = "inference",
  VALIDATION = "validation",
  CONCLUSION = "conclusion",
}

export enum CausalRelationType {
  CAUSES = "causes",
  PREVENTS = "prevents",
  ENABLES = "enables",
  INHIBITS = "inhibits",
  CORRELATES_WITH = "correlates_with",
}

export enum InferenceDirection {
  FORWARD = "forward",
  BACKWARD = "backward",
}

// ── Reasoning Chain ──────────────────────────────────────────────────────

export interface ReasoningStep {
  id: string;
  type: ReasoningStepType;
  statement: string;
  evidence: string[];
  confidence: number;
  dependsOn: string[];
  alternatives: string[];
  timestamp: Date;
}

export interface ReasoningChain {
  id: string;
  topic: string;
  goal: string;
  steps: ReasoningStep[];
  maxSteps: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InferenceResult {
  chainId: string;
  conclusion: string;
  confidence: number;
  steps: ReasoningStep[];
  durationMs: number;
  alternativeConclusions: string[];
}

// ── Causal Analysis ──────────────────────────────────────────────────────

export interface CausalNode {
  id: string;
  entity: string;
  type: "cause" | "effect" | "mediator" | "confounder";
}

export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  relation: CausalRelationType;
  strength: number;
  evidence: string[];
}

export interface CausalGraph {
  id: string;
  nodes: CausalNode[];
  edges: CausalEdge[];
  rootCauses: string[];
  leafEffects: string[];
}

export interface CausalPath {
  nodes: string[];
  totalStrength: number;
  length: number;
}

// ── Config ────────────────────────────────────────────────────────────────

export interface ReasoningConfig {
  maxSteps: number;
  minConfidence: number;
  maxAlternatives: number;
  direction: InferenceDirection;
}

export const DEFAULT_REASONING_CONFIG: ReasoningConfig = {
  maxSteps: 7,
  minConfidence: 0.3,
  maxAlternatives: 3,
  direction: InferenceDirection.FORWARD,
};
