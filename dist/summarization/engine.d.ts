/**
 * Summarization Engine - Unified engine with error handling and fallbacks
 */
import { SummarizationLength, SummarizationStyle, SummaryResult, KeyPointsResult, FactsResult, LLMEngine } from './types.js';
export declare enum FallbackStrategy {
    RETRY = "retry",
    REDUCE_LENGTH = "reduce_length",
    SIMPLIFY_STYLE = "simplify_style",
    FALLBACK_PROVIDER = "fallback_provider",
    EXTRACTIVE = "extractive"
}
export interface EngineConfig {
    defaultProvider: string;
    fallbackProviders: string[];
    defaultModel?: string;
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
    defaultTimeoutMs: number;
    summaryTimeoutMs: number;
    keyPointsTimeoutMs: number;
    factsTimeoutMs: number;
    targetLatencyMs: number;
    fallbackStrategies: FallbackStrategy[];
}
export declare class PerformanceTracker {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalDurationMs: number;
    private latencies;
    record(success: boolean, durationMs: number): void;
    get successRate(): number;
    get averageLatencyMs(): number;
    get p95LatencyMs(): number;
    getStats(): Record<string, unknown>;
}
export declare class SummarizationEngine {
    private config;
    private llmEngine;
    private summarizer;
    private keyPointExtractor;
    private factExtractor;
    performance: PerformanceTracker;
    constructor(llmEngine: LLMEngine, config?: Partial<EngineConfig>);
    summarize(content: string, length?: SummarizationLength, style?: SummarizationStyle): Promise<SummaryResult>;
    extractKeyPoints(content: string, count?: number): Promise<KeyPointsResult>;
    extractFacts(content: string, count?: number): Promise<FactsResult>;
    process(content: string, options?: {
        extractSummary?: boolean;
        extractKeyPoints?: boolean;
        extractFacts?: boolean;
        summaryLength?: SummarizationLength;
        summaryStyle?: SummarizationStyle;
        keyPointsCount?: number;
        factsCount?: number;
    }): Promise<Record<string, unknown>>;
    getPerformanceStats(): Record<string, unknown>;
    private fallbackSummarize;
    private fallbackKeyPoints;
    private fallbackFacts;
}
//# sourceMappingURL=engine.d.ts.map