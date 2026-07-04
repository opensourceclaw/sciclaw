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
 * LLM Base - Abstract base class and registry for LLM providers
 */

import { v4 as uuidv4 } from "uuid";
import {
  ChatCompletion,
  ChatCompletionRequest,
  ChatCompletionStreamChunk,
  EmbeddingResult,
  LLMProviderConfig,
  MessageRole,
} from "./types";

/**
 * Abstract base class for all LLM providers
 */
export abstract class LLMProvider {
  protected apiKey?: string;
  protected baseUrl?: string;
  protected config: Record<string, unknown>;

  constructor(config: LLMProviderConfig = {}) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.config = config as Record<string, unknown>;
  }

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
  get defaultModel(): string {
    return "";
  }

  /**
   * List of supported models
   */
  get supportedModels(): string[] {
    return [];
  }

  /**
   * Whether this provider supports streaming
   */
  get supportsStreaming(): boolean {
    return true;
  }

  /**
   * Whether this provider supports embeddings
   */
  get supportsEmbeddings(): boolean {
    return true;
  }

  /**
   * Validate provider configuration
   */
  validateConfig(): boolean {
    if (this.requiresApiKey && !this.apiKey) {
      return false;
    }
    return true;
  }

  /**
   * Generate a unique ID for requests
   */
  protected generateId(): string {
    return `chatcmpl-${uuidv4().split("-")[0]}`;
  }

  /**
   * Get current timestamp
   */
  protected timestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Parse role from string
   */
  protected parseRole(role: string | undefined): MessageRole {
    if (!role) return MessageRole.ASSISTANT;
    switch (role.toLowerCase()) {
      case "system":
        return MessageRole.SYSTEM;
      case "user":
        return MessageRole.USER;
      case "assistant":
        return MessageRole.ASSISTANT;
      case "tool":
        return MessageRole.TOOL;
      default:
        return MessageRole.ASSISTANT;
    }
  }
}

/**
 * Provider class type
 */
export type LLMProviderClass = new (config: LLMProviderConfig) => LLMProvider;

/**
 * Registry for LLM providers
 */
export class LLMProviderRegistry {
  private static providers: Map<string, LLMProviderClass> = new Map();

  /**
   * Register an LLM provider
   */
  static register(name: string, providerClass: LLMProviderClass): void {
    LLMProviderRegistry.providers.set(name.toLowerCase(), providerClass);
  }

  /**
   * Get provider class by name
   */
  static get(name: string): LLMProviderClass | undefined {
    return LLMProviderRegistry.providers.get(name.toLowerCase());
  }

  /**
   * List all registered provider names
   */
  static listProviders(): string[] {
    return Array.from(LLMProviderRegistry.providers.keys());
  }

  /**
   * Create a provider instance
   */
  static create(name: string, config: LLMProviderConfig = {}): LLMProvider | undefined {
    const providerClass = LLMProviderRegistry.get(name);
    if (providerClass) {
      return new providerClass(config);
    }
    return undefined;
  }
}

/**
 * Decorator to register an LLM provider
 */
export function registerLLMProvider(name: string): ClassDecorator {
  return function (target: Function) {
    LLMProviderRegistry.register(name, target as LLMProviderClass);
  };
}