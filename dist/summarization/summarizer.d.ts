/**
 * Content Summarizer - LLM-based content summarization
 *
 * Provides configurable summarization with length/style options,
 * retry logic, and extractive fallback.
 */
import { SummarizationLength, SummarizationStyle, SummaryResult } from './types.js';
import type { LLMEngine } from './types.js';
export interface SummarizerConfig {
    defaultLength: SummarizationLength;
    defaultStyle: SummarizationStyle;
    maxContentLength: number;
    maxRetries: number;
    retryDelayMs: number;
    timeoutMs: number;
}
export declare class Summarizer {
    private llmEngine;
    private config;
    constructor(llmEngine: LLMEngine, config?: Partial<SummarizerConfig>);
    summarize(content: string, length?: SummarizationLength, style?: SummarizationStyle, maxRetries?: number): Promise<SummaryResult>;
    summarizeBatch(contents: string[], length?: SummarizationLength, style?: SummarizationStyle): Promise<SummaryResult[]>;
    /**
     * Extractive summarization fallback - takes first N sentences
     */
    extractiveSummarize(content: string, length: SummarizationLength): SummaryResult;
    private buildPrompt;
    private sleep;
}
//# sourceMappingURL=summarizer.d.ts.map