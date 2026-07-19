/**
 * LLM Types - Type definitions for LLM module
 */
/**
 * Message role enum
 */
export declare enum MessageRole {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant",
    TOOL = "tool"
}
/**
 * Chat message
 */
export interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
}
/**
 * Chat message utilities
 */
export declare const ChatMessageUtil: {
    toDict(msg: ChatMessage): Record<string, unknown>;
    fromDict(data: Record<string, unknown>): ChatMessage;
};
/**
 * Token usage info
 */
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
/**
 * Chat completion response
 */
export interface ChatCompletion {
    id: string;
    model: string;
    created: number;
    role: MessageRole;
    content: string;
    finishReason: string;
    usage: TokenUsage;
    rawResponse?: Record<string, unknown>;
}
/**
 * Chat completion utilities
 */
export declare const ChatCompletionUtil: {
    toDict(completion: ChatCompletion): Record<string, unknown>;
};
/**
 * Chat completion stream chunk
 */
export interface ChatCompletionStreamChunk {
    id: string;
    model: string;
    created: number;
    role?: MessageRole;
    content: string;
    delta: string;
    finishReason?: string;
}
/**
 * Chat completion stream chunk utilities
 */
export declare const ChatCompletionStreamChunkUtil: {
    toDict(chunk: ChatCompletionStreamChunk): Record<string, unknown>;
};
/**
 * Embedding result
 */
export interface EmbeddingResult {
    embedding: number[];
    model: string;
    usage: TokenUsage;
}
/**
 * Embedding result utilities
 */
export declare const EmbeddingResultUtil: {
    toDict(result: EmbeddingResult): Record<string, unknown>;
};
/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature: number;
    maxTokens?: number;
    topP: number;
    stream: boolean;
    stop?: string[];
    tools?: Record<string, unknown>[];
    toolChoice?: string;
    presencePenalty?: number;
    frequencyPenalty?: number;
    user?: string;
    timeout?: number;
}
/**
 * Chat completion request utilities
 */
export declare const ChatCompletionRequestUtil: {
    toDict(req: ChatCompletionRequest): Record<string, unknown>;
};
/**
 * LLM provider configuration
 */
export interface LLMProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    timeout?: number;
    [key: string]: unknown;
}
/** Provider capabilities/features */
export type ProviderCapability = "chat" | "streaming" | "embeddings" | "function_calling" | "vision";
/** Provider metadata */
export interface ProviderMetadata {
    name: string;
    capabilities: ProviderCapability[];
    defaultModel: string;
    maxTokens: number;
    pricing?: {
        input: number;
        output: number;
    };
}
/** Provider health status */
export interface ProviderHealth {
    name: string;
    status: "healthy" | "degraded" | "unhealthy";
    successRate: number;
    avgLatency: number;
    lastError?: string;
    lastCheck: string;
}
/** Routing config */
export interface RoutingConfig {
    preferredProvider?: string;
    fallbackChain?: string[];
    requireCapability?: ProviderCapability;
    maxLatency?: number;
}
/** Fallback config */
export interface FallbackConfig {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    providers: string[];
}
//# sourceMappingURL=types.d.ts.map