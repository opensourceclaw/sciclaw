/**
 * LLM module - Language model integration
 */
import type { LLMProvider, LLMOptions } from '../types/index.js';
export declare function registerProvider(provider: LLMProvider): void;
export declare function getProvider(name: string): LLMProvider | undefined;
export declare function synthesize(topic: string, contents: Array<{
    title: string;
    url: string;
    content: string;
}>): Promise<string>;
export declare function complete(prompt: string, options?: LLMOptions): Promise<string>;
export { synthesize as default };
//# sourceMappingURL=index.d.ts.map