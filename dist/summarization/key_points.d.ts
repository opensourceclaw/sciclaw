/**
 * Key Point Extractor - Extract key points and core arguments from content
 */
import { KeyPointsResult, LLMEngine } from './types.js';
export interface KeyPointExtractorConfig {
    defaultCount: number;
    maxPoints: number;
    minImportance: number;
    maxContentLength: number;
    maxRetries: number;
    timeoutMs: number;
}
export declare class KeyPointExtractor {
    private llmEngine;
    private config;
    constructor(llmEngine: LLMEngine, config?: Partial<KeyPointExtractorConfig>);
    extractKeyPoints(content: string, count?: number, maxRetries?: number): Promise<KeyPointsResult>;
    extractKeyPointsBatch(contents: string[], count?: number): Promise<KeyPointsResult[]>;
    private parseResponse;
    private fallbackParse;
    private sleep;
}
//# sourceMappingURL=key_points.d.ts.map