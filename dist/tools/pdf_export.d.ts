/**
 * PDF Export Module
 *
 * Generates PDF reports with customizable styling, headers, footers, and pagination.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import { ResearchReport } from './report_formatter.js';
/**
 * PDF footer settings
 */
export interface PDFFooterSettings {
    includePageNumbers: boolean;
    includeDate: boolean;
    text: string;
    fontSize: number;
    alignment: 'left' | 'center' | 'right';
}
/**
 * PDF header settings
 */
export interface PDFHeaderSettings {
    includeTitle: boolean;
    includeSeparator: boolean;
    fontSize: number;
    alignment: 'left' | 'center' | 'right';
}
/**
 * PDF styling configuration
 */
export interface PDFStyleSettings {
    fontFamily: string;
    fontSizeBody: number;
    fontSizeHeading1: number;
    fontSizeHeading2: number;
    fontSizeHeading3: number;
    primaryColor: string;
    accentColor: string;
    linkColor: string;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    lineHeight: number;
    paragraphSpacing: number;
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    header: PDFHeaderSettings;
    footer: PDFFooterSettings;
    includeToc: boolean;
    tocTitle: string;
    sourceFormat: 'numbered' | 'bulleted';
}
/**
 * Default style settings
 */
export declare const DEFAULT_STYLE: PDFStyleSettings;
/**
 * APA Style settings
 */
export declare const APA_STYLE: PDFStyleSettings;
/**
 * MLA Style settings
 */
export declare const MLA_STYLE: PDFStyleSettings;
/**
 * Convert basic markdown to plain text for PDF
 */
export declare function convertMarkdownToText(text: string): string;
/**
 * Export report to PDF file using PDFKit
 */
export declare function exportToPdf(report: ResearchReport, outputPath: string, style?: PDFStyleSettings, includeToc?: boolean): Promise<void>;
/**
 * Export report to PDF with named style
 */
export declare function reportToPdf(report: ResearchReport, outputPath: string, styleName?: string, overrides?: Partial<PDFStyleSettings>): Promise<void>;
declare const _default: {
    PDFFooterSettings: PDFFooterSettings;
    PDFHeaderSettings: PDFHeaderSettings;
    PDFStyleSettings: PDFStyleSettings;
    DEFAULT_STYLE: PDFStyleSettings;
    APA_STYLE: PDFStyleSettings;
    MLA_STYLE: PDFStyleSettings;
    exportToPdf: typeof exportToPdf;
    reportToPdf: typeof reportToPdf;
    convertMarkdownToText: typeof convertMarkdownToText;
};
export default _default;
//# sourceMappingURL=pdf_export.d.ts.map