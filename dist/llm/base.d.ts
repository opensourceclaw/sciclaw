import { ChatCompletion, ChatCompletionRequest, ChatCompletionStreamChunk, EmbeddingResult, LLMProviderConfig, MessageRole } from "./types";
/**
 * Abstract base class for all LLM providers
 */
export declare abstract class LLMProvider {
    protected apiKey?: string;
    protected baseUrl?: string;
    protected config: Record<string, unknown>;
    constructor(config?: LLMProviderConfig);
    /**
     * Execute chat completion
     */
    abstract chat(request: ChatCompletionRequest): Promise<ChatCompletion>;
    /**
     * Execute streaming chat completion
     */
    abstract chatStream(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionStreamChunk>;
    /**
     * Generate embeddings
     */
    abstract embeddings(texts: string[], model?: string): Promise<EmbeddingResult[]>;
    /**
     * Provider name
     */
    abstract get name(): string;
    /**
     * Whether this provider requires an API key
     */
    abstract get requiresApiKey(): boolean;
    /**
     * Default model for this provider
     */
    get defaultModel(): string;
    /**
     * List of supported models
     */
    get supportedModels(): string[];
    /**
     * Whether this provider supports streaming
     */
    get supportsStreaming(): boolean;
    /**
     * Whether this provider supports embeddings
     */
    get supportsEmbeddings(): boolean;
    /**
     * Validate provider configuration
     */
    validateConfig(): boolean;
    /**
     * Generate a unique ID for requests
     */
    protected generateId(): string;
    /**
     * Get current timestamp
     */
    protected timestamp(): number;
    /**
     * Parse role from string
     */
    protected parseRole(role: string | undefined): MessageRole;
}
/**
 * Provider class type
 */
export type LLMProviderClass = new (config: LLMProviderConfig) => LLMProvider;
/**
 * Registry for LLM providers
 */
export declare class LLMProviderRegistry {
    private static providers;
    /**
     * Register an LLM provider
     */
    static register(name: string, providerClass: LLMProviderClass): void;
    /**
     * Get provider class by name
     */
    static get(name: string): LLMProviderClass | undefined;
    /**
     * List all registered provider names
     */
    static listProviders(): string[];
    /**
     * Create a provider instance
     */
    static create(name: string, config?: LLMProviderConfig): LLMProvider | undefined;
}
/**
 * Decorator to register an LLM provider
 */
export declare function registerLLMProvider(name: string): ClassDecorator;
//# sourceMappingURL=base.d.ts.map