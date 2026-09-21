/**
 * PDF Export Module
 *
 * Generates PDF reports with customizable styling, headers, footers, and pagination.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
/**
 * Default style settings
 */
export const DEFAULT_STYLE = {
    fontFamily: 'Helvetica',
    fontSizeBody: 11,
    fontSizeHeading1: 20,
    fontSizeHeading2: 16,
    fontSizeHeading3: 14,
    primaryColor: '#333333',
    accentColor: '#0066CC',
    linkColor: '#0066CC',
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 40,
    marginRight: 40,
    lineHeight: 1.5,
    paragraphSpacing: 12,
    pageSize: 'A4',
    orientation: 'portrait',
    header: {
        includeTitle: true,
        includeSeparator: true,
        fontSize: 12,
        alignment: 'center',
    },
    footer: {
        includePageNumbers: true,
        includeDate: false,
        text: '',
        fontSize: 10,
        alignment: 'center',
    },
    includeToc: true,
    tocTitle: 'Table of Contents',
    sourceFormat: 'numbered',
};
/**
 * APA Style settings
 */
export const APA_STYLE = {
    ...DEFAULT_STYLE,
    fontFamily: 'Helvetica',
    fontSizeBody: 11,
    lineHeight: 1.5,
    primaryColor: '#000000',
    accentColor: '#000000',
    includeToc: false,
};
/**
 * MLA Style settings
 */
export const MLA_STYLE = {
    ...DEFAULT_STYLE,
    fontFamily: 'Times-Roman',
    fontSizeBody: 12,
    lineHeight: 1.5,
    primaryColor: '#000000',
    accentColor: '#000000',
    includeToc: false,
};
/**
 * Convert basic markdown to plain text for PDF
 */
export function convertMarkdownToText(text) {
    let result = text;
    // Remove headers markers
    result = result.replace(/^#### (.+)$/gm, '$1');
    result = result.replace(/^### (.+)$/gm, '$1');
    result = result.replace(/^## (.+)$/gm, '$1');
    result = result.replace(/^# (.+)$/gm, '$1');
    // Remove bold/italic markers
    result = result.replace(/\*\*(.+?)\*\*/g, '$1');
    result = result.replace(/\*(.+?)\*/g, '$1');
    // Remove links, keep text
    result = result.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
    return result;
}
/**
 * Export report to PDF file using PDFKit
 */
export async function exportToPdf(report, outputPath, style = DEFAULT_STYLE, includeToc = true) {
    return new Promise((resolve, reject) => {
        try {
            // Ensure directory exists
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Create PDF document
            const doc = new PDFDocument({
                size: style.pageSize,
                margins: {
                    top: style.marginTop,
                    bottom: style.marginBottom,
                    left: style.marginLeft,
                    right: style.marginRight,
                },
            });
            // Pipe to file
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            let pageNumber = 1;
            // Helper to add page number
            const addPageNumber = () => {
                if (style.footer.includePageNumbers) {
                    doc.fontSize(style.footer.fontSize);
                    const text = style.footer.text || `Page ${pageNumber}`;
                    doc.text(text, style.marginLeft, doc.page.height - style.marginBottom + 20, {
                        align: style.footer.alignment,
                        width: doc.page.width - style.marginLeft - style.marginRight,
                    });
                }
            };
            // Title
            doc.fontSize(style.fontSizeHeading1);
            doc.text(report.topic, { align: 'center' });
            doc.moveDown();
            // Metadata
            doc.fontSize(style.fontSizeBody);
            doc.fillColor('#666666');
            doc.text(`Generated: ${report.createdAt.toISOString().replace('T', ' ').substring(0, 19)}`);
            if (report.metadata.query) {
                doc.text(`Query: ${report.metadata.query}`);
            }
            doc.fillColor(style.primaryColor);
            doc.moveDown();
            // Summary
            if (report.summary) {
                doc.fontSize(style.fontSizeHeading2);
                doc.text('Summary');
                doc.moveDown();
                doc.fontSize(style.fontSizeBody);
                doc.text(convertMarkdownToText(report.summary));
                doc.moveDown();
            }
            // Table of contents
            if (includeToc && style.includeToc && report.sections.length > 0) {
                doc.fontSize(style.fontSizeHeading2);
                doc.text(style.tocTitle);
                doc.moveDown();
                doc.fontSize(style.fontSizeBody);
                report.sections.forEach((section, i) => {
                    doc.text(`${i + 1}. ${section.title}`);
                });
                doc.moveDown();
            }
            // Sections
            report.sections.forEach(section => {
                // Check if we need a new page
                if (doc.y > doc.page.height - style.marginBottom - 100) {
                    doc.addPage();
                    pageNumber++;
                }
                doc.fontSize(section.level === 2 ? style.fontSizeHeading2 : style.fontSizeHeading3);
                doc.text(section.title);
                doc.moveDown();
                doc.fontSize(style.fontSizeBody);
                doc.text(convertMarkdownToText(section.content));
                doc.moveDown();
            });
            // Sources
            if (report.sources.length > 0) {
                doc.addPage();
                pageNumber++;
                doc.fontSize(style.fontSizeHeading2);
                doc.text('References');
                doc.moveDown();
                doc.fontSize(style.fontSizeBody);
                report.sources.forEach((source, i) => {
                    const prefix = style.sourceFormat === 'numbered' ? `[${i + 1}] ` : '• ';
                    doc.fontSize(style.fontSizeBody);
                    doc.text(`${prefix}${source.title}`, { continued: true });
                    if (source.author) {
                        doc.text(` - Author: ${source.author}`);
                    }
                    else {
                        doc.text('');
                    }
                    doc.fontSize(style.fontSizeBody - 1);
                    doc.fillColor(style.linkColor);
                    doc.text(source.url, { link: source.url });
                    doc.fillColor(style.primaryColor);
                    doc.moveDown(0.5);
                });
            }
            // Add page numbers
            addPageNumber();
            // Finalize
            doc.end();
            stream.on('finish', () => resolve());
            stream.on('error', (err) => reject(err));
        }
        catch (error) {
            reject(error);
        }
    });
}
/**
 * Export report to PDF with named style
 */
export async function reportToPdf(report, outputPath, styleName = 'default', overrides = {}) {
    const styleMap = {
        default: DEFAULT_STYLE,
        apa: APA_STYLE,
        mla: MLA_STYLE,
    };
    const style = { ...styleMap[styleName] || DEFAULT_STYLE, ...overrides };
    return exportToPdf(report, outputPath, style, style.includeToc);
}
// Export all
export default {
    PDFFooterSettings: {},
    PDFHeaderSettings: {},
    PDFStyleSettings: {},
    DEFAULT_STYLE,
    APA_STYLE,
    MLA_STYLE,
    exportToPdf,
    reportToPdf,
    convertMarkdownToText,
};
//# sourceMappingURL=pdf_export.js.map