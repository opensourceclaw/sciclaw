/**
 * Report Formatting Module
 *
 * Generates structured research reports in multiple formats.
 * Supports APA 7th Edition, MLA, and Chicago citation styles.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Extract last name from author string
 */
function extractLastName(author) {
    if (!author)
        return "Unknown";
    // Handle "Last, First" format
    if (author.includes(',')) {
        return author.split(',')[0]?.trim() || "Unknown";
    }
    // Handle "First Last" format
    const parts = author.split(' ');
    return parts[parts.length - 1] || "Unknown";
}
/**
 * Extract year from date string
 */
function extractYear(date) {
    if (!date)
        return "n.d.";
    const yearMatch = date.match(/(\d{4})/);
    return yearMatch ? yearMatch[1] : "n.d.";
}
/**
 * Generate citation in specified style
 */
export function toCitation(source, style = "markdown") {
    switch (style) {
        case "apa":
            return toApaCitation(source);
        case "mla":
            return toMlaCitation(source);
        case "chicago":
            return toChicagoCitation(source);
        default: {
            const authorPart = source.author ? ` by ${source.author}` : "";
            const datePart = source.date ? ` (${source.date})` : "";
            return `[${source.title}${authorPart}${datePart}](${source.url})`;
        }
    }
}
/**
 * Generate APA 7th Edition citation
 */
export function toApaCitation(source) {
    const author = source.author || "Unknown";
    const date = extractYear(source.date);
    const parts = [`${author} (${date}). ${source.title}.`];
    if (source.siteName) {
        parts.push(source.siteName);
    }
    else if (source.publisher) {
        parts.push(source.publisher);
    }
    parts.push(source.url);
    return parts.join(" ");
}
/**
 * Generate MLA 9th Edition citation
 */
export function toMlaCitation(source) {
    const author = source.author || "Unknown";
    const date = source.date || "n.d.";
    const parts = [`${author}. "${source.title}."`];
    if (source.siteName) {
        parts.push(source.siteName + ",");
    }
    parts.push(`${date}.`);
    parts.push(source.url + ".");
    return parts.join(" ");
}
/**
 * Generate Chicago 17th Edition citation
 */
export function toChicagoCitation(source) {
    const author = source.author || "Unknown";
    const date = source.date || "n.d.";
    const parts = [`${author}. "${source.title}."`];
    if (source.siteName) {
        parts.push(source.siteName + ".");
    }
    parts.push(`Last modified ${date}.`);
    parts.push(source.url + ".");
    return parts.join(" ");
}
/**
 * A complete research report
 */
