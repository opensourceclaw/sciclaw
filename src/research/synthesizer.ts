/**
 * Research Synthesizer - Synthesizes research findings into reports
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */

import type {
  ResearchSection,
  ResearchReport,
  Finding,
  SynthesisSection,
  SynthesisResult,
} from "./types.js";

/**
 * Get SciClaw version
 */
function getVersion(): string {
  return "3.3.0";
}

/**
 * Research Synthesizer - Groups findings and creates sections
 */
export class ResearchSynthesizer {
  private templates: Map<string, string>;

  constructor() {
    this.templates = new Map([
      ["default", "## {title}\n\n{content}\n\n### Sources\n{sources}"],
    ]);
  }

  /**
   * Synthesize findings into a report
   */
  synthesize(
    topic: string,
    findings: Array<{
      theme: string;
      content: string;
      source: string;
      confidence: number;
    }>
  ): ResearchReport {
    const report: ResearchReport = {
      topic,
      sections: [],
      createdAt: new Date(),
      version: getVersion(),
      metadata: {},
    };

    // Group findings by theme
    const themes = this.groupByTheme(findings);

    // Create sections for each theme
    for (const [theme, themeFindings] of themes) {
      const section = this.createSection(theme, themeFindings);
      report.sections.push(section);
    }

    return report;
  }

  /**
   * Group findings by theme
   */
  private groupByTheme(
    findings: Array<{ theme: string; content: string; source: string; confidence: number }>
  ): Map<string, Array<{ theme: string; content: string; source: string; confidence: number }>> {
    const themes = new Map<string, Array<{
      theme: string;
      content: string;
      source: string;
      confidence: number;
    }>>();

    for (const finding of findings) {
      const theme = finding.theme || "general";
      if (!themes.has(theme)) {
        themes.set(theme, []);
      }
      themes.get(theme)!.push(finding);
    }

    return themes;
  }

  /**
   * Create a research section
   */
  private createSection(
    theme: string,
    findings: Array<{ theme: string; content: string; source: string; confidence: number }>
  ): ResearchSection {
    const contentParts: string[] = [];
    const sources: string[] = [];

    for (const finding of findings) {
      contentParts.push(finding.content);
      if (finding.source) {
        sources.push(finding.source);
      }
    }

    const content = contentParts.join("\n\n");
    const confidence = findings.length > 0
      ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
      : 0.5;

    return {
      title: this.titleCase(theme),
      content,
      sources,
      confidence,
    };
  }

  /**
   * Convert string to title case
   */
  private titleCase(str: string): string {
    return str
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
}

/**
 * Research Report with enhanced formatting
 */
export class ReportFormatter {
  /**
   * Generate executive summary from all sections
   */
  static getExecutiveSummary(report: ResearchReport): string {
    if (report.sections.length === 0) {
      return "No research data available.";
    }

    const summaryParts: string[] = [
      `## Executive Summary\n\n**Topic:** ${report.topic}\n`,
      `**Date:** ${report.createdAt.toISOString().split("T")[0]}\n`,
      `**Sections:** ${report.sections.length}\n`,
    ];

    const avgConfidence =
      report.sections.reduce((sum, s) => sum + s.confidence, 0) / report.sections.length;
    summaryParts.push(`**Average Confidence:** ${avgConfidence.toFixed(2)}\n\n`);

    summaryParts.push("### Key Findings\n");
    for (let i = 0; i < Math.min(5, report.sections.length); i++) {
      const section = report.sections[i];
      if (!section) continue;
      const contentPreview = section.content.slice(0, 200).replace(/\n/g, " ");
      summaryParts.push(`${i + 1}. **${section.title}**: ${contentPreview}...\n`);
    }

    return summaryParts.join("");
  }

  /**
   * Generate table of contents
   */
  static getTableOfContents(report: ResearchReport): string {
    if (report.sections.length === 0) {
      return "";
    }

    const tocLines: string[] = ["## Table of Contents\n"];
    for (let i = 0; i < report.sections.length; i++) {
      const section = report.sections[i];
      if (!section) continue;
      const anchor = section.title.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
      const confIndicator = ReportFormatter.confidenceIndicator(section.confidence);
      tocLines.push(`${i + 1}. [${section.title}](#${anchor}) ${confIndicator}\n`);
    }

    return tocLines.join("");
  }

