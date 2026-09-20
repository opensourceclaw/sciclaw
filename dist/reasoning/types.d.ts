/**
 * SciClaw v3.0.0 — Advanced Reasoning Types
 *
 * Type definitions for reasoning chain and causal analysis.
 */
export declare enum ReasoningStepType {
    OBSERVATION = "observation",
    HYPOTHESIS = "hypothesis",
    INFERENCE = "inference",
    VALIDATION = "validation",
    CONCLUSION = "conclusion"
}
export declare enum CausalRelationType {
    CAUSES = "causes",
    PREVENTS = "prevents",
    ENABLES = "enables",
    INHIBITS = "inhibits",
    CORRELATES_WITH = "correlates_with"
}
export declare enum InferenceDirection {
    FORWARD = "forward",
    BACKWARD = "backward"
}
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
export interface ReasoningConfig {
    maxSteps: number;
    minConfidence: number;
    maxAlternatives: number;
    direction: InferenceDirection;
}
export declare const DEFAULT_REASONING_CONFIG: ReasoningConfig;
//# sourceMappingURL=types.d.ts.map