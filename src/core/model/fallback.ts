import { DEFAULT_FALLBACKS } from "./types.js";
import type { FallbackEntry, ModelRequest, ModelResponse } from "./types.js";
import type { OpenClawModelAdapter } from "./adapter.js";

export class FallbackHandler {
  private fallbackMap = new Map<string, string[]>();

  constructor(
    private adapter: OpenClawModelAdapter,
    fallbacks: FallbackEntry[] = DEFAULT_FALLBACKS,
  ) {
    for (const entry of fallbacks) {
      this.fallbackMap.set(entry.primary, entry.fallbacks);
    }
  }

  async execute(request: ModelRequest, model: string): Promise<ModelResponse> {
    // Try primary model first
    try {
      return await this.adapter.chat(request);
    } catch {
      // Primary failed, try fallbacks
    }

    const fallbacks = this.fallbackMap.get(model);
    if (!fallbacks || fallbacks.length === 0) {
      throw new Error(`Model "${model}" failed and no fallbacks configured`);
    }

    for (const fallbackModel of fallbacks) {
      try {
        // Create a modified request targeting the fallback model
        const fbRequest: ModelRequest = {
          ...request,
          messages: [
            { role: "system", content: `[Fallback: primary model ${model} unavailable]` },
            ...request.messages,
          ],
        };
        return await this.adapter.chat(fbRequest);
      } catch {
        continue;
      }
    }

    throw new Error(`All models failed: ${[model, ...fallbacks].join(", ")}`);
  }

  addFallback(primary: string, fallbacks: string[]): void {
    this.fallbackMap.set(primary, fallbacks);
  }

  getFallbacks(primary: string): string[] {
    return this.fallbackMap.get(primary) ?? [];
  }
}
