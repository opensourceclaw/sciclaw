/**
 * Research Synthesizer - Synthesizes research findings into reports
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { ResearchReport } from "./types.js";
/**
 * Research Synthesizer - Groups findings and creates sections
 */
export declare class ResearchSynthesizer {
    private templates;
    constructor();
    /**
     * Synthesize findings into a report
     */
    synthesize(topic: string, findings: Array<{
        theme: string;
        content: string;
        source: string;
        confidence: number;
    }>): ResearchReport;
    /**
     * Group findings by theme
     */
    private groupByTheme;
    /**
     * Create a research section
     */
    private createSection;
    /**
     * Convert string to title case
     */
    private titleCase;
}
/**
 * Research Report with enhanced formatting
 */
export declare class ReportFormatter {
    /**
     * Generate executive summary from all sections
     */
    static getExecutiveSummary(report: ResearchReport): string;
    /**
     * Generate table of contents
     */
    static getTableOfContents(report: ResearchReport): string;
    /**
     * Get confidence indicator emoji
     */
    static confidenceIndicator(confidence: number): string;
    /**
     * Format report as Markdown
     */
    static formatMarkdown(report: ResearchReport, options?: {
        includeToc?: boolean;
        includeSummary?: boolean;
    }): string;
    /**
     * Format report as HTML
     */
    static formatHtml(report: ResearchReport): string;
}
/**
 * Synthesize findings into a report (convenience function)
 */
export declare function synthesize(topic: string, findings: Array<{
    theme: string;
    content: string;
    source: string;
    confidence: number;
}>): ResearchReport;
//# sourceMappingURL=synthesizer.d.ts.map