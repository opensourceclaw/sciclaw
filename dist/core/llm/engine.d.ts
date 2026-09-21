/**
 * LLM Engine - Unified interface for LLM providers
 */
import { ChatCompletion, ChatCompletionStreamChunk, ChatMessage, EmbeddingResult, LLMProviderConfig } from "./types.js";
import { LLMProvider } from "./base.js";
/**
 * LLM Engine options
 */
export interface LLMEngineOptions extends LLMProviderConfig {
    provider?: string;
}
/**
 * Model information
 */
export interface ModelInfo {
    provider: string;
    model: string;
    defaultModel: string;
    supportedModels: string[];
    supportsStreaming: boolean;
    supportsEmbeddings: boolean;
}
/**
 * Unified LLM engine that wraps all providers
 */
export declare class LLMEngine {
    private providerName;
    private _model;
    private apiKey?;
    private baseUrl?;
    private config;
    private _provider;
    constructor(options?: LLMEngineOptions);
    private createProvider;
    /**
     * Get the underlying provider
     */
    get provider(): LLMProvider;
    /**
     * Provider name
     */
    get name(): string;
    /**
     * Current model
     */
    get model(): string;
    /**
     * Set model
     */
    set model(value: string | undefined);
    /**
     * Execute chat completion
     */
    chat(messages: ChatMessage[], options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        stop?: string[];
    }): Promise<ChatCompletion>;
    /**
     * Execute streaming chat completion
     */
    chatStream(messages: ChatMessage[], options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        stop?: string[];
    }): AsyncGenerator<ChatCompletionStreamChunk>;
    /**
     * Generate embeddings
     */
    embeddings(texts: string[], model?: string): Promise<EmbeddingResult[]>;
    /**
     * Simple chat with a single prompt
     */
    chatSimple(prompt: string, systemPrompt?: string, options?: {
        temperature?: number;
        maxTokens?: number;
    }): Promise<string>;
    /**
     * List supported models
     */
    listModels(): string[];
    /**
     * Get model information
     */
    getModelInfo(): ModelInfo;
    /**
     * String representation
     */
    toString(): string;
}
//# sourceMappingURL=engine.d.ts.map