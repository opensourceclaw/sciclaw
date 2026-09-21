/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ResearchStrategy, type ResearchContext, type SubQuery, type ResearchSearchResult, type BlindSpot } from "../orchestrator/types.js";
import { ResearchStateMachine } from "../orchestrator/research-state-machine.js";
import type { ValidationResult } from "../stages/validate.js";
import { type FlowLLMConfig } from "./wiring.js";
import type { GateResult } from "../gate/research/types.js";
/**
 * Evidence chain (GA-A1/A4): the four research gates run over the run's real
 * data in report(), and the machine-readable block below is embedded in the
 * report so claims/citations/verdicts are user-visible and auditable.
 */
export interface EvidenceSource {
    id: string;
    title: string;
    url: string;
    domain: string;
    accessedAt: string;
    contentSha256: string;
}
export interface EvidenceClaim {
    id: string;
    text: string;
    type: string;
    citations: string[];
}
export interface EvidenceVerification {
    claimId: string;
    status: string;
    confidence: number;
    supportingSources: number;
}
export interface EvidenceGate {
    name: string;
    passed: boolean;
    score: number;
    threshold: number;
}
export interface EvidenceBlock {
    taskId: string;
    asOf: string;
    sources: EvidenceSource[];
    claims: EvidenceClaim[];
    verifications: EvidenceVerification[];
    gates: EvidenceGate[];
    blocked: boolean;
    verdictOverall: "pass" | "blocked" | "partial";
}
export type ResearchStage = "plan" | "search" | "analyze" | "synthesize" | "report";
export interface DeepResearchConfig {
    maxDepth?: number;
    timeout?: number;
    approvalRequired?: boolean;
    /** Mock mode: synthetic, explicitly labeled results — CLI `--mock` / tests only. */
    mock?: boolean;
    /** Optional LLM synthesis settings; unresolved settings fall back to extractive synthesis. */
    llm?: FlowLLMConfig;
}
export interface ResearchPlan {
    originalQuery: string;
    strategy: ResearchStrategy;
    subQueries: SubQuery[];
    estimatedDepth: number;
}
export interface SearchResultSet {
    query: string;
    results: ResearchSearchResult[];
    timestamp: number;
}
export interface AnalysisResult {
    claimsCount: number;
    confidence: number;
    blindSpots: BlindSpot[];
}
export interface SynthesisResult {
    summary: string;
    keyInsights: string[];
    openQuestions: string[];
    /** Provenance: how this synthesis was produced (GA-A2 honesty label). */
    synthesisMode?: "llm" | "extractive";
}
export interface ResearchReport {
    title: string;
    abstract: string;
    sections: Array<{
        heading: string;
        content: string;
    }>;
    references: string[];
    /** Machine-readable evidence chain (GA-A1/A4) — additive. */
    evidence?: EvidenceBlock;
    /** True when any research gate failed: conclusions must not be emitted (fail-closed). */
    blocked?: boolean;
}
export type ApprovalCallback = (step: string, details: string) => Promise<boolean>;
/**
 * Interactive deep research flow.
 * Depth-first strategy with human approval at each major step.
 */
export declare class DeepResearchFlow {
    private context;
    private searchResults;
    private onApprove;
    private config;
    private currentStage;
    private stageDurations;
    private stageStartTime;
    private paused;
    private verifications;
    private gateResultsRich;
    private lastSynthesis;
    private evidenceClaims;
    constructor(approvalCallback?: ApprovalCallback, config?: DeepResearchConfig);
    getCurrentStage(): ResearchStage;
    getProgress(): number;
    getStageDurations(): Record<string, number>;
    isPaused(): boolean;
    pause(): void;
    resume(): void;
    private assertNotPaused;
    private beginStage;
    private endStage;
    start(topic: string): Promise<ResearchContext>;
    plan(): Promise<ResearchPlan>;
    search(): Promise<SearchResultSet[]>;
    analyze(): Promise<AnalysisResult>;
    synthesize(): Promise<SynthesisResult>;
    report(): Promise<ResearchReport>;
    requestApproval(step: string, details: string): Promise<boolean>;
    private stateMachine;
    /**
     * Initialize state machine with context
     */
    /** Build the machine-readable evidence chain and run the four research gates. */
    private buildEvidence;
    /** Rich gate results of the last report() run (EvidenceBlock is the machine-readable mirror). */
    getEvidenceGateResults(): Map<string, GateResult>;
    initStateMachine(initialContext?: Record<string, unknown>): ResearchStateMachine;
    /**
     * Get current stage from state machine
     */
    getCurrentStageFromMachine(): string | null;
    /**
     * Get gate results
     */
    getGateResults(): Map<string, boolean>;
    /**
     * Run observe stage
     */
    runObserve(input: string): Promise<void>;
    /**
     * Run validate stage
     */
    runValidate(): Promise<ValidationResult>;
}
//# sourceMappingURL=deep_research_flow.d.ts.map