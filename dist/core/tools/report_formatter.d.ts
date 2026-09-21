/**
 * Report Formatting Module
 *
 * Generates structured research reports in multiple formats.
 * Supports APA 7th Edition, MLA, and Chicago citation styles.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * A research source
 */
export interface Source {
    url: string;
    title: string;
    snippet?: string;
    content?: string;
    author?: string;
    date?: string;
    siteName?: string;
    qualityScore?: number;
    publisher?: string;
    accessDate?: string;
    doi?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    edition?: string;
}
/**
 * Generate citation in specified style
 */
export declare function toCitation(source: Source, style?: string): string;
/**
 * Generate APA 7th Edition citation
 */
export declare function toApaCitation(source: Source): string;
/**
 * Generate MLA 9th Edition citation
 */
export declare function toMlaCitation(source: Source): string;
/**
 * Generate Chicago 17th Edition citation
 */
export declare function toChicagoCitation(source: Source): string;
/**
 * A section of the report
 */
export interface ReportSection {
    title: string;
    content: string;
    level: number;
    sources?: Source[];
}
/**
 * A complete research report
 */
export declare class ResearchReport {
    topic: string;
    summary: string;
    sections: ReportSection[];
    sources: Source[];
    createdAt: Date;
    metadata: Record<string, unknown>;
    constructor(topic: string, summary?: string, sections?: ReportSection[], sources?: Source[], metadata?: Record<string, unknown>);
    /**
     * Add a section to the report
     */
    addSection(title: string, content: string, level?: number): ReportSection;
    /**
     * Add a source to the report
     */
    addSource(source: Source): number;
    /**
     * Convert report to Markdown format
     */
    toMarkdown(includeToc?: boolean): string;
    /**
     * Convert report to HTML format
     */
    toHtml(includeToc?: boolean): string;
    /**
     * Convert report to JSON format
     */
    toJson(): string;
    /**
     * Save report to file
     */
    save(filePath: string, format?: string): void;
    /**
     * Format date
     */
    private formatDate;
    /**
     * Convert text to URL-friendly slug
     */
    slugify(text: string): string;
    /**
     * Simple markdown to HTML conversion
     */
    private markdownToHtml;
}
/**
 * Create a research report from data
 */
export declare function createReport(topic: string, summary?: string, sections?: Array<{
    title: string;
    content: string;
    level?: number;
}>, sources?: Source[]): ResearchReport;
declare const _default: {
    Source: Source;
    ReportSection: ReportSection;
    ResearchReport: typeof ResearchReport;
    createReport: typeof createReport;
    toCitation: typeof toCitation;
    toApaCitation: typeof toApaCitation;
    toMlaCitation: typeof toMlaCitation;
    toChicagoCitation: typeof toChicagoCitation;
};
export default _default;
//# sourceMappingURL=report_formatter.d.ts.map