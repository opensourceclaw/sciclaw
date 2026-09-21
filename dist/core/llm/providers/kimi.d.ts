import { ChatCompletion, ChatCompletionRequest, ChatCompletionStreamChunk, EmbeddingResult, LLMProviderConfig } from "../types.js";
import { LLMProvider } from "../base.js";
export declare class KimiProvider extends LLMProvider {
    static readonly DEFAULT_BASE_URL = "https://api.moonshot.cn/v1";
    static readonly DEFAULT_MODEL = "moonshot-v1-8k-chat";
    static readonly DEFAULT_EMBEDDING_MODEL = "moonshot-v1-embed";
    static readonly SUPPORTED_MODELS: string[];
    private readonly embeddingModel;
    constructor(config?: LLMProviderConfig);
    get name(): string;
    get requiresApiKey(): boolean;
    get defaultModel(): string;
    get supportedModels(): string[];
    private getHeaders;
    chat(request: ChatCompletionRequest): Promise<ChatCompletion>;
    chatStream(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionStreamChunk>;
    embeddings(texts: string[], model?: string): Promise<EmbeddingResult[]>;
    private parseChatResponse;
    private parseStreamChunk;
}
//# sourceMappingURL=kimi.d.ts.map