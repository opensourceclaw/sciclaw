import { DEFAULT_FALLBACKS } from "./types.js";
export class FallbackHandler {
    adapter;
    fallbackMap = new Map();
    constructor(adapter, fallbacks = DEFAULT_FALLBACKS) {
        this.adapter = adapter;
        for (const entry of fallbacks) {
            this.fallbackMap.set(entry.primary, entry.fallbacks);
        }
    }
    async execute(request, model) {
        // Try primary model first
        try {
            return await this.adapter.chat(request);
        }
        catch {
            // Primary failed, try fallbacks
        }
        const fallbacks = this.fallbackMap.get(model);
        if (!fallbacks || fallbacks.length === 0) {
            throw new Error(`Model "${model}" failed and no fallbacks configured`);
        }
        for (const fallbackModel of fallbacks) {
            try {
                // Create a modified request targeting the fallback model
                const fbRequest = {
                    ...request,
                    messages: [
                        { role: "system", content: `[Fallback: primary model ${model} unavailable]` },
                        ...request.messages,
                    ],
                };
                return await this.adapter.chat(fbRequest);
            }
            catch {
                continue;
            }
        }
        throw new Error(`All models failed: ${[model, ...fallbacks].join(", ")}`);
    }
    addFallback(primary, fallbacks) {
        this.fallbackMap.set(primary, fallbacks);
    }
    getFallbacks(primary) {
        return this.fallbackMap.get(primary) ?? [];
    }
}
//# sourceMappingURL=fallback.js.map