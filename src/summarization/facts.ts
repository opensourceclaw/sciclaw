/**
 * Fact Extractor - Extract structured facts and data from content
 */

import { ExtractedFact, FactsResult, LLMEngine } from './types.js';
import { MessageRole } from './types.js';
import type { ChatMessage, ChatOptions } from './types.js';

const SYSTEM_PROMPT = `You are an expert at extracting factual information from text.
Your task is to identify and extract structured facts, statistics, dates, numbers, and specific claims from the given content.
Return your response as a JSON array of facts.`;

const USER_PROMPT_TEMPLATE = `Extract up to {count} factual statements from the following content.

For each fact, provide:
1. statement: The factual statement (complete sentence)
2. subject: The subject of the fact
3. predicate: What is being claimed about the subject
4. value: The actual value/fact (can be a number, date, or text)
5. confidence: Confidence score (0.0-1.0) based on how explicitly stated
6. source: Source section if applicable

Content:
{content}

Return as JSON array:
[{"statement": "...", "subject": "...", "predicate": "...", "value": "...", "confidence": 0.9, "source": "..."}, ...]`;

export interface FactExtractorConfig {
  defaultCount: number;
  maxFacts: number;
  minConfidence: number;
  maxContentLength: number;
  maxRetries: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: FactExtractorConfig = {
  defaultCount: 10,
  maxFacts: 20,
  minConfidence: 0.5,
  maxContentLength: 50000,
  maxRetries: 3,
  timeoutMs: 30000,
};

export class FactExtractor {
  private llmEngine: LLMEngine;
  private config: FactExtractorConfig;

  constructor(llmEngine: LLMEngine, config?: Partial<FactExtractorConfig>) {
    this.llmEngine = llmEngine;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async extractFacts(
    content: string,
    count?: number,
    maxRetries?: number,
  ): Promise<FactsResult> {
    const startTime = Date.now();

    if (!content || !content.trim()) {
      return {
        facts: [],
        count: 0,
        model: this.llmEngine.model,
        durationMs: 0,
        success: false,
        error: 'Empty content provided',
        metadata: {},
      };
    }

    const finalCount = Math.min(count ?? this.config.defaultCount, this.config.maxFacts);
    const retries = maxRetries ?? this.config.maxRetries;

    let truncatedContent = content;
    if (content.length > this.config.maxContentLength) {
      truncatedContent = content.slice(0, this.config.maxContentLength);
    }

    const prompt = USER_PROMPT_TEMPLATE
      .replace('{count}', String(finalCount))
      .replace('{content}', truncatedContent);

    const messages: ChatMessage[] = [
      { role: MessageRole.SYSTEM, content: SYSTEM_PROMPT },
      { role: MessageRole.USER, content: prompt },
    ];

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.llmEngine.chat(messages, {
          temperature: 0.2,
          maxTokens: 1500,
        });

        let facts = this.parseResponse(response.content);

        facts = facts.filter((f) => f.confidence >= this.config.minConfidence);
        facts.sort((a, b) => b.confidence - a.confidence);
        facts = facts.slice(0, finalCount);

        const durationMs = Date.now() - startTime;

        return {
          facts,
          count: facts.length,
          model: this.llmEngine.model,
          durationMs,
          success: true,
          metadata: {},
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries - 1) {
          await this.sleep(1000 * (attempt + 1));
        }
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      facts: [],
      count: 0,
      model: this.llmEngine.model,
      durationMs,
      success: false,
      error: lastError?.message ?? 'Unknown error',
      metadata: {},
    };
  }

  extractFactsBatch(
    contents: string[],
    count?: number,
  ): Promise<FactsResult[]> {
    return Promise.all(contents.map((c) => this.extractFacts(c, count)));
  }

  toStructuredData(factsResult: FactsResult): Record<string, unknown> {
    return {
      count: factsResult.count,
      success: factsResult.success,
      facts: factsResult.facts.map((f) => ({
        subject: f.subject,
        predicate: f.predicate,
        value: f.value,
        confidence: f.confidence,
      })),
    };
  }

  private parseResponse(response: string): ExtractedFact[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
        return data.map((item) => ({
          statement: String(item.statement ?? ''),
          subject: String(item.subject ?? ''),
          predicate: String(item.predicate ?? ''),
          value: item.value,
          confidence: Number(item.confidence ?? 0.5),
          source: item.source as string | undefined,
          context: item.context as string | undefined,
        }));
      }
    } catch {
      // Fall through to fallback parse
    }

    return this.fallbackParse(response);
  }

  private fallbackParse(response: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^\d+[.)]\s+(.+)/);
      if (match) {
        facts.push({
          statement: match[1]!.trim(),
          subject: '',
          predicate: '',
          value: match[1]!.trim(),
          confidence: 0.5,
        });
      }
    }

    return facts;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
