/**
 * Summarization types - Data classes and interfaces for the summarization module
 */
export declare enum SummarizationLength {
    SHORT = "short",
    MEDIUM = "medium",
    LONG = "long"
}
export declare enum SummarizationStyle {
    CONCISE = "concise",
    DETAILED = "detailed",
    TECHNICAL = "technical",
    CASUAL = "casual"
}
export interface SummaryResult {
    summary: string;
    originalLength: number;
    summaryLength: number;
    lengthType: SummarizationLength;
    style: SummarizationStyle;
    model: string;
    durationMs: number;
    success: boolean;
    error?: string;
    metadata: Record<string, unknown>;
}
export interface KeyPoint {
    text: string;
    importance: number;
    category?: string;
    supportingEvidence: string[];
    sourceSection?: string;
}
export interface KeyPointsResult {
    keyPoints: KeyPoint[];
    count: number;
    model: string;
    durationMs: number;
    success: boolean;
    error?: string;
    metadata: Record<string, unknown>;
}
export interface ExtractedFact {
    statement: string;
    subject: string;
    predicate: string;
    value: unknown;
    confidence: number;
    source?: string;
    context?: string;
}
export interface FactsResult {
    facts: ExtractedFact[];
    count: number;
    model: string;
    durationMs: number;
    success: boolean;
    error?: string;
    metadata: Record<string, unknown>;
}
/**
 * LLMEngine interface - abstraction for LLM providers
 * Implementations are injected into summarizer/extractors
 */
export interface LLMEngine {
    model: string;
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
    chatSimple(prompt: string, options?: ChatOptions): Promise<string>;
}
export interface ChatMessage {
    role: MessageRole;
    content: string;
}
export declare enum MessageRole {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant"
}
export interface ChatOptions {
    temperature?: number;
    maxTokens?: number;
}
export interface ChatResponse {
    content: string;
    model: string;
}
export declare function compressionRatio(result: SummaryResult): number;
//# sourceMappingURL=types.d.ts.map