  /**
   * Get confidence indicator emoji
   */
  static confidenceIndicator(confidence: number): string {
    if (confidence >= 0.8) return "✅";
    if (confidence >= 0.6) return "👍";
    if (confidence >= 0.4) return "🤔";
    return "⚠️";
  }

  /**
   * Format report as Markdown
   */
  static formatMarkdown(
    report: ResearchReport,
    options: { includeToc?: boolean; includeSummary?: boolean } = {}
  ): string {
    const { includeToc = true, includeSummary = true } = options;
    const lines: string[] = [
      `# Research Report: ${report.topic}`,
      "",
      `**Generated:** ${report.createdAt.toISOString().replace("T", " ").slice(0, 19)}`,
      `**Version:** ${report.version}`,
      "",
      "---",
      "",
    ];

    if (includeSummary) {
      lines.push(ReportFormatter.getExecutiveSummary(report));
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    if (includeToc) {
      lines.push(ReportFormatter.getTableOfContents(report));
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    for (const section of report.sections) {
      const anchor = section.title.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
      lines.push(`## ${section.title} {#${anchor}}`);
      lines.push("");
      lines.push(section.content);
      lines.push("");

      if (section.sources.length > 0) {
        lines.push("### Sources");
        lines.push("");
        for (let i = 0; i < section.sources.length; i++) {
          lines.push(`${i + 1}. ${section.sources[i]}`);
        }
        lines.push("");
      }

      const confEmoji = ReportFormatter.confidenceIndicator(section.confidence);
      lines.push(`**Confidence:** ${confEmoji} ${section.confidence.toFixed(2)}`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    lines.push(`*Report generated by SciClaw v${report.version}*`);

    return lines.join("\n");
  }

  /**
   * Format report as HTML
   */
  static formatHtml(report: ResearchReport): string {
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(`Research: ${report.topic}`)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #1e3a8a; }
    .metadata { color: #6b7280; font-size: 0.9em; }
    .confidence { display: inline-block; padding: 2px 8px; border-radius: 4px; }
    .confidence-high { background: #d1fae5; color: #065f46; }
    .confidence-medium { background: #fef3c7; color: #92400e; }
    .confidence-low { background: #fee2e2; color: #991b1b; }
    .sources { font-size: 0.9em; color: #6b7280; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;
              color: #9ca3af; font-size: 0.8em; }
  </style>
</head>
<body>
  <h1>${escapeHtml(`Research Report: ${report.topic}`)}</h1>
  <div class="metadata">
    <p><strong>Generated:</strong> ${report.createdAt.toISOString().replace("T", " ").slice(0, 19)}</p>
    <p><strong>Version:</strong> ${report.version}</p>
  </div>
`;

    // Executive Summary
    html += "<h2>Executive Summary</h2>\n";
    let summary = ReportFormatter.getExecutiveSummary(report);
    summary = summary.replace("## Executive Summary\n\n", "");
    summary = summary.replace("### Key Findings\n", "<h3>Key Findings</h3>").replace(/\n/g, "<br>");
    html += `<p>${summary}</p>\n`;

    // Sections
    for (const section of report.sections) {
      html += `<h2>${escapeHtml(section.title)}</h2>\n`;
      const content = escapeHtml(section.content).replace(/\n\n/g, "</p><p>");
      html += `<p>${content}</p>\n`;

      if (section.sources.length > 0) {
        html += "<h3>Sources</h3>\n<ul class='sources'>\n";
        for (const source of section.sources) {
          html += `<li><a href='${escapeHtml(source)}'>${escapeHtml(source)}</a></li>\n`;
        }
        html += "</ul>\n";
      }

      const confClass =
        section.confidence >= 0.7
          ? "high"
          : section.confidence >= 0.4
            ? "medium"
            : "low";
      html += `<p>Confidence: <span class='confidence confidence-${confClass}'>${section.confidence.toFixed(2)}</span></p>\n`;
    }

    html += `<div class='footer'>Report generated by SciClaw v${report.version}</div>\n</body></html>`;

    return html;
  }
}

/**
 * Synthesize findings into a report (convenience function)
 */
export function synthesize(
  topic: string,
  findings: Array<{
    theme: string;
    content: string;
    source: string;
    confidence: number;
  }>
): ResearchReport {
  const synthesizer = new ResearchSynthesizer();
  return synthesizer.synthesize(topic, findings);
}