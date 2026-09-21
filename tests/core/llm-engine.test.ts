/**
 * GA-A2 acceptance face — core/llm engine (the live research path passes
 * through it). Unit coverage with a registered stub provider: no network.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { LLMEngine } from "../../src/core/index.js";
import { LLMProvider, LLMProviderRegistry } from "../../src/core/llm/base.js";
import { MessageRole } from "../../src/core/llm/types.js";
import type {
  ChatCompletion,
  ChatCompletionRequest,
  ChatCompletionStreamChunk,
  EmbeddingResult,
} from "../../src/core/llm/types.js";

class StubProvider extends LLMProvider {
  static lastRequest: ChatCompletionRequest | null = null;

  get name(): string {
    return "stub";
  }
  get requiresApiKey(): boolean {
    return true;
  }
  get defaultModel(): string {
    return "stub-model-1";
  }
  get supportedModels(): string[] {
    return ["stub-model-1", "stub-model-2"];
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletion> {
    StubProvider.lastRequest = request;
    return {
      id: "stub-1",
      model: request.model,
      created: Math.floor(Date.now() / 1000),
      role: MessageRole.ASSISTANT,
      content: `stub-echo:${request.messages[request.messages.length - 1]?.content ?? ""}`,
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      rawResponse: {},
    };
  }
  async *chatStream(): AsyncGenerator<ChatCompletionStreamChunk> {
    yield { id: "s", model: "stub-model-1", created: 0, delta: "", content: "" } as ChatCompletionStreamChunk;
  }
  async embeddings(texts: string[]): Promise<EmbeddingResult[]> {
    return texts.map((t) => ({
      embedding: [t.length],
      model: "stub-model-1",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    }));
  }
}

beforeAll(() => {
  LLMProviderRegistry.register("stub", StubProvider as never, { defaultModel: "stub-model-1" });
});

describe("LLMEngine (GA-A2 acceptance face)", () => {
  it("throws for an unknown provider", () => {
    expect(() => new LLMEngine({ provider: "does-not-exist" })).toThrow(/Unknown provider/);
  });

  it("defaults the model to the provider's default", () => {
    const engine = new LLMEngine({ provider: "stub", apiKey: "test-key" });
    expect(engine.model).toBe("stub-model-1");
  });

  it("chatSimple routes through the registered provider with the composed messages", async () => {
    const engine = new LLMEngine({ provider: "stub", apiKey: "test-key" });
    const out = await engine.chatSimple("hello", "you are a test");

    expect(out).toBe("stub-echo:hello");
    expect(StubProvider.lastRequest?.messages[0]).toMatchObject({ role: MessageRole.SYSTEM, content: "you are a test" });
    expect(StubProvider.lastRequest?.messages[1]).toMatchObject({ role: MessageRole.USER, content: "hello" });
    expect(StubProvider.lastRequest?.model).toBe("stub-model-1");
  });

  it("validates provider key configuration (validateConfig)", () => {
    const withoutKey = new StubProvider({});
    const withKey = new StubProvider({ apiKey: "test-key" });
    expect(withoutKey.validateConfig()).toBe(false);
    expect(withKey.validateConfig()).toBe(true);
  });

  it("exposes the registered provider in the registry list", () => {
    expect(LLMProviderRegistry.listProviders()).toContain("stub");
    expect(LLMProviderRegistry.get("stub")).toBe(StubProvider);
  });
});
