export const DEFAULT_ADAPTER_CONFIG = {
    baseUrl: "http://127.0.0.1:18789",
    timeoutMs: 60_000,
    defaultModel: "anthropic/claude-sonnet-4-6",
};
export const DEFAULT_FALLBACKS = [
    { primary: "anthropic/claude-opus-4-6", fallbacks: ["openai/o3-mini", "google/gemini-3-flash-preview"] },
    { primary: "anthropic/claude-sonnet-4-6", fallbacks: ["google/gemini-3-flash-preview", "deepseek/deepseek-v4-flash"] },
    { primary: "openai/o3-mini", fallbacks: ["anthropic/claude-sonnet-4-6", "google/gemini-3-pro-preview"] },
];
export const DEFAULT_TASK_MODEL_MAP = {
    reasoning: "openai/o3-mini",
    analysis: "anthropic/claude-opus-4-6",
    coding: "anthropic/claude-sonnet-4-6",
    summarization: "google/gemini-3-flash-preview",
    embedding: "openai/gpt-4o",
    creative: "anthropic/claude-opus-4-6",
    default: "anthropic/claude-sonnet-4-6",
};
//# sourceMappingURL=types.js.map