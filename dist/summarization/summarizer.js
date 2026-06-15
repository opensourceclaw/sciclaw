/**
 * Content Summarizer - LLM-based content summarization
 *
 * Provides configurable summarization with length/style options,
 * retry logic, and extractive fallback.
 */
import { SummarizationLength, SummarizationStyle, } from './types.js';
const PROMPT_TEMPLATES = {
    [`${SummarizationLength.SHORT}-${SummarizationStyle.CONCISE}`]: 'Summarize the following content in 1-2 concise sentences:\n\n{content}\n\nSummary:',
    [`${SummarizationLength.SHORT}-${SummarizationStyle.DETAILED}`]: 'Summarize the following content in 1-2 sentences with some details:\n\n{content}\n\nSummary:',
    [`${SummarizationLength.SHORT}-${SummarizationStyle.TECHNICAL}`]: 'Provide a technical summary of the following content in 1-2 sentences:\n\n{content}\n\nTechnical Summary:',
    [`${SummarizationLength.SHORT}-${SummarizationStyle.CASUAL}`]: 'Quickly summarize this in casual language (1-2 sentences):\n\n{content}\n\nQuick Summary:',
    [`${SummarizationLength.MEDIUM}-${SummarizationStyle.CONCISE}`]: 'Summarize the following content in one concise paragraph using bullet points if helpful:\n\n{content}\n\nConcise Summary:',
    [`${SummarizationLength.MEDIUM}-${SummarizationStyle.DETAILED}`]: 'Summarize the following content in a detailed paragraph:\n\n{content}\n\nDetailed Summary:',
    [`${SummarizationLength.MEDIUM}-${SummarizationStyle.TECHNICAL}`]: 'Provide a technical summary of the following content in one paragraph with precise terminology:\n\n{content}\n\nTechnical Summary:',
    [`${SummarizationLength.MEDIUM}-${SummarizationStyle.CASUAL}`]: 'Summarize this in casual, conversational tone in one paragraph:\n\n{content}\n\nCasual Summary:',
    [`${SummarizationLength.LONG}-${SummarizationStyle.CONCISE}`]: 'Summarize the following content comprehensively but concisely, covering all key points:\n\n{content}\n\nComprehensive Summary:',
    [`${SummarizationLength.LONG}-${SummarizationStyle.DETAILED}`]: 'Provide a thorough, detailed summary of the following content, covering all important aspects:\n\n{content}\n\nDetailed Summary:',
    [`${SummarizationLength.LONG}-${SummarizationStyle.TECHNICAL}`]: 'Provide a comprehensive technical summary of the following content with precise terminology:\n\n{content}\n\nTechnical Summary:',
    [`${SummarizationLength.LONG}-${SummarizationStyle.CASUAL}`]: 'Summarize this content in a friendly, conversational way with all key points:\n\n{content}\n\nFriendly Summary:',
};
const MAX_TOKENS = {
    [SummarizationLength.SHORT]: 100,
    [SummarizationLength.MEDIUM]: 300,
    [SummarizationLength.LONG]: 800,
};
const DEFAULT_CONFIG = {
    defaultLength: SummarizationLength.MEDIUM,
    defaultStyle: SummarizationStyle.CONCISE,
    maxContentLength: 50000,
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
};
export class Summarizer {
    llmEngine;
    config;
    constructor(llmEngine, config) {
        this.llmEngine = llmEngine;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async summarize(content, length, style, maxRetries) {
        const startTime = Date.now();
        if (!content || !content.trim()) {
            return {
                summary: '',
                originalLength: 0,
                summaryLength: 0,
                lengthType: length ?? this.config.defaultLength,
                style: style ?? this.config.defaultStyle,
                model: this.llmEngine.model,
                durationMs: 0,
                success: false,
                error: 'Empty content provided',
                metadata: {},
            };
        }
        const finalLength = length ?? this.config.defaultLength;
        const finalStyle = style ?? this.config.defaultStyle;
        const retries = maxRetries ?? this.config.maxRetries;
        let truncatedContent = content;
        const originalLength = content.length;
        if (originalLength > this.config.maxContentLength) {
            truncatedContent = content.slice(0, this.config.maxContentLength);
        }
        const prompt = this.buildPrompt(truncatedContent, finalLength, finalStyle);
        let lastError;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await this.llmEngine.chatSimple(prompt, {
                    temperature: 0.5,
                    maxTokens: MAX_TOKENS[finalLength],
                });
                const durationMs = Date.now() - startTime;
                return {
                    summary: response.trim(),
                    originalLength,
                    summaryLength: response.length,
                    lengthType: finalLength,
                    style: finalStyle,
                    model: this.llmEngine.model,
                    durationMs,
                    success: true,
                    metadata: {},
                };
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempt < retries - 1) {
                    await this.sleep(this.config.retryDelayMs * (attempt + 1));
                }
            }
        }
        const durationMs = Date.now() - startTime;
        return {
            summary: '',
            originalLength,
            summaryLength: 0,
            lengthType: finalLength,
            style: finalStyle,
            model: this.llmEngine.model,
            durationMs,
            success: false,
            error: lastError?.message ?? 'Unknown error',
            metadata: {},
        };
    }
    async summarizeBatch(contents, length, style) {
        const results = [];
        for (const content of contents) {
            const result = await this.summarize(content, length, style);
            results.push(result);
        }
        return results;
    }
    /**
     * Extractive summarization fallback - takes first N sentences
     */
    extractiveSummarize(content, length) {
        const sentences = content.split('. ');
        let n;
        if (length === SummarizationLength.SHORT)
            n = 2;
        else if (length === SummarizationLength.MEDIUM)
            n = 5;
        else
            n = 10;
        const selected = sentences.slice(0, n);
        let summary = selected.join('. ');
        if (summary && !summary.endsWith('.'))
            summary += '.';
        return {
            summary,
            originalLength: content.length,
            summaryLength: summary.length,
            lengthType: length,
            style: SummarizationStyle.CONCISE,
            model: 'extractive',
            durationMs: 0,
            success: true,
            metadata: { method: 'extractive' },
        };
    }
    buildPrompt(content, length, style) {
        const key = `${length}-${style}`;
        const template = PROMPT_TEMPLATES[key] ?? PROMPT_TEMPLATES[`${length}-${SummarizationStyle.CONCISE}`];
        return template.replace('{content}', content);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=summarizer.js.map