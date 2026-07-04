/**
 * Research Runner - Coordinates the full research workflow
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { ResearchReport } from "./types.js";
/**
 * Research Runner - Coordinates the full research workflow with parallel processing
 */
export declare class ResearchRunner {
    private planner;
    private synthesizer;
    private maxContent;
    private maxWorkers;
    constructor(options?: {
        maxContent?: number;
        maxWorkers?: number;
    });
    /**
     * Run full research workflow with parallel processing
     */
    run(topic: string, depth?: number): Promise<ResearchReport>;
    /**
     * Search for results
     */
    private search;
    /**
     * Extract content from URLs in parallel
     */
    private extractContentParallel;
    /**
     * Extract content from a single URL
     */
    private extractContent;
    /**
     * Convert research findings to synthesizer format
     */
    private convertFindings;
}
/**
 * Run full research workflow (convenience function)
 */
export declare function runResearch(topic: string, depth?: number): Promise<ResearchReport>;
//# sourceMappingURL=runner.d.ts.map