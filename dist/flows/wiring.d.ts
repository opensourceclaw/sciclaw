/**
 * SciClaw v4.0.0 — flow wiring helpers (GA-A2).
 *
 * Shared real-path wiring for DeepResearchFlow / AutoResearchFlow: search runs
 * through core/search (real engines; offline tests inject fixture sources via
 * `registerSearchSource`), synthesis uses the core LLM when configured and an
 * honest extractive fallback otherwise. Synthetic data only in explicit mock
 * mode (CLI `--mock`) — never silently (GA-A2 red line: failures are explicit).
 */
import type { SubQuery, ResearchSearchResult } from "../orchestrator/types.js";
export interface FlowLLMConfig {
    provider?: string;
    apiKey?: string;
    model?: string;
}
export interface FlowSynthesis {
    summary: string;
    keyInsights: string[];
    openQuestions: string[];
    synthesisMode: "llm" | "extractive";
}
export interface FlowSearchSet {
    query: string;
    results: ResearchSearchResult[];
    timestamp: number;
}
/**
 * Synthetic mock results — explicitly labeled (`source: "mock"`, reserved
 * `.invalid` URLs) and only produced when mock mode is on.
 */
export declare function mockSearchResults(query: string, limit?: number): ResearchSearchResult[];
/** Run each sub-query through core/search (or mock mode) and map to research results. */
export declare function searchSubQueries(subQueries: SubQuery[], opts: {
    maxQueries: number;
    maxResults: number;
    mock?: boolean;
}): Promise<FlowSearchSet[]>;
/** Resolve LLM settings from explicit config or environment; null = LLM unavailable. */
export declare function resolveLLMConfig(config?: FlowLLMConfig): FlowLLMConfig | null;
/** Deterministic, source-derived synthesis — used when no LLM is configured. */
export declare function extractiveSynthesis(query: string, results: ResearchSearchResult[]): Omit<FlowSynthesis, "synthesisMode">;
/**
 * Synthesize from real results: core LLM when configured (errors propagate —
 * no silent downgrade), deterministic extractive synthesis otherwise.
 */
export declare function synthesizeResults(query: string, results: ResearchSearchResult[], llmConfig?: FlowLLMConfig): Promise<FlowSynthesis>;
//# sourceMappingURL=wiring.d.ts.map