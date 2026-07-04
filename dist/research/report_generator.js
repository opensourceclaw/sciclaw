/**
 * AI-Driven Report Generator - Generates formatted research reports
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import * as fs from "fs/promises";
import * as path from "path";
import { SmartSectioner } from "./smart_sectioning.js";
/**
 * Default report configuration
 */
const DEFAULT_REPORT_CONFIG = {
    format: "markdown",
    includeToc: true,
    includeSummary: true,
    includeSources: true,
    citationStyle: "markdown",
    language: "en",
    theme: "default",
    maxSections: 20,
    maxSources: 50,
};
/**
 * Report Generator - Generates formatted research reports
 */
export class ReportGenerator {
    config;
    sectioner;
    constructor(config = {}) {
        this.config = { ...DEFAULT_REPORT_CONFIG, ...config };
        this.sectioner = new SmartSectioner();
    }
    /**
     * Generate report from synthesis result
     */
    generate(result) {
        if (!result.success) {
            return this.generateErrorReport(result);
        }
        switch (this.config.format) {
            case "html":
                return this.generateHtml(result);
            case "json":
                return this.generateJson(result);
            case "pdf":
                // PDF via markdown
                return this.generateMarkdown(result);
            default:
                return this.generateMarkdown(result);
        }
    }
    /**
     * Generate Markdown report
     */
    generateMarkdown(result) {
        const lines = [];
        // Title
        lines.push(`# ${result.topic}`);
        lines.push("");
        // Metadata
        lines.push(`**Generated:** ${this.formatDate(result.createdAt)}`);
        lines.push(`**Version:** ${result.version}`);
        lines.push(`**Sections:** ${result.sections.length}`);
        lines.push("");
        lines.push("---");
        lines.push("");
        // Executive Summary
        if (this.config.includeSummary && result.summary) {
            lines.push("## Executive Summary");
            lines.push("");
            lines.push(result.summary);
            lines.push("");
            lines.push("---");
            lines.push("");
        }
        // Table of Contents
        if (this.config.includeToc && result.sections.length > 0) {
            lines.push("## Table of Contents");
            lines.push("");
            for (let i = 0; i < result.sections.length; i++) {
                const section = result.sections[i];
                if (!section)
                    continue;
                const anchor = this.slugify(section.title);
                const confIndicator = this.confidenceIndicator(section.confidence);
                lines.push(`${i + 1}. [${section.title}](#${anchor}) ${confIndicator}`);
            }
            lines.push("");
            lines.push("---");
            lines.push("");
        }
        // Sections
        for (const section of result.sections) {
            const anchor = this.slugify(section.title);
            lines.push(`## ${section.title} {#${anchor}}`);
            lines.push("");
            // Key points
            if (section.keyPoints.length > 0) {
                lines.push("**Key Points:**");
                for (const point of section.keyPoints) {
                    lines.push(`- ${point}`);
                }
                lines.push("");
            }
            // Content
            lines.push(section.content);
            lines.push("");
            // Sources for this section
            if (this.config.includeSources && section.sources.length > 0) {
                lines.push("### Sources");
                lines.push("");
                for (let i = 0; i < section.sources.length; i++) {
                    const source = section.sources[i];
                    if (!source)
                        continue;
                    const citation = this.formatCitationWithScore(source);
                    lines.push(`${i + 1}. ${citation}`);
                }
                lines.push("");
            }
            // Confidence
            const confEmoji = this.confidenceIndicator(section.confidence);
            lines.push(`**Confidence:** ${confEmoji} ${this.formatPercent(section.confidence)}`);
            lines.push("");
            lines.push("---");
            lines.push("");
        }
        // All Sources / References
        if (this.config.includeSources && result.allSources.length > 0) {
            lines.push("## References");
            lines.push("");
            const seenUrls = new Set();
            let index = 1;
            for (const source of result.allSources) {
                if (source.url && seenUrls.has(source.url))
                    continue;
                if (source.url)
                    seenUrls.add(source.url);
                const citation = this.formatCitation(source);
                lines.push(`${index}. ${citation}`);
                index++;
            }
            lines.push("");
        }
        // Footer
        lines.push(`*Report generated by DeepClaw v${result.version}*`);
        return lines.join("\n");
    }
    /**
     * Generate HTML report
     */
    generateHtml(result) {
        const escapeHtml = (str) => str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        const htmlParts = [
            "<!DOCTYPE html>",
            "<html lang='en'>",
            "<head>",
            "  <meta charset='UTF-8'>",
            "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
            `  <title>${escapeHtml(result.topic)}</title>`,
            "  <style>",
            this.getHtmlStyles(),
            "  </style>",
            "</head>",
            "<body>",
            "  <div class='container'>",
        ];
        // Title
        htmlParts.push(`  <h1>${escapeHtml(result.topic)}</h1>`);
        htmlParts.push(`  <p class='metadata'>Generated: ${this.formatDate(result.createdAt)}</p>`);
        // Summary
        if (this.config.includeSummary && result.summary) {
            htmlParts.push("  <section class='summary'>");
            htmlParts.push("    <h2>Executive Summary</h2>");
            htmlParts.push(`    <p>${escapeHtml(result.summary)}</p>`);
            htmlParts.push("  </section>");
        }
        // TOC
        if (this.config.includeToc && result.sections.length > 0) {
            htmlParts.push("  <nav class='toc'>");
            htmlParts.push("    <h2>Table of Contents</h2>");
            htmlParts.push("    <ul>");
            for (let i = 0; i < result.sections.length; i++) {
                const section = result.sections[i];
                if (!section)
                    continue;
                const anchor = this.slugify(section.title);
                htmlParts.push(`      <li><a href="#${anchor}">${escapeHtml(section.title)}</a></li>`);
            }
            htmlParts.push("    </ul>");
            htmlParts.push("  </nav>");
        }
        // Sections
        for (const section of result.sections) {
            const anchor = this.slugify(section.title);
            htmlParts.push(`  <section id='${anchor}'>`);
            htmlParts.push(`    <h2>${escapeHtml(section.title)}</h2>`);
            // Key points
            if (section.keyPoints.length > 0) {
                htmlParts.push("    <div class='key-points'>");
                htmlParts.push("      <strong>Key Points:</strong>");
                htmlParts.push("      <ul>");
                for (const point of section.keyPoints) {
                    htmlParts.push(`        <li>${escapeHtml(point)}</li>`);
                }
                htmlParts.push("      </ul>");
                htmlParts.push("    </div>");
            }
            // Content
            const contentHtml = this.markdownToHtml(escapeHtml(section.content));
            htmlParts.push(`    <div class='content'>${contentHtml}</div>`);
            // Sources
            if (this.config.includeSources && section.sources.length > 0) {
                htmlParts.push("    <div class='sources'>");
                htmlParts.push("      <h3>Sources</h3>");
                htmlParts.push("      <ol>");
                for (const source of section.sources) {
                    htmlParts.push(`        <li>${this.formatCitationHtml(source)}</li>`);
                }
                htmlParts.push("      </ol>");
                htmlParts.push("    </div>");
            }
            // Confidence
            const confClass = section.confidence >= 0.7
                ? "high"
                : section.confidence >= 0.4
                    ? "medium"
                    : "low";
            htmlParts.push(`    <p class='confidence'>Confidence: <span class='badge ${confClass}'>${this.formatPercent(section.confidence)}</span></p>`);
            htmlParts.push("  </section>");
        }
        // References
        if (this.config.includeSources && result.allSources.length > 0) {
            htmlParts.push("  <section class='references'>");
            htmlParts.push("    <h2>References</h2>");
            htmlParts.push("    <ol>");
            const seenUrls = new Set();
            for (const source of result.allSources) {
                if (source.url && seenUrls.has(source.url))
                    continue;
                if (source.url)
                    seenUrls.add(source.url);
                htmlParts.push(`      <li>${this.formatCitationHtml(source)}</li>`);
            }
            htmlParts.push("    </ol>");
            htmlParts.push("  </section>");
        }
        // Footer
        htmlParts.push(`  <footer>Report generated by DeepClaw v${result.version}</footer>`);
        htmlParts.push("  </div>");
        htmlParts.push("</body>", "</html>");
        return htmlParts.join("\n");
    }
    /**
     * Generate JSON report
     */
    generateJson(result) {
        const data = {
            topic: result.topic,
            summary: result.summary,
            created_at: result.createdAt.toISOString(),
            version: result.version,
            metadata: result.metadata,
            success: result.success,
            error_message: result.errorMessage,
            sections: result.sections.map((s) => ({
                title: s.title,
                content: s.content,
                confidence: s.confidence,
                theme: s.theme,
                key_points: s.keyPoints,
                sources: s.sources.map((src) => ({
                    title: src.title,
                    url: src.url,
                    author: src.author,
                    date: src.date,
                })),
            })),
            sources: result.allSources.map((src) => ({
                title: src.title,
                url: src.url,
                author: src.author,
                date: src.date,
                source: src.source,
            })),
        };
        return JSON.stringify(data, null, 2);
    }
    /**
     * Generate error report
     */
    generateErrorReport(result) {
        const lines = [
            `# Error: ${result.topic}`,
            "",
            "## Status",
            "",
            "**Success:** ❌ Failed",
            `**Error:** ${result.errorMessage}`,
            "",
            "---",
            "",
            "*Please check the input data and try again.*",
        ];
        return lines.join("\n");
    }
    /**
     * Format citation with quality score
     */
    formatCitationWithScore(source) {
        const citation = this.formatCitation(source);
        if (source.qualityScore) {
            const qs = source.qualityScore;
            let indicator;
            if (qs >= 0.8)
                indicator = " [High Quality]";
            else if (qs >= 0.6)
                indicator = " [Good]";
            else if (qs >= 0.4)
                indicator = " [Average]";
            else
                indicator = " [Low Quality]";
            return citation + indicator;
        }
        return citation;
    }
    /**
     * Format citation
     */
    formatCitation(source) {
        switch (this.config.citationStyle) {
            case "apa": {
                const author = source.author || "Unknown";
                const date = source.date || "n.d.";
                const title = source.title || "Untitled";
                return `${author} (${date}). ${title}. ${source.url || source.source}`;
            }
            case "mla": {
                const author = source.author || "Unknown";
                const date = source.date || "n.d.";
                const title = source.title || "Untitled";
                return `${author}. "${title}." ${source.source || "Web"}. ${date}.`;
            }
            default: {
                // Markdown style
                if (source.url) {
                    return `[${source.title || source.source}](${source.url})`;
                }
                return source.title || source.source;
            }
        }
    }
    /**
     * Format citation for HTML
     */
    formatCitationHtml(source) {
        const escapeHtml = (str) => str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        const parts = [];
        if (source.title) {
            if (source.url) {
                parts.push(`<a href='${escapeHtml(source.url)}'>${escapeHtml(source.title)}</a>`);
            }
            else {
                parts.push(escapeHtml(source.title));
            }
        }
        if (source.author) {
            parts.push(` by ${escapeHtml(source.author)}`);
        }
        if (source.date) {
            parts.push(` (${escapeHtml(source.date)})`);
        }
        return parts.join("") || escapeHtml(source.source);
    }
    /**
     * Save report to file
     */
    async save(result, outputPath) {
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        const content = this.generate(result);
        await fs.writeFile(outputPath, content, "utf-8");
    }
    // ── Utility Methods ────────────────────────────────────────────────────
    formatDate(date) {
        return date.toISOString().replace("T", " ").slice(0, 19);
    }
    formatPercent(value) {
        return `${Math.round(value * 100)}%`;
    }
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
    confidenceIndicator(confidence) {
        if (confidence >= 0.8)
            return "✅";
        if (confidence >= 0.6)
            return "👍";
        if (confidence >= 0.4)
            return "🤔";
        return "⚠️";
    }
    markdownToHtml(text) {
        // Simple markdown to HTML conversion
        let html = text;
        // Headers
        html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
        html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
        html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
        html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        // Italic
        html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2'>$1</a>");
        // Line breaks
        html = html.replace(/\n/g, "<br>");
        return `<p>${html}</p>`;
    }
    getHtmlStyles() {
        return `
      :root {
        --primary: #2563eb;
        --secondary: #1e40af;
        --bg: #ffffff;
        --text: #1f2937;
        --muted: #6b7280;
        --border: #e5e7eb;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text);
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: var(--bg);
      }

      h1 { color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 10px; }
      h2 { color: var(--secondary); margin-top: 30px; border-bottom: 1px solid var(--border); }
      h3 { color: #1e3a8a; }

      .metadata { color: var(--muted); font-size: 0.9em; }

      .summary {
        background: #f9fafb;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
      }

      .toc {
        background: #f9fafb;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
      }

      .toc ul { list-style: none; padding-left: 20px; }
      .toc li { margin: 5px 0; }

      .key-points {
        background: #eff6ff;
        padding: 10px 15px;
        border-radius: 5px;
        margin: 10px 0;
      }

      .sources {
        font-size: 0.9em;
        color: var(--muted);
        margin-top: 15px;
      }

      .confidence { font-size: 0.85em; color: var(--muted); }

      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.85em;
      }

      .badge.high { background: #d1fae5; color: #065f46; }
      .badge.medium { background: #fef3c7; color: #92400e; }
      .badge.low { background: #fee2e2; color: #991b1b; }

      .references { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); }

      footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 0.8em;
        text-align: center;
      }

      a { color: var(--primary); }
    `;
    }
}
/**
 * Generate report (convenience function)
 */
export function generateReport(result, format = "markdown", options = {}) {
    const config = { ...DEFAULT_REPORT_CONFIG, ...options, format };
    const generator = new ReportGenerator(config);
    return generator.generate(result);
}
//# sourceMappingURL=report_generator.js.map