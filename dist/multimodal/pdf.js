/**
 * DeepClaw v3.0.0 — PDF Analyzer
 *
 * Analyzes PDF content: validates magic bytes, extracts metadata,
 * splits into pages, searches text, and exports content.
 */
import { DEFAULT_MULTIMODAL_CONFIG } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function extractPDFMetadata(text) {
    const metadata = { pageCount: 1 };
    const titleMatch = text.match(/\/Title\s*\(([^)]*)\)/);
    if (titleMatch)
        metadata.title = titleMatch[1];
    const authorMatch = text.match(/\/Author\s*\(([^)]*)\)/);
    if (authorMatch)
        metadata.author = authorMatch[1];
    const subjectMatch = text.match(/\/Subject\s*\(([^)]*)\)/);
    if (subjectMatch)
        metadata.subject = subjectMatch[1];
    const keywordsMatch = text.match(/\/Keywords\s*\(([^)]*)\)/);
    if (keywordsMatch) {
        metadata.keywords = keywordsMatch[1]
            .split(/[,;]/)
            .map((k) => k.trim());
    }
    const creatorMatch = text.match(/\/Creator\s*\(([^)]*)\)/);
    if (creatorMatch)
        metadata.creator = creatorMatch[1];
    const producerMatch = text.match(/\/Producer\s*\(([^)]*)\)/);
    if (producerMatch)
        metadata.producer = producerMatch[1];
    const creationDateMatch = text.match(/\/CreationDate\s*\(([^)]*)\)/);
    if (creationDateMatch) {
        metadata.creationDate = new Date(creationDateMatch[1]);
    }
    const modDateMatch = text.match(/\/ModDate\s*\(([^)]*)\)/);
    if (modDateMatch) {
        metadata.modificationDate = new Date(modDateMatch[1]);
    }
    const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
    if (pageMatches) {
        metadata.pageCount = pageMatches.length;
    }
    return metadata;
}
function searchText(pdfContent, query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    for (const page of pdfContent.pages) {
        const lowerText = page.text.toLowerCase();
        let idx = lowerText.indexOf(lowerQuery);
        while (idx !== -1) {
            const start = Math.max(0, idx - 50);
            const end = Math.min(page.text.length, idx + query.length + 50);
            const context = (start > 0 ? "..." : "") +
                page.text.slice(start, end) +
                (end < page.text.length ? "..." : "");
            results.push({ page: page.pageNumber, context });
            idx = lowerText.indexOf(lowerQuery, idx + 1);
        }
    }
    return results;
}
function exportText(pdfContent) {
    return pdfContent.pages.map((p) => p.text).join("\n\n");
}
// ── PDFAnalyzer ──────────────────────────────────────────────────────────
export class PDFAnalyzer {
    config;
    totalAnalyzed = 0;
    totalPages = 0;
    constructor(config) {
        this.config = { ...DEFAULT_MULTIMODAL_CONFIG.pdf, ...config };
        if (this.config.maxFileSizeBytes < 1024)
            this.config.maxFileSizeBytes = 1024;
        if (this.config.maxFileSizeBytes > 500 * 1024 * 1024)
            this.config.maxFileSizeBytes = 500 * 1024 * 1024;
        if (this.config.maxPages < 1)
            this.config.maxPages = 1;
        if (this.config.maxPages > 10000)
            this.config.maxPages = 10000;
    }
    async analyzePDF(input) {
        const buffer = typeof input === "string" ? Buffer.from(input) : input;
        if (buffer.length > this.config.maxFileSizeBytes) {
            throw new Error("PDF exceeds max size");
        }
        if (buffer.length < 5 || buffer.toString("utf-8", 0, 5) !== "%PDF-") {
            throw new Error("Not a valid PDF file");
        }
        const text = buffer.toString("utf-8");
        const metadata = extractPDFMetadata(text);
        const pageTexts = text.split(/\f/);
        const maxPages = Math.min(pageTexts.length, metadata.pageCount, this.config.maxPages);
        const pages = [];
        for (let i = 0; i < maxPages; i++) {
            const pageText = pageTexts[i] ?? "";
            pages.push({
                pageNumber: i + 1,
                text: pageText.trim(),
                tables: [],
                images: [],
                wordCount: pageText
                    .trim()
                    .split(/\s+/)
                    .filter((w) => w.length > 0).length,
            });
        }
        this.totalAnalyzed++;
        this.totalPages += pages.length;
        return {
            totalPages: pages.length,
            title: metadata.title,
            author: metadata.author,
            pages,
            metadata,
            extractionConfidence: pages.length > 0 ? 0.85 : 0.1,
        };
    }
    async analyzePDFBatch(inputs) {
        const results = [];
        for (const input of inputs) {
            results.push(await this.analyzePDF(input));
        }
        return results;
    }
    async extractPageText(input, pageNumber) {
        const pdf = await this.analyzePDF(input);
        const page = pdf.pages.find((p) => p.pageNumber === pageNumber);
        return page?.text ?? "";
    }
    async extractPageTables(_input, _pageNumber) {
        return [];
    }
    async extractMetadata(input) {
        const buffer = typeof input === "string" ? Buffer.from(input) : input;
        const text = buffer.toString("utf-8");
        return extractPDFMetadata(text);
    }
    searchText(pdfContent, query) {
        return searchText(pdfContent, query);
    }
    exportText(pdfContent) {
        return exportText(pdfContent);
    }
    exportPageText(pdfContent, pageNumber) {
        const page = pdfContent.pages.find((p) => p.pageNumber === pageNumber);
        return page?.text ?? "";
    }
    async validatePDF(input) {
        const errors = [];
        const buffer = typeof input === "string" ? Buffer.from(input) : input;
        if (buffer.length === 0) {
            errors.push("Empty buffer");
            return { valid: false, errors };
        }
        if (buffer.length < 5 ||
            buffer.toString("utf-8", 0, 5) !== "%PDF-") {
            errors.push("Not a valid PDF file (missing %PDF- header)");
        }
        if (buffer.length > this.config.maxFileSizeBytes) {
            errors.push(`PDF exceeds max size (${buffer.length} > ${this.config.maxFileSizeBytes})`);
        }
        return { valid: errors.length === 0, errors };
    }
    getAnalyzerStats() {
        return {
            totalAnalyzed: this.totalAnalyzed,
            totalPages: this.totalPages,
            avgPagesPerDoc: this.totalAnalyzed > 0
                ? Math.round((this.totalPages / this.totalAnalyzed) * 10) / 10
                : 0,
        };
    }
}
export function createPDFAnalyzer(config) {
    return new PDFAnalyzer(config);
}
//# sourceMappingURL=pdf.js.map