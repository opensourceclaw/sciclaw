/**
 * Smart Sectioning - Automatic chapter detection and theme recognition
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { SectionCandidate, SectionAnalysis, LLMEngine } from "./types.js";
/**
 * Automatic section detection and theme recognition
 */
export declare class SmartSectioner {
    private llmEngine;
    constructor(llmEngine?: LLMEngine);
    /**
     * Detect sections in content
     */
    detectSections(content: string, minSectionLength?: number): Promise<SectionAnalysis>;
    /**
     * Detect sections using LLM
     */
    private detectSectionsLLM;
    /**
     * Detect sections using pattern matching
     */
    private detectSectionsPattern;
    /**
     * Identify themes from sections
     */
    private identifyThemes;
    /**
     * Group sections by theme
     */
    groupByTheme(sections: SectionCandidate[]): Map<string, SectionCandidate[]>;
    /**
     * Classify section into a theme
     */
    private classifySectionTheme;
    /**
     * Optimize section ordering
     */
    optimizeOrder(sections: SectionCandidate[]): SectionCandidate[];
    /**
     * Split content into chunks
     */
    private splitContent;
    /**
     * Calculate section detection accuracy
     */
    calculateAccuracy(detected: SectionCandidate[], groundTruth: string[]): number;
}
/**
 * Create default sectioner instance
 */
export declare const smartSectioner: SmartSectioner;
//# sourceMappingURL=smart_sectioning.d.ts.map