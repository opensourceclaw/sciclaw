/**
 * Key Point Extractor - Extract key points and core arguments from content
 */

import { KeyPoint, KeyPointsResult, LLMEngine } from './types.js';
import { MessageRole } from './types.js';
import type { ChatMessage, ChatOptions } from './types.js';

const SYSTEM_PROMPT = `You are an expert at analyzing content and extracting key points.
Your task is to identify the most important points and arguments from the given text.
Return your response as a JSON array of key points.`;

const USER_PROMPT_TEMPLATE = `Extract the {count} most important key points from the following content.

For each key point, provide:
1. text: The key point (1-2 sentences)
2. importance: Importance score (0.0-1.0)
3. category: Category/theme if applicable

Content:
{content}

Return as JSON array:
[{"text": "...", "importance": 0.9, "category": "..."}, ...]`;

export interface KeyPointExtractorConfig {
  defaultCount: number;
  maxPoints: number;
  minImportance: number;
  maxContentLength: number;
  maxRetries: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: KeyPointExtractorConfig = {
  defaultCount: 5,
  maxPoints: 10,
  minImportance: 0.5,
  maxContentLength: 50000,
  maxRetries: 3,
  timeoutMs: 30000,
};

export class KeyPointExtractor {
  private llmEngine: LLMEngine;
  private config: KeyPointExtractorConfig;

  constructor(llmEngine: LLMEngine, config?: Partial<KeyPointExtractorConfig>) {
    this.llmEngine = llmEngine;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async extractKeyPoints(
    content: string,
    count?: number,
    maxRetries?: number,
  ): Promise<KeyPointsResult> {
    const startTime = Date.now();

    if (!content || !content.trim()) {
      return {
        keyPoints: [],
        count: 0,
        model: this.llmEngine.model,
        durationMs: 0,
        success: false,
        error: 'Empty content provided',
        metadata: {},
      };
    }

    const finalCount = Math.min(count ?? this.config.defaultCount, this.config.maxPoints);
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
          temperature: 0.3,
          maxTokens: 1000,
        });

        let keyPoints = this.parseResponse(response.content);

        keyPoints = keyPoints.filter((kp) => kp.importance >= this.config.minImportance);
        keyPoints.sort((a, b) => b.importance - a.importance);
        keyPoints = keyPoints.slice(0, finalCount);

        const durationMs = Date.now() - startTime;

        return {
          keyPoints,
          count: keyPoints.length,
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
      keyPoints: [],
      count: 0,
      model: this.llmEngine.model,
      durationMs,
      success: false,
      error: lastError?.message ?? 'Unknown error',
      metadata: {},
    };
  }

  extractKeyPointsBatch(
    contents: string[],
    count?: number,
  ): Promise<KeyPointsResult[]> {
    return Promise.all(contents.map((c) => this.extractKeyPoints(c, count)));
  }

  private parseResponse(response: string): KeyPoint[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
        return data.map((item) => ({
          text: String(item.text ?? ''),
          importance: Number(item.importance ?? 0.5),
          category: item.category as string | undefined,
          supportingEvidence: (item.supporting_evidence as string[]) ?? [],
          sourceSection: item.source_section as string | undefined,
        }));
      }
    } catch {
      // Fall through to fallback parse
    }

    return this.fallbackParse(response);
  }

  private fallbackParse(response: string): KeyPoint[] {
    const keyPoints: KeyPoint[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^\d+[.)]\s+(.+)/);
      if (match) {
        keyPoints.push({
          text: match[1]!.trim(),
          importance: 0.5,
          supportingEvidence: [],
        });
      }
    }

    return keyPoints;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
