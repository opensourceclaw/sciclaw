/**
 * Research Synthesizer V2 - Enhanced LLM-driven synthesis
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */

import type {
  Finding,
  SynthesisRequest,
  SynthesisSection,
  SynthesisResult,
  ThemeInfo,
  LLMEngine,
} from "./types.js";

/**
 * Default synthesis request options
 */
const DEFAULT_SYNTHESIS_OPTIONS: Partial<SynthesisRequest> = {
  maxSections: 10,
  includeSources: true,
  citationStyle: "markdown",
  includeSummary: true,
  includeToc: true,
  language: "en",
};

/**
 * LLM-powered research synthesizer
 */
export class LLMSynthesizer {
  private llmEngine: LLMEngine | null;
  private maxRetries: number;
  private timeout: number;

  constructor(options: {
    llmEngine?: LLMEngine;
    maxRetries?: number;
    timeout?: number;
  } = {}) {
    this.llmEngine = options.llmEngine ?? null;
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 120;

    // Try to create LLM engine if not provided
    if (!this.llmEngine) {
      this.tryCreateLLMEngine();
    }
  }

  /**
   * Try to create default LLM engine
   */
  private tryCreateLLMEngine(): void {
    try {
      // Dynamic import for optional dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OpenClawModelAdapter } = require("../model/index.js");
      this.llmEngine = new OpenClawModelAdapter() as LLMEngine;
    } catch {
      // LLM engine not available, will use fallback methods
    }
  }

  /**
   * Synthesize research findings into a report
   */
  async synthesize(request: SynthesisRequest): Promise<SynthesisResult> {
    try {
      // Step 1: Theme extraction
      const themes = await this.extractThemes(request.topic, request.findings);

      // Step 2: Generate sections for each theme
      const sections: SynthesisSection[] = [];
      for (const theme of themes.slice(0, request.maxSections)) {
        const section = await this.synthesizeSection(
          request.topic,
          theme,
          request.findings,
          request.language
        );
        if (section) {
          sections.push(section);
        }
      }

      // Step 3: Generate summary
      const summary = await this.generateSummary(request.topic, sections, request.language);

      // Step 4: Collect all sources
      const allSources = [...request.findings];

      return {
        topic: request.topic,
        summary,
        sections,
        allSources,
        createdAt: new Date(),
        version: "3.3.0",
        metadata: {},
        success: true,
        errorMessage: "",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        topic: request.topic,
        summary: "",
        sections: [],
        allSources: request.findings,
        createdAt: new Date(),
        version: "3.3.0",
        metadata: {},
        success: false,
        errorMessage,
      };
    }
  }

  /**
   * Extract themes from findings using LLM
   */
  private async extractThemes(
    topic: string,
    findings: Finding[]
  ): Promise<ThemeInfo[]> {
    if (!this.llmEngine) {
      return this.extractThemesFallback(findings);
    }

    // Prepare findings summary for LLM
    const findingsText = findings
      .slice(0, 20)
      .map((f) => `- ${f.content.slice(0, 500)}`)
      .join("\n\n");

    const prompt = `Analyze the following research findings about "${topic}" and identify the main themes or topics.

Research Findings:
${findingsText}

Respond with a JSON array of themes, each with:
- "name": theme name
- "description": brief description
- "related_findings": indices of related findings (0-based)

Return ONLY valid JSON, no other text.`;

    try {
      const response = await this.llmEngine.chatSimple(
        prompt,
        "You are a research assistant that analyzes and categorizes information into themes. Always respond with valid JSON."
      );

      // Parse JSON response
      const themes = JSON.parse(response) as ThemeInfo[];
      return Array.isArray(themes) ? themes : [];
    } catch {
      return this.extractThemesFallback(findings);
    }
  }

  /**
   * Fallback theme extraction without LLM
   */
  private extractThemesFallback(findings: Finding[]): ThemeInfo[] {
    const themesMap = new Map<string, number[]>();

    for (let i = 0; i < findings.length; i++) {
      const finding = findings[i];
      if (!finding) continue;
      // Use first few words as simple theme
      const words = finding.content.split(" ").slice(0, 3);
      const themeKey = words.join(" ").toLowerCase();

      const normalizedKey =
        themeKey.length < 10 ? `theme_${Math.floor(i / 3)}` : themeKey;

      if (!themesMap.has(normalizedKey)) {
        themesMap.set(normalizedKey, []);
      }
      themesMap.get(normalizedKey)!.push(i);
    }

    const themes: ThemeInfo[] = [];
    let count = 0;
    for (const [name, indices] of themesMap) {
      if (count >= 10) break;
      themes.push({
        name: name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
        description: `Related findings about ${name}`,
        relatedFindings: indices,
      });
      count++;
    }

    return themes;
  }

