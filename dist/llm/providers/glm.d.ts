import { ChatCompletion, ChatCompletionRequest, ChatCompletionStreamChunk, EmbeddingResult, LLMProviderConfig } from "../types";
import { LLMProvider } from "../base";
export declare class GLMProvider extends LLMProvider {
    static readonly DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
    static readonly DEFAULT_MODEL = "glm-4";
    static readonly DEFAULT_EMBEDDING_MODEL = "embedding-2";
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
//# sourceMappingURL=glm.d.ts.map