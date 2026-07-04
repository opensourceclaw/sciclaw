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
 * LLM Types - Type definitions for LLM module
 */

/**
 * Message role enum
 */
export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  TOOL = "tool",
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
export const ChatMessageUtil = {
  toDict(msg: ChatMessage): Record<string, unknown> {
    const result: Record<string, unknown> = {
      role: msg.role,
      content: msg.content,
    };
    if (msg.name) result.name = msg.name;
    if (msg.toolCallId) result.tool_call_id = msg.toolCallId;
    return result;
  },

  fromDict(data: Record<string, unknown>): ChatMessage {
    return {
      role: typeof data.role === "string" ? (data.role as MessageRole) : MessageRole.USER,
      content: typeof data.content === "string" ? data.content : "",
      name: typeof data.name === "string" ? data.name : undefined,
      toolCallId: typeof data.tool_call_id === "string" ? data.tool_call_id : undefined,
    };
  },
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
export const ChatCompletionUtil = {
  toDict(completion: ChatCompletion): Record<string, unknown> {
    return {
      id: completion.id,
      model: completion.model,
      created: completion.created,
      role: completion.role,
      content: completion.content,
      finish_reason: completion.finishReason,
      usage: completion.usage,
    };
  },
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
export const ChatCompletionStreamChunkUtil = {
  toDict(chunk: ChatCompletionStreamChunk): Record<string, unknown> {
    const result: Record<string, unknown> = {
      id: chunk.id,
      model: chunk.model,
      created: chunk.created,
    };
    if (chunk.role) result.role = chunk.role;
    if (chunk.content) result.content = chunk.content;
    if (chunk.delta) result.delta = chunk.delta;
    if (chunk.finishReason) result.finish_reason = chunk.finishReason;
    return result;
  },
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
export const EmbeddingResultUtil = {
  toDict(result: EmbeddingResult): Record<string, unknown> {
    return {
      embedding: result.embedding,
      model: result.model,
      usage: result.usage,
    };
  },
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
export const ChatCompletionRequestUtil = {
  toDict(req: ChatCompletionRequest): Record<string, unknown> {
    const result: Record<string, unknown> = {
      model: req.model,
      messages: req.messages.map((m) => ChatMessageUtil.toDict(m)),
      temperature: req.temperature,
      top_p: req.topP,
      stream: req.stream,
    };
    if (req.maxTokens !== undefined) result.max_tokens = req.maxTokens;
    if (req.stop) result.stop = req.stop;
    if (req.tools) result.tools = req.tools;
    if (req.toolChoice) result.tool_choice = req.toolChoice;
    if (req.presencePenalty !== undefined) result.presence_penalty = req.presencePenalty;
    if (req.frequencyPenalty !== undefined) result.frequency_penalty = req.frequencyPenalty;
    if (req.user) result.user = req.user;
    return result;
  },
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
