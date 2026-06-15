/**
 * Summarization Engine - Unified engine with error handling and fallbacks
 */

import {
  SummarizationLength,
  SummarizationStyle,
  SummaryResult,
  KeyPointsResult,
  FactsResult,
  LLMEngine,
} from './types.js';
import { Summarizer, SummarizerConfig } from './summarizer.js';
import { KeyPointExtractor, KeyPointExtractorConfig } from './key_points.js';
import { FactExtractor, FactExtractorConfig } from './facts.js';
import { SummarizationError, LLMError, RateLimitError, FallbackError } from './errors.js';

export enum FallbackStrategy {
  RETRY = 'retry',
  REDUCE_LENGTH = 'reduce_length',
  SIMPLIFY_STYLE = 'simplify_style',
  FALLBACK_PROVIDER = 'fallback_provider',
  EXTRACTIVE = 'extractive',
}

export interface EngineConfig {
  defaultProvider: string;
  fallbackProviders: string[];
  defaultModel?: string;
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  defaultTimeoutMs: number;
  summaryTimeoutMs: number;
  keyPointsTimeoutMs: number;
  factsTimeoutMs: number;
  targetLatencyMs: number;
  fallbackStrategies: FallbackStrategy[];
}

const DEFAULT_CONFIG: EngineConfig = {
  defaultProvider: 'deepseek',
  fallbackProviders: ['glm', 'kimi'],
  maxRetries: 3,
  retryDelayMs: 1000,
  exponentialBackoff: true,
  defaultTimeoutMs: 30000,
  summaryTimeoutMs: 30000,
  keyPointsTimeoutMs: 30000,
  factsTimeoutMs: 30000,
  targetLatencyMs: 3000,
  fallbackStrategies: [
    FallbackStrategy.RETRY,
    FallbackStrategy.REDUCE_LENGTH,
    FallbackStrategy.SIMPLIFY_STYLE,
    FallbackStrategy.FALLBACK_PROVIDER,
    FallbackStrategy.EXTRACTIVE,
  ],
};

export class PerformanceTracker {
  totalRequests = 0;
  successfulRequests = 0;
  failedRequests = 0;
  totalDurationMs = 0;
  private latencies: number[] = [];

  record(success: boolean, durationMs: number): void {
    this.totalRequests++;
    if (success) this.successfulRequests++;
    else this.failedRequests++;
    this.totalDurationMs += durationMs;
    this.latencies.push(durationMs);
  }

  get successRate(): number {
    if (this.totalRequests === 0) return 0;
    return this.successfulRequests / this.totalRequests;
  }

  get averageLatencyMs(): number {
    if (this.totalRequests === 0) return 0;
    return this.totalDurationMs / this.totalRequests;
  }

  get p95LatencyMs(): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[Math.min(index, sorted.length - 1)]!;
  }

  getStats(): Record<string, unknown> {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.successRate,
      averageLatencyMs: this.averageLatencyMs,
      p95LatencyMs: this.p95LatencyMs,
    };
  }
}

export class SummarizationEngine {
  private config: EngineConfig;
  private llmEngine: LLMEngine;
  private summarizer: Summarizer;
  private keyPointExtractor: KeyPointExtractor;
  private factExtractor: FactExtractor;
  performance: PerformanceTracker;

  constructor(llmEngine: LLMEngine, config?: Partial<EngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.llmEngine = llmEngine;
    this.performance = new PerformanceTracker();

    this.summarizer = new Summarizer(this.llmEngine, {
      maxRetries: this.config.maxRetries,
    });

    this.keyPointExtractor = new KeyPointExtractor(this.llmEngine, {
      maxRetries: this.config.maxRetries,
    });

    this.factExtractor = new FactExtractor(this.llmEngine, {
      maxRetries: this.config.maxRetries,
    });
  }

  async summarize(
    content: string,
    length: SummarizationLength = SummarizationLength.MEDIUM,
    style: SummarizationStyle = SummarizationStyle.CONCISE,
  ): Promise<SummaryResult> {
    const startTime = Date.now();

    const result = await this.summarizer.summarize(content, length, style);
    if (result.success) {
      this.performance.record(true, Date.now() - startTime);
      return result;
    }

    const fallbackResult = await this.fallbackSummarize(content, length, style);
    this.performance.record(fallbackResult.success, Date.now() - startTime);
    return fallbackResult;
  }

  async extractKeyPoints(
    content: string,
    count = 5,
  ): Promise<KeyPointsResult> {
    const startTime = Date.now();

    const result = await this.keyPointExtractor.extractKeyPoints(content, count);
    if (result.success) {
      this.performance.record(true, Date.now() - startTime);
      return result;
    }

    const fallbackResult = this.fallbackKeyPoints(content, count);
    this.performance.record(fallbackResult.success, Date.now() - startTime);
    return fallbackResult;
  }

