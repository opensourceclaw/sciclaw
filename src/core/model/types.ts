export type ModelProvider = "openai" | "anthropic" | "google" | "deepseek"
  | "xai" | "groq" | "mistral" | "ollama" | string;

export type TaskCategory = "reasoning" | "analysis" | "coding"
  | "summarization" | "embedding" | "creative" | "default";

export interface ModelRequest {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  task?: TaskCategory;
  options?: {
    model?: string;
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

export const DEFAULT_ADAPTER_CONFIG: ModelAdapterConfig = {
  baseUrl: "http://127.0.0.1:18789",
  timeoutMs: 60_000,
  defaultModel: "anthropic/claude-sonnet-4-6",
};

export interface FallbackEntry {
  primary: string;
  fallbacks: string[];
}

export const DEFAULT_FALLBACKS: FallbackEntry[] = [
  { primary: "anthropic/claude-opus-4-6", fallbacks: ["openai/o3-mini", "google/gemini-3-flash-preview"] },
  { primary: "anthropic/claude-sonnet-4-6", fallbacks: ["google/gemini-3-flash-preview", "deepseek/deepseek-v4-flash"] },
  { primary: "openai/o3-mini", fallbacks: ["anthropic/claude-sonnet-4-6", "google/gemini-3-pro-preview"] },
];

export interface ModelCostEntry {
  inputUSDPer1M: number;
  outputUSDPer1M: number;
}

export type TaskModelMap = Record<TaskCategory, string>;

export const DEFAULT_TASK_MODEL_MAP: TaskModelMap = {
  reasoning: "openai/o3-mini",
  analysis: "anthropic/claude-opus-4-6",
  coding: "anthropic/claude-sonnet-4-6",
  summarization: "google/gemini-3-flash-preview",
  embedding: "openai/gpt-4o",
  creative: "anthropic/claude-opus-4-6",
  default: "anthropic/claude-sonnet-4-6",
};
