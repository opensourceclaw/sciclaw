/**
 * Fact Extractor - Extract structured facts and data from content
 */
import { FactsResult, LLMEngine } from './types.js';
export interface FactExtractorConfig {
    defaultCount: number;
    maxFacts: number;
    minConfidence: number;
    maxContentLength: number;
    maxRetries: number;
    timeoutMs: number;
}
export declare class FactExtractor {
    private llmEngine;
    private config;
    constructor(llmEngine: LLMEngine, config?: Partial<FactExtractorConfig>);
    extractFacts(content: string, count?: number, maxRetries?: number): Promise<FactsResult>;
    extractFactsBatch(contents: string[], count?: number): Promise<FactsResult[]>;
    toStructuredData(factsResult: FactsResult): Record<string, unknown>;
    private parseResponse;
    private fallbackParse;
    private sleep;
}
//# sourceMappingURL=facts.d.ts.map