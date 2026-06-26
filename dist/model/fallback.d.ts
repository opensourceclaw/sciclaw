import type { FallbackEntry, ModelRequest, ModelResponse } from "./types.js";
import type { OpenClawModelAdapter } from "./adapter.js";
export declare class FallbackHandler {
    private adapter;
    private fallbackMap;
    constructor(adapter: OpenClawModelAdapter, fallbacks?: FallbackEntry[]);
    execute(request: ModelRequest, model: string): Promise<ModelResponse>;
    addFallback(primary: string, fallbacks: string[]): void;
    getFallbacks(primary: string): string[];
}
//# sourceMappingURL=fallback.d.ts.map