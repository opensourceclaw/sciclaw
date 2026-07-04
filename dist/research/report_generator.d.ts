/**
 * AI-Driven Report Generator - Generates formatted research reports
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { ReportConfig, SynthesisResult } from "./types.js";
/**
 * Report Generator - Generates formatted research reports
 */
export declare class ReportGenerator {
    private config;
    private sectioner;
    constructor(config?: Partial<ReportConfig>);
    /**
     * Generate report from synthesis result
     */
    generate(result: SynthesisResult): string;
    /**
     * Generate Markdown report
     */
    private generateMarkdown;
    /**
     * Generate HTML report
     */
    private generateHtml;
    /**
     * Generate JSON report
     */
    private generateJson;
    /**
     * Generate error report
     */
    private generateErrorReport;
    /**
     * Format citation with quality score
     */
    private formatCitationWithScore;
    /**
     * Format citation
     */
    private formatCitation;
    /**
     * Format citation for HTML
     */
    private formatCitationHtml;
    /**
     * Save report to file
     */
    save(result: SynthesisResult, outputPath: string): Promise<void>;
    private formatDate;
    private formatPercent;
    private slugify;
    private confidenceIndicator;
    private markdownToHtml;
    private getHtmlStyles;
}
/**
 * Generate report (convenience function)
 */
export declare function generateReport(result: SynthesisResult, format?: ReportConfig["format"], options?: Partial<ReportConfig>): string;
//# sourceMappingURL=report_generator.d.ts.map