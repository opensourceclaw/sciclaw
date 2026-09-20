/**
 * Research Runner - Coordinates the full research workflow
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */

import { search } from "@sciclaw/core";
import { ResearchPlanner } from "./planner.js";
import { ResearchSynthesizer, ReportFormatter } from "./synthesizer.js";
import type {
  ResearchFinding,
  ResearchSearchResult,
  ExtractedContent,
  ResearchReport,
} from "./types.js";

/**
 * Research Runner - Coordinates the full research workflow with parallel processing
 */
export class ResearchRunner {
  private planner: ResearchPlanner;
  private synthesizer: ResearchSynthesizer;
  private maxContent: number;
  private maxWorkers: number;

  constructor(options: { maxContent?: number; maxWorkers?: number } = {}) {
    this.planner = new ResearchPlanner();
    this.synthesizer = new ResearchSynthesizer();
    this.maxContent = options.maxContent ?? 5;
    this.maxWorkers = options.maxWorkers ?? 5;
  }

  /**
   * Run full research workflow with parallel processing
   */
  async run(topic: string, depth: number = 3): Promise<ResearchReport> {
    // Create research plan
    const plan = this.planner.createPlan(topic, depth);

    // Collect all queries to research
    const allQueries = [...plan.queries, ...plan.subtopics];

    // Execute searches first (sequential to avoid rate limiting)
    const searchResultsByQuery = new Map<string, ResearchSearchResult[]>();
    for (const query of allQueries) {
      const results = await this.search(query);
      searchResultsByQuery.set(query, results);
    }

    // Extract content in parallel
    const findings: ResearchFinding[] = [];

    // Process all queries
    const extractionPromises = allQueries.map(async (query) => {
      const results = searchResultsByQuery.get(query) || [];
      return this.extractContentParallel(query, results);
    });

    // Wait for all extractions to complete
    const extractionResults = await Promise.allSettled(extractionPromises);

    for (const result of extractionResults) {
      if (result.status === "fulfilled") {
        findings.push(result.value);
      }
    }

    // Convert findings to synthesizer format
    const synthFindings = this.convertFindings(findings);

    // Synthesize report
    const report = this.synthesizer.synthesize(topic, synthFindings);

    return report;
  }

  /**
   * Search for results
   */
  private async search(query: string): Promise<ResearchSearchResult[]> {
    try {
      const results = await search({
        query,
        maxResults: 10,
        useCache: true,
      });

      return results.map((r, i) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        score: 1.0 - i * 0.1,
        timestamp: new Date(),
        source: r.source,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Extract content from URLs in parallel
   */
  private async extractContentParallel(
    query: string,
    searchResults: ResearchSearchResult[]
  ): Promise<ResearchFinding> {
    const urls = searchResults.slice(0, this.maxContent).map((r) => r.url);

    // Extract content from each URL
    const extractionPromises = urls.map((url) => this.extractContent(url));
    const extractionResults = await Promise.allSettled(extractionPromises);

    const extractedContent: ExtractedContent[] = [];
    for (const result of extractionResults) {
      if (result.status === "fulfilled" && result.value) {
        extractedContent.push(result.value);
      }
    }

    return {
      query,
      searchResults,
      extractedContent,
      timestamp: new Date(),
    };
  }

  /**
   * Extract content from a single URL
   */
  private async extractContent(url: string): Promise<ExtractedContent | null> {
    try {
      // Simple content extraction (can be enhanced with cheerio)
      const axios = await import("axios");
      const cheerio = await import("cheerio");

      const response = await axios.default.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SciClaw/3.0)",
        },
      });

      const $ = cheerio.load(response.data);

      // Remove script and style elements
      $("script, style, nav, header, footer, aside").remove();

      // Extract main content
      const title = $("title").text() || $("h1").first().text() || "";
      const text = $("article, main, .content, #content, body")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      return {
        title,
        url,
        text: text.slice(0, 5000), // Limit text length
      };
    } catch {
      return null;
    }
  }

  /**
   * Convert research findings to synthesizer format
   */
  private convertFindings(
    findings: ResearchFinding[]
  ): Array<{ theme: string; content: string; source: string; confidence: number }> {
    const result: Array<{
      theme: string;
      content: string;
      source: string;
      confidence: number;
    }> = [];

    for (const finding of findings) {
      // Use search result snippets as content
      for (const sr of finding.searchResults) {
        result.push({
          theme: finding.query,
          content: `${sr.title}\n${sr.snippet}`,
          source: sr.url,
          confidence: sr.score,
        });
      }

      // Add extracted content summaries
      for (const ec of finding.extractedContent) {
        result.push({
          theme: finding.query,
          content: `${ec.title}\n${ec.text.slice(0, 1000)}`,
          source: ec.url,
          confidence: 0.8,
        });
      }
    }

    return result;
  }
}

/**
 * Run full research workflow (convenience function)
 */
export async function runResearch(
  topic: string,
  depth: number = 3
): Promise<ResearchReport> {
  const runner = new ResearchRunner();
  return runner.run(topic, depth);
}