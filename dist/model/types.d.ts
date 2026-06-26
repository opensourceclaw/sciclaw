export type ModelProvider = "openai" | "anthropic" | "google" | "deepseek" | "xai" | "groq" | "mistral" | "ollama" | string;
export type TaskCategory = "reasoning" | "analysis" | "coding" | "summarization" | "embedding" | "creative" | "default";
export interface ModelRequest {
    messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>;
    task?: TaskCategory;
    options?: {
        temperature?: number;
        maxTokens?: number;
        reasoningEffort?: "low" | "medium" | "high";
        streaming?: boolean;
    };
}
export interface ModelResponse {
    content: string;
    model: string;
    provider: ModelProvider;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        costUSD: number;
    };
    latencyMs: number;
}
export interface ModelAdapterConfig {
    baseUrl: string;
    apiKey?: string;
    timeoutMs: number;
    defaultModel: string;
}
export declare const DEFAULT_ADAPTER_CONFIG: ModelAdapterConfig;
export interface FallbackEntry {
    primary: string;
    fallbacks: string[];
}
export declare const DEFAULT_FALLBACKS: FallbackEntry[];
export interface ModelCostEntry {
    inputUSDPer1M: number;
    outputUSDPer1M: number;
}
export type TaskModelMap = Record<TaskCategory, string>;
export declare const DEFAULT_TASK_MODEL_MAP: TaskModelMap;
//# sourceMappingURL=types.d.ts.map