/**
 * Research Synthesizer V2 - Enhanced LLM-driven synthesis
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { Finding, SynthesisRequest, SynthesisResult, LLMEngine } from "./types.js";
/**
 * LLM-powered research synthesizer
 */
export declare class LLMSynthesizer {
    private llmEngine;
    private maxRetries;
    private timeout;
    constructor(options?: {
        llmEngine?: LLMEngine;
        maxRetries?: number;
        timeout?: number;
    });
    /**
     * Try to create default LLM engine
     */
    private tryCreateLLMEngine;
    /**
     * Synthesize research findings into a report
     */
    synthesize(request: SynthesisRequest): Promise<SynthesisResult>;
    /**
     * Extract themes from findings using LLM
     */
    private extractThemes;
    /**
     * Fallback theme extraction without LLM
     */
    private extractThemesFallback;
    /**
     * Synthesize content for a section
     */
    private synthesizeSection;
    /**
     * Extract key points from content
     */
    private extractKeyPoints;
    /**
     * Generate executive summary
     */
    private generateSummary;
}
/**
 * Create finding from plain object
 */
export declare function createFinding(data: Partial<Finding>): Finding;
/**
 * Synthesize findings (convenience function)
 */
export declare function synthesizeFindings(topic: string, findings: Array<Partial<Finding>>, options?: Partial<SynthesisRequest>): Promise<SynthesisResult>;
//# sourceMappingURL=synthesizer_v2.d.ts.map