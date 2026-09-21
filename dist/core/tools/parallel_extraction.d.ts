/**
 * Parallel Content Extraction Module
 *
 * Provides parallel extraction with thread/concurrent processing.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import { ExtractedContent } from './content_extraction.js';
/**
 * A content extraction task
 */
export interface ExtractionTask {
    url: string;
    index: number;
    timeout: number;
}
/**
 * Result of extraction task
 */
export interface ParallelExtractionResult {
    url: string;
    index: number;
    success: boolean;
    content?: ExtractedContent;
    error?: string;
    duration: number;
}
/**
 * Parallel content extractor
 */
export declare class ParallelExtractor {
    private maxWorkers;
    private timeout;
    private retryCount;
    constructor(maxWorkers?: number, timeout?: number, retryCount?: number);
    /**
     * Extract content from multiple URLs in parallel
     */
    extractUrls(urls: string[], progressCallback?: (completed: number, total: number) => void): Promise<ParallelExtractionResult[]>;
    /**
     * Extract content from a single URL
     */
    private extractSingle;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Extract content sequentially (for comparison/debugging)
     */
    extractUrlsSequential(urls: string[], progressCallback?: (completed: number, total: number) => void): Promise<ParallelExtractionResult[]>;
}
/**
 * Extract content from multiple URLs in parallel
 */
export declare function extractParallel(urls: string[], maxWorkers?: number, timeout?: number, progressCallback?: (completed: number, total: number) => void): Promise<ParallelExtractionResult[]>;
/**
 * Extraction timing statistics
 */
export interface ExtractionTimingStats {
    results: ParallelExtractionResult[];
    totalUrls: number;
    successful: number;
    failed: number;
    successRate: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
}
/**
 * Extract content and return timing statistics
 */
export declare function extractWithTiming(urls: string[], maxWorkers?: number, timeout?: number): Promise<ExtractionTimingStats>;
declare const _default: {
    ExtractionTask: ExtractionTask;
    ParallelExtractionResult: ParallelExtractionResult;
    ParallelExtractor: typeof ParallelExtractor;
    extractParallel: typeof extractParallel;
    extractWithTiming: typeof extractWithTiming;
};
export default _default;
//# sourceMappingURL=parallel_extraction.d.ts.map