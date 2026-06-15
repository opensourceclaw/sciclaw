/**
 * Key Point Extractor - Extract key points and core arguments from content
 */
import { MessageRole } from './types.js';
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
const DEFAULT_CONFIG = {
    defaultCount: 5,
    maxPoints: 10,
    minImportance: 0.5,
    maxContentLength: 50000,
    maxRetries: 3,
    timeoutMs: 30000,
};
export class KeyPointExtractor {
    llmEngine;
    config;
    constructor(llmEngine, config) {
        this.llmEngine = llmEngine;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async extractKeyPoints(content, count, maxRetries) {
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
        const messages = [
            { role: MessageRole.SYSTEM, content: SYSTEM_PROMPT },
            { role: MessageRole.USER, content: prompt },
        ];
        let lastError;
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
            }
            catch (err) {
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
    extractKeyPointsBatch(contents, count) {
        return Promise.all(contents.map((c) => this.extractKeyPoints(c, count)));
    }
    parseResponse(response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return data.map((item) => ({
                    text: String(item.text ?? ''),
                    importance: Number(item.importance ?? 0.5),
                    category: item.category,
                    supportingEvidence: item.supporting_evidence ?? [],
                    sourceSection: item.source_section,
                }));
            }
        }
        catch {
            // Fall through to fallback parse
        }
        return this.fallbackParse(response);
    }
    fallbackParse(response) {
        const keyPoints = [];
        const lines = response.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            const match = trimmed.match(/^\d+[.)]\s+(.+)/);
            if (match) {
                keyPoints.push({
                    text: match[1].trim(),
                    importance: 0.5,
                    supportingEvidence: [],
                });
            }
        }
        return keyPoints;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=key_points.js.map