  async extractFacts(
    content: string,
    count = 10,
  ): Promise<FactsResult> {
    const startTime = Date.now();

    const result = await this.factExtractor.extractFacts(content, count);
    if (result.success) {
      this.performance.record(true, Date.now() - startTime);
      return result;
    }

    const fallbackResult = this.fallbackFacts(content, count);
    this.performance.record(fallbackResult.success, Date.now() - startTime);
    return fallbackResult;
  }

  async process(
    content: string,
    options: {
      extractSummary?: boolean;
      extractKeyPoints?: boolean;
      extractFacts?: boolean;
      summaryLength?: SummarizationLength;
      summaryStyle?: SummarizationStyle;
      keyPointsCount?: number;
      factsCount?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    const {
      extractSummary = true,
      extractKeyPoints = true,
      extractFacts = true,
      summaryLength = SummarizationLength.MEDIUM,
      summaryStyle = SummarizationStyle.CONCISE,
      keyPointsCount = 5,
      factsCount = 10,
    } = options;

    const result: Record<string, unknown> = {
      contentLength: content.length,
    };

    if (extractSummary) {
      const summaryResult = await this.summarize(content, summaryLength, summaryStyle);
      result.summary = summaryResult;
    }

    if (extractKeyPoints) {
      const kpResult = await this.extractKeyPoints(content, keyPointsCount);
      result.keyPoints = kpResult;
    }

    if (extractFacts) {
      const factsResult = await this.extractFacts(content, factsCount);
      result.facts = factsResult;
    }

    result.success = true;
    return result;
  }

  getPerformanceStats(): Record<string, unknown> {
    return {
      ...this.performance.getStats(),
      meetsLatencyTarget: this.performance.averageLatencyMs < this.config.targetLatencyMs,
      targetLatencyMs: this.config.targetLatencyMs,
    };
  }

  private async fallbackSummarize(
    content: string,
    length: SummarizationLength,
    style: SummarizationStyle,
  ): Promise<SummaryResult> {
    const strategiesTried: FallbackStrategy[] = [];

    for (const strategy of this.config.fallbackStrategies) {
      try {
        if (strategy === FallbackStrategy.RETRY) {
          const result = await this.summarizer.summarize(content, length, style);
          if (result.success) return result;
        } else if (strategy === FallbackStrategy.REDUCE_LENGTH) {
          const result = await this.summarizer.summarize(content, SummarizationLength.SHORT, style);
          if (result.success) return result;
        } else if (strategy === FallbackStrategy.SIMPLIFY_STYLE) {
          const result = await this.summarizer.summarize(content, length, SummarizationStyle.CONCISE);
          if (result.success) return result;
        } else if (strategy === FallbackStrategy.EXTRACTIVE) {
          const result = this.summarizer.extractiveSummarize(content, length);
          if (result.success) return result;
        }

        strategiesTried.push(strategy);
      } catch {
        strategiesTried.push(strategy);
        continue;
      }
    }

    return {
      summary: '',
      originalLength: content.length,
      summaryLength: 0,
      lengthType: length,
      style,
      model: this.llmEngine.model,
      durationMs: 0,
      success: false,
      error: `All fallback strategies exhausted. Tried: ${strategiesTried.join(', ')}`,
      metadata: {},
    };
  }

  private fallbackKeyPoints(content: string, count: number): KeyPointsResult {
    const sentences = content.split('. ');
    const keyPoints = [];

    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const text = sentences[i]!.trim();
      if (text) {
        keyPoints.push({
          text: text + '.',
          importance: 1.0 - i * 0.1,
          supportingEvidence: [],
        });
      }
    }

    return {
      keyPoints,
      count: keyPoints.length,
      model: 'extractive',
      durationMs: 0,
      success: true,
      metadata: { method: 'extractive' },
    };
  }

  private fallbackFacts(content: string, count: number): FactsResult {
    const facts = [];
    const sentences = content.split('. ');

    const patterns = [
      /\d+%/g,
      /\$\d+/g,
      /\d{4}/g,
      /\d+\s*(million|billion|thousand)/gi,
      /\d+\.\d+/g,
    ];

    for (const sentence of sentences) {
      for (const pattern of patterns) {
        const match = sentence.match(pattern);
        if (match) {
          facts.push({
            statement: sentence.trim() + '.',
            subject: '',
            predicate: '',
            value: match[0],
            confidence: 0.5,
          });
          break;
        }
      }
      if (facts.length >= count) break;
    }

    return {
      facts,
      count: facts.length,
      model: 'extractive',
      durationMs: 0,
      success: true,
      metadata: { method: 'extractive' },
    };
  }
}
