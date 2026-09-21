/**
 * Parallel Content Extraction Module
 *
 * Provides parallel extraction with thread/concurrent processing.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */

import { ExtractedContent, extractContent } from './content_extraction.js';

/**
 * A content extraction task
 */
export interface ExtractionTask {
  url: string;
  index: number;
  timeout: number;
}

/**
 * Result of extraction task
 */
export interface ParallelExtractionResult {
  url: string;
  index: number;
  success: boolean;
  content?: ExtractedContent;
  error?: string;
  duration: number;
}

/**
 * Parallel content extractor
 */
export class ParallelExtractor {
  private maxWorkers: number;
  private timeout: number;
  private retryCount: number;

  constructor(
    maxWorkers: number = 5,
    timeout: number = 30,
    retryCount: number = 0
  ) {
    this.maxWorkers = maxWorkers;
    this.timeout = timeout;
    this.retryCount = retryCount;
  }

  /**
   * Extract content from multiple URLs in parallel
   */
  async extractUrls(
    urls: string[],
    progressCallback?: (completed: number, total: number) => void
  ): Promise<ParallelExtractionResult[]> {
    if (urls.length === 0) return [];

    const results: ParallelExtractionResult[] = new Array(urls.length);
    let completed = 0;
    const total = urls.length;

    // Create tasks
    const tasks = urls.map((url, i) => ({
      url,
      index: i,
      timeout: this.timeout,
    }));

    // Process in batches
    const batches: ExtractionTask[][] = [];
    for (let i = 0; i < tasks.length; i += this.maxWorkers) {
      batches.push(tasks.slice(i, i + this.maxWorkers));
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(task => this.extractSingle(task.url, task.index))
      );

      for (const result of batchResults) {
        results[result.index] = result;
        completed++;
        if (progressCallback) {
          progressCallback(completed, total);
        }
      }
    }

    return results;
  }

  /**
   * Extract content from a single URL
   */
  private async extractSingle(url: string, index: number): Promise<ParallelExtractionResult> {
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        const content = await extractContent(url, this.timeout);

        if (content) {
          const duration = Date.now() - startTime;
          return {
            url,
            index,
            success: true,
            content,
            duration,
          };
        }

        // No content, but no error - treat as failure
        if (attempt < this.retryCount) {
          console.warn(`Retry ${attempt + 1}/${this.retryCount} for ${url}`);
          await this.sleep(500 * (attempt + 1));
          continue;
        }

        const duration = Date.now() - startTime;
        return {
          url,
          index,
          success: false,
          error: "No content extracted",
          duration,
        };
      } catch (error) {
        const err = error as Error;
        if (attempt < this.retryCount) {
          console.warn(`Retry ${attempt + 1}/${this.retryCount} for ${url}: ${err.message}`);
          await this.sleep(500 * (attempt + 1));
          continue;
        }

        const duration = Date.now() - startTime;
        return {
          url,
          index,
          success: false,
          error: err.message,
          duration,
        };
      }
    }

    // Should not reach here
    const duration = Date.now() - startTime;
    return {
      url,
      index,
      success: false,
      error: "Max retries exceeded",
      duration,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract content sequentially (for comparison/debugging)
   */
  async extractUrlsSequential(
    urls: string[],
    progressCallback?: (completed: number, total: number) => void
  ): Promise<ParallelExtractionResult[]> {
    const results: ParallelExtractionResult[] = [];
    const total = urls.length;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (url) {
        const result = await this.extractSingle(url, i);
        results.push(result);
      }

      if (progressCallback) {
        progressCallback(i + 1, total);
      }
    }

    return results;
  }
}

/**
 * Extract content from multiple URLs in parallel
 */
export async function extractParallel(
  urls: string[],
  maxWorkers: number = 5,
  timeout: number = 30,
  progressCallback?: (completed: number, total: number) => void
): Promise<ParallelExtractionResult[]> {
  const extractor = new ParallelExtractor(maxWorkers, timeout);
  return extractor.extractUrls(urls, progressCallback);
}

/**
 * Extraction timing statistics
 */
export interface ExtractionTimingStats {
  results: ParallelExtractionResult[];
  totalUrls: number;
  successful: number;
  failed: number;
  successRate: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
}

/**
 * Extract content and return timing statistics
 */
export async function extractWithTiming(
  urls: string[],
  maxWorkers: number = 5,
  timeout: number = 30
): Promise<ExtractionTimingStats> {
  const extractor = new ParallelExtractor(maxWorkers, timeout);

  const startTime = Date.now();
  const results = await extractor.extractUrls(urls);
  const totalDuration = Date.now() - startTime;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const durations = successful.map(r => r.duration);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

  return {
    results,
    totalUrls: urls.length,
    successful: successful.length,
    failed: failed.length,
    successRate: urls.length > 0 ? successful.length / urls.length : 0,
    totalDuration,
    avgDuration,
    minDuration,
    maxDuration,
  };
}

// Export all
export default {
  ExtractionTask: {} as ExtractionTask,
  ParallelExtractionResult: {} as ParallelExtractionResult,
  ParallelExtractor,
  extractParallel,
  extractWithTiming,
};