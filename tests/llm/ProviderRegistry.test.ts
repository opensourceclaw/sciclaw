/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Copyright 2026 Peter Cheng
// DeepClaw v3.5.0 - ProviderRegistry Enhancement Tests

import { describe, it, expect, beforeEach } from "vitest";
import { LLMProvider, LLMProviderRegistry } from "../../src/llm/base.js";
import type { ChatCompletion, ChatCompletionRequest, EmbeddingResult, ChatCompletionStreamChunk } from "../../src/llm/types.js";
import { MessageRole } from "../../src/llm/types.js";

// Mock provider for testing
class MockProvider extends LLMProvider {
  name = "mock";
  requiresApiKey = false;

  async chat(request: ChatCompletionRequest): Promise<ChatCompletion> {
    return {
      id: "test-id",
      model: request.model,
      created: Date.now(),
      role: MessageRole.ASSISTANT,
      content: "Mock response",
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    };
  }

  async *chatStream(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionStreamChunk> {
    yield {
      id: "test-id",
      model: request.model,
      created: Date.now(),
      content: "Mock",
      delta: "Mock",
    };
  }

  async embeddings(texts: string[], model?: string): Promise<EmbeddingResult[]> {
    return texts.map(() => ({
      embedding: [0.1, 0.2, 0.3],
      model: model ?? "mock-embed",
      usage: { promptTokens: 5, completionTokens: 0, totalTokens: 5 },
    }));
  }
}

// Failing mock provider
class FailingProvider extends LLMProvider {
  name = "failing";
  requiresApiKey = false;

  async chat(request: ChatCompletionRequest): Promise<ChatCompletion> {
    throw new Error("Provider failed");
  }

  async *chatStream(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionStreamChunk> {
    throw new Error("Provider failed");
  }

  async embeddings(texts: string[], model?: string): Promise<EmbeddingResult[]> {
    throw new Error("Provider failed");
  }
}

describe("LLMProviderRegistry Enhancement", () => {
  beforeEach(() => {
    // Clear any existing registrations
    // Note: In real usage, providers are registered at module load
  });

  describe("registration with metadata", () => {
    it("registers provider with metadata", () => {
      LLMProviderRegistry.register("test-provider", MockProvider, {
        capabilities: ["chat", "streaming"],
        defaultModel: "test-model",
        maxTokens: 4096,
      });

      const metadata = LLMProviderRegistry.getMetadata("test-provider");
      expect(metadata).toBeDefined();
      expect(metadata?.capabilities).toContain("chat");
      expect(metadata?.defaultModel).toBe("test-model");
    });

    it("creates provider instance", () => {
      LLMProviderRegistry.register("create-test", MockProvider);
      const provider = LLMProviderRegistry.create("create-test");

      expect(provider).toBeDefined();
      expect(provider?.name).toBe("mock");
    });
  });

  describe("capability-based lookup", () => {
    it("lists providers by capability", () => {
      LLMProviderRegistry.register("chat-provider", MockProvider, {
        capabilities: ["chat"],
        defaultModel: "chat-model",
        maxTokens: 2048,
      });

      const chatProviders = LLMProviderRegistry.listByCapability("chat");
      expect(chatProviders.length).toBeGreaterThan(0);
      expect(chatProviders).toContain("chat-provider");
    });

    it("returns empty array for unsupported capability", () => {
      const visionProviders = LLMProviderRegistry.listByCapability("vision");
      // Should not contain providers without vision capability
      expect(visionProviders).not.toContain("chat-provider");
    });
  });

  describe("health tracking", () => {
    it("reports success", () => {
      LLMProviderRegistry.register("health-test", MockProvider);
      LLMProviderRegistry.reportSuccess("health-test", 100);

      const health = LLMProviderRegistry.getHealth("health-test");
      expect(health).toBeDefined();
      expect(health?.status).toBe("healthy");
    });

    it("reports failure", () => {
      LLMProviderRegistry.register("failure-test", MockProvider);
      LLMProviderRegistry.reportFailure("failure-test", "Test error");

      const health = LLMProviderRegistry.getHealth("failure-test");
      expect(health?.lastError).toBe("Test error");
    });

    it("gets all health statuses", () => {
      LLMProviderRegistry.register("all-health-test", MockProvider);
      const allHealth = LLMProviderRegistry.getAllHealth();

      expect(allHealth.length).toBeGreaterThan(0);
    });
  });

  describe("fallback execution", () => {
    it("executes with fallback on success", async () => {
      LLMProviderRegistry.register("fallback-success", MockProvider);

      const request: ChatCompletionRequest = {
        model: "test-model",
        messages: [{ role: MessageRole.USER, content: "Hello" }],
        temperature: 0.7,
        topP: 1,
        stream: false,
      };

      const result = await LLMProviderRegistry.executeWithFallback(request, {
        enabled: true,
        maxRetries: 3,
        retryDelay: 0,
        providers: ["fallback-success"],
      });

      expect(result.content).toBe("Mock response");
    });

    it("fails over to next provider", async () => {
      LLMProviderRegistry.register("failing-provider", FailingProvider);
      LLMProviderRegistry.register("fallback-provider", MockProvider);

      const request: ChatCompletionRequest = {
        model: "test-model",
        messages: [{ role: MessageRole.USER, content: "Hello" }],
        temperature: 0.7,
        topP: 1,
        stream: false,
      };

      const result = await LLMProviderRegistry.executeWithFallback(request, {
        enabled: true,
        maxRetries: 3,
        retryDelay: 0,
        providers: ["failing-provider", "fallback-provider"],
      });

      expect(result.content).toBe("Mock response");
    });

    it("throws when all providers fail", async () => {
      LLMProviderRegistry.register("all-fail", FailingProvider);

      const request: ChatCompletionRequest = {
        model: "test-model",
        messages: [{ role: MessageRole.USER, content: "Hello" }],
        temperature: 0.7,
        topP: 1,
        stream: false,
      };

      await expect(
        LLMProviderRegistry.executeWithFallback(request, {
          enabled: true,
          maxRetries: 1,
          retryDelay: 0,
          providers: ["all-fail"],
        })
      ).rejects.toThrow("All providers failed");
    });
  });
});
