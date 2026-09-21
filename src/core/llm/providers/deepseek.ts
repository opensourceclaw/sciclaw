// Copyright 2026 Peter Cheng
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * LLM Provider - DeepSeek
 */

import axios, { AxiosResponse } from "axios";
import {
  ChatCompletion,
  ChatCompletionRequest,
  ChatCompletionStreamChunk,
  ChatMessageUtil,
  ChatCompletionRequestUtil,
  EmbeddingResult,
  LLMProviderConfig,
  MessageRole,
  TokenUsage,
} from "../types.js";
import { LLMProvider, registerLLMProvider } from "../base.js";

@registerLLMProvider("deepseek")
export class DeepSeekProvider extends LLMProvider {
  static readonly DEFAULT_BASE_URL = "https://api.deepseek.com";
  static readonly DEFAULT_MODEL = "deepseek-chat";
  static readonly DEFAULT_EMBEDDING_MODEL = "deepseek-embedding";

  static readonly SUPPORTED_MODELS = [
    "deepseek-chat",
    "deepseek-coder",
    "deepseek-prover",
  ];

  private readonly embeddingModel: string;

  constructor(config: LLMProviderConfig = {}) {
    super(config);
    this.baseUrl = config.baseUrl || DeepSeekProvider.DEFAULT_BASE_URL;
    this.embeddingModel = (config.embeddingModel as string) || DeepSeekProvider.DEFAULT_EMBEDDING_MODEL;
  }

  get name(): string {
    return "deepseek";
  }

  get requiresApiKey(): boolean {
    return true;
  }

  get defaultModel(): string {
    return DeepSeekProvider.DEFAULT_MODEL;
  }

  get supportedModels(): string[] {
    return DeepSeekProvider.SUPPORTED_MODELS;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletion> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    const payload = ChatCompletionRequestUtil.toDict(request);

    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
      timeout: request.timeout || 60000,
    });

    return this.parseChatResponse(response.data, request.model);
  }

  async *chatStream(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionStreamChunk> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    const payload = ChatCompletionRequestUtil.toDict(request);
    payload.stream = true;

    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
      timeout: request.timeout || 60000,
      responseType: "stream",
    });

    const stream = response.data;
    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") return;

        try {
          const data = JSON.parse(dataStr);
          const parsed = this.parseStreamChunk(data, request.model);
          if (parsed) yield parsed;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  async embeddings(texts: string[], model?: string): Promise<EmbeddingResult[]> {
    const url = `${this.baseUrl}/v1/embeddings`;
    const embeddingModel = model || this.embeddingModel;

    const response = await axios.post(
      url,
      {
        input: texts,
        model: embeddingModel,
      },
      {
        headers: this.getHeaders(),
        timeout: 60000,
      }
    );

    const data = response.data;
    const usage: TokenUsage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };

    return (data.data || []).map((item: { embedding: number[] }) => ({
      embedding: item.embedding,
      model: embeddingModel,
      usage,
    }));
  }

  private parseChatResponse(data: Record<string, unknown>, requestModel: string): ChatCompletion {
    const choices = (data.choices as Array<Record<string, unknown>>) || [{}];
    const choice = choices[0] || {};
    const message = (choice.message as Record<string, unknown>) || {};

    const usage: TokenUsage = {
      promptTokens: (data.usage as Record<string, number>)?.prompt_tokens || 0,
      completionTokens: (data.usage as Record<string, number>)?.completion_tokens || 0,
      totalTokens: (data.usage as Record<string, number>)?.total_tokens || 0,
    };

    return {
      id: (data.id as string) || this.generateId(),
      model: (data.model as string) || requestModel,
      created: (data.created as number) || this.timestamp(),
      role: this.parseRole(message.role as string),
      content: (message.content as string) || "",
      finishReason: (choice.finish_reason as string) || "stop",
      usage,
      rawResponse: data,
    };
  }

  private parseStreamChunk(
    data: Record<string, unknown>,
    requestModel: string
  ): ChatCompletionStreamChunk | null {
    const choices = (data.choices as Array<Record<string, unknown>>) || [{}];
    const choice = choices[0] || {};
    const delta = (choice.delta as Record<string, unknown>) || {};

    return {
      id: (data.id as string) || this.generateId(),
      model: (data.model as string) || requestModel,
      created: (data.created as number) || this.timestamp(),
      role: delta.role ? this.parseRole(delta.role as string) : undefined,
      content: (delta.content as string) || "",
      delta: (delta.content as string) || "",
      finishReason: choice.finish_reason as string | undefined,
    };
  }
}