export class ResearchReport {
    topic;
    summary;
    sections;
    sources;
    createdAt;
    metadata;
    constructor(topic, summary = "", sections = [], sources = [], metadata = {}) {
        this.topic = topic;
        this.summary = summary;
        this.sections = sections;
        this.sources = sources;
        this.createdAt = new Date();
        this.metadata = metadata;
    }
    /**
     * Add a section to the report
     */
    addSection(title, content, level = 2) {
        const section = { title, content, level };
        this.sections.push(section);
        return section;
    }
    /**
     * Add a source to the report
     */
    addSource(source) {
        // Check for duplicates
        for (let i = 0; i < this.sources.length; i++) {
            const existingUrl = this.sources[i]?.url;
            if (existingUrl && existingUrl.toLowerCase() === source.url.toLowerCase()) {
                return i + 1;
            }
        }
        this.sources.push(source);
        return this.sources.length;
    }
    /**
     * Convert report to Markdown format
     */
    toMarkdown(includeToc = true) {
        const lines = [];
        // Title
        lines.push(`# ${this.topic}\n`);
        // Metadata
        lines.push(`**Generated**: ${this.formatDate(this.createdAt)}`);
        if (this.metadata.query) {
            lines.push(`**Query**: ${this.metadata.query}`);
        }
        lines.push("");
        // Summary
        if (this.summary) {
            lines.push("## Summary\n");
            lines.push(this.summary);
            lines.push("");
        }
        // Table of contents
        if (includeToc && this.sections.length > 0) {
            lines.push("## Table of Contents\n");
            this.sections.forEach((section, i) => {
                const indent = "  ".repeat(section.level - 2);
                lines.push(`${indent}${i + 1}. [${section.title}](#${this.slugify(section.title)})`);
            });
            lines.push("");
        }
        // Sections
        this.sections.forEach(section => {
            const slug = this.slugify(section.title);
            lines.push(`${"#".repeat(section.level)} ${section.title} {#${slug}}\n`);
            lines.push(section.content);
            lines.push("");
        });
        // Sources
        if (this.sources.length > 0) {
            lines.push("## Sources\n");
            this.sources.forEach((source, i) => {
                lines.push(`${i + 1}. ${toCitation(source)}`);
            });
            lines.push("");
        }
        return lines.join("\n");
    }
    /**
     * Convert report to HTML format
     */
    toHtml(includeToc = true) {
        const parts = [
            "<!DOCTYPE html>",
            "<html lang='en'>",
            "<head>",
            "  <meta charset='UTF-8'>",
            "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
            `  <title>${this.topic}</title>`,
            "  <style>",
            "    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
            "           max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }",
            "    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }",
            "    h2 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }",
            "    .metadata { color: #666; font-size: 0.9em; }",
            "    .source { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }",
            "    .toc { background: #f9f9f9; padding: 15px; border-radius: 5px; }",
            "    .toc ul { list-style: none; padding-left: 20px; }",
            "  </style>",
            "</head>",
            "<body>",
        ];
        // Title
        parts.push(`  <h1>${this.topic}</h1>`);
        parts.push(`  <p class='metadata'>Generated: ${this.formatDate(this.createdAt)}</p>`);
        // Summary
        if (this.summary) {
            parts.push("  <h2>Summary</h2>");
            parts.push(`  <p>${this.summary}</p>`);
        }
        // Table of contents
        if (includeToc && this.sections.length > 0) {
            parts.push("  <div class='toc'>");
            parts.push("    <h2>Table of Contents</h2>");
            parts.push("    <ul>");
            this.sections.forEach(section => {
                const slug = this.slugify(section.title);
                parts.push(`      <li><a href="#${slug}">${section.title}</a></li>`);
            });
            parts.push("    </ul>");
            parts.push("  </div>");
        }
        // Sections
        this.sections.forEach(section => {
            const slug = this.slugify(section.title);
            parts.push(`  <h${section.level} id='${slug}'>${section.title}</h${section.level}>`);
            parts.push(`  ${this.markdownToHtml(section.content)}`);
        });
        // Sources
        if (this.sources.length > 0) {
            parts.push("  <h2>Sources</h2>");
            this.sources.forEach((source, i) => {
                parts.push("  <div class='source'>");
                parts.push(`    <strong>${i + 1}. ${source.title}</strong>`);
                if (source.author) {
                    parts.push(`    <br>Author: ${source.author}`);
                }
                if (source.date) {
                    parts.push(`    <br>Date: ${source.date}`);
                }
                parts.push(`    <br>URL: <a href='${source.url}'>${source.url}</a>`);
                parts.push("  </div>");
            });
        }
        parts.push("</body>", "</html>");
        return parts.join("\n");
    }
    /**
     * Convert report to JSON format
     */
    toJson() {
        return JSON.stringify({
            topic: this.topic,
            summary: this.summary,
            createdAt: this.createdAt.toISOString(),
            metadata: this.metadata,
            sections: this.sections.map(s => ({
                title: s.title,
                content: s.content,
                level: s.level,
            })),
            sources: this.sources.map(src => ({
                url: src.url,
                title: src.title,
                snippet: src.snippet,
                author: src.author,
                date: src.date,
                siteName: src.siteName,
                qualityScore: src.qualityScore,
            })),
        }, null, 2);
    }
    /**
     * Save report to file
     */
    save(filePath, format = "markdown") {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let content;
        switch (format) {
            case "markdown":
                content = this.toMarkdown();
                break;
            case "html":
                content = this.toHtml();
                break;
            case "json":
                content = this.toJson();
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        fs.writeFileSync(filePath, content, 'utf-8');
    }
    /**
     * Format date
     */
    formatDate(date) {
        return date.toISOString().replace('T', ' ').substring(0, 19);
    }
    /**
     * Convert text to URL-friendly slug
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    /**
     * Simple markdown to HTML conversion
     */
    markdownToHtml(text) {
        // Headers
        text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
        text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
        text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");
        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        // Italic
        text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
        // Links
        text = text.replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2'>$1</a>");
        // Paragraphs
        text = text.replace(/\n\n/g, "</p><p>");
        return `<p>${text}</p>`;
    }
}
/**
 * Create a research report from data
 */
export function createReport(topic, summary = "", sections = [], sources = []) {
    const report = new ResearchReport(topic, summary);
    sections.forEach(sec => {
        report.addSection(sec.title, sec.content, sec.level || 2);
    });
    sources.forEach(src => {
        report.addSource(src);
    });
    return report;
}
// Export all
export default {
    Source: {},
    ReportSection: {},
    ResearchReport,
    createReport,
    toCitation,
    toApaCitation,
    toMlaCitation,
    toChicagoCitation,
};
//# sourceMappingURL=report_formatter.js.map