  /**
   * Synthesize content for a section
   */
  private async synthesizeSection(
    topic: string,
    theme: ThemeInfo,
    allFindings: Finding[],
    language: "en" | "zh"
  ): Promise<SynthesisSection | null> {
    // Get related findings
    const relatedIndices = theme.relatedFindings;
    const relatedFindings = relatedIndices
      .filter((i: number) => i < allFindings.length)
      .map((i: number) => allFindings[i])
      .filter((f: Finding | undefined): f is Finding => f !== undefined);

    if (relatedFindings.length === 0) {
      return null;
    }

    if (!this.llmEngine) {
      // Fallback: simple concatenation
      const content = relatedFindings.map((f) => f.content).join("\n\n");
      return {
        title: theme.name || "General",
        content,
        sources: relatedFindings,
        confidence: 0.5,
        theme: theme.name || "",
        keyPoints: [],
      };
    }

    // Prepare content for LLM
    const findingsContent = relatedFindings
      .map((f: Finding, i: number) => `[${i + 1}] ${f.content.slice(0, 300)}`)
      .join("\n\n");

    const prompt = `Based on the following research findings about "${theme.name || topic}",
write a coherent synthesis paragraph (200-400 words):

${findingsContent}

Write in ${language === "zh" ? "Chinese" : "English"}.
Include key insights and avoid just listing information.
Respond with ONLY the synthesized content, no markdown formatting.`;

    try {
      const content = await this.llmEngine.chatSimple(prompt);

      // Extract key points
      const keyPoints = await this.extractKeyPoints(content);

      return {
        title: theme.name || "General",
        content,
        sources: relatedFindings,
        confidence: 0.7,
        theme: theme.name || "",
        keyPoints,
      };
    } catch {
      // Fallback
      const content = relatedFindings.map((f: Finding) => f.content).join("\n\n");
      return {
        title: theme.name || "General",
        content,
        sources: relatedFindings,
        confidence: 0.4,
        theme: theme.name || "",
        keyPoints: [],
      };
    }
  }

  /**
   * Extract key points from content
   */
  private async extractKeyPoints(content: string): Promise<string[]> {
    if (!this.llmEngine) {
      // Simple extraction
      const sentences = content.split(". ");
      return sentences
        .filter((s) => s.length > 20)
        .slice(0, 5)
        .map((s) => s.trim() + ".");
    }

    const prompt = `Extract 3-5 key points from the following text:

${content.slice(0, 1000)}

Respond with a JSON array of strings (key points).
Return ONLY valid JSON.`;

    try {
      const response = await this.llmEngine.chatSimple(prompt);
      const points = JSON.parse(response) as string[];
      return Array.isArray(points) ? points : [];
    } catch {
      return [];
    }
  }

  /**
   * Generate executive summary
   */
  private async generateSummary(
    topic: string,
    sections: SynthesisSection[],
    language: "en" | "zh"
  ): Promise<string> {
    if (sections.length === 0) {
      return "No research data available.";
    }

    if (!this.llmEngine) {
      // Simple summary
      const titles = sections.slice(0, 5).map((s) => s.title);
      return `Research on '${topic}' covering ${sections.length} main themes: ${titles.join(", ")}`;
    }

    const sectionsSummary = sections
      .slice(0, 5)
      .map((s) => `- ${s.title}: ${s.content.slice(0, 200)}...`)
      .join("\n");

    const prompt = `Create a brief executive summary (100-200 words) for a research report on "${topic}".

Topics covered:
${sectionsSummary}

Write in ${language === "zh" ? "Chinese" : "English"}.
Focus on the main findings and conclusions.
Respond with ONLY the summary, no markdown.`;

    try {
      return await this.llmEngine.chatSimple(prompt);
    } catch {
      return `Research on '${topic}' covering ${sections.length} main themes.`;
    }
  }
}

/**
 * Create finding from plain object
 */
export function createFinding(data: Partial<Finding>): Finding {
  return {
    content: data.content || "",
    source: data.source || "",
    url: data.url || "",
    title: data.title || "",
    author: data.author || "",
    date: data.date || "",
    relevanceScore: data.relevanceScore ?? 1.0,
    qualityScore: data.qualityScore ?? 1.0,
    metadata: data.metadata || {},
  };
}

/**
 * Synthesize findings (convenience function)
 */
export async function synthesizeFindings(
  topic: string,
  findings: Array<Partial<Finding>>,
  options: Partial<SynthesisRequest> = {}
): Promise<SynthesisResult> {
  // Convert plain objects to Finding objects
  const findingObjects = findings.map(createFinding);

  const request: SynthesisRequest = {
    topic,
    findings: findingObjects,
    maxSections: options.maxSections ?? DEFAULT_SYNTHESIS_OPTIONS.maxSections!,
    includeSources: options.includeSources ?? DEFAULT_SYNTHESIS_OPTIONS.includeSources!,
    citationStyle: options.citationStyle ?? DEFAULT_SYNTHESIS_OPTIONS.citationStyle!,
    includeSummary: options.includeSummary ?? DEFAULT_SYNTHESIS_OPTIONS.includeSummary!,
    includeToc: options.includeToc ?? DEFAULT_SYNTHESIS_OPTIONS.includeToc!,
    language: options.language ?? DEFAULT_SYNTHESIS_OPTIONS.language!,
  };

  const synthesizer = new LLMSynthesizer();
  return synthesizer.synthesize(request);
}