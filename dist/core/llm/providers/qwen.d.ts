import { ChatCompletion, ChatCompletionRequest, ChatCompletionStreamChunk, EmbeddingResult, LLMProviderConfig } from "../types.js";
import { LLMProvider } from "../base.js";
export declare class QwenProvider extends LLMProvider {
    static readonly DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    static readonly DEFAULT_MODEL = "qwen-turbo";
    static readonly DEFAULT_EMBEDDING_MODEL = "text-embedding-v3";
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
//# sourceMappingURL=qwen.d.ts.map