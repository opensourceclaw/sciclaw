/**
 * LLM module - Language model integration
 */

import type { LLMProvider, LLMOptions } from '../types/index.js';

const providers: Map<string, LLMProvider> = new Map();

export function registerProvider(provider: LLMProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): LLMProvider | undefined {
  return providers.get(name);
}

export async function synthesize(
  topic: string,
  contents: Array<{ title: string; url: string; content: string }>
): Promise<string> {
  // Simple synthesis without LLM (placeholder)
  const summaries = contents
    .slice(0, 5)
    .map((c) => `- **${c.title}**: ${c.content.slice(0, 200)}...`)
    .join('\n');

  return `# Research Summary: ${topic}\n\nBased on analysis of ${contents.length} sources:\n\n${summaries}`;
}

export async function complete(prompt: string, options?: LLMOptions): Promise<string> {
  const providerName = options?.model ?? 'default';
  const provider = getProvider(providerName);

  if (!provider) {
    throw new Error(`LLM provider not found: ${providerName}`);
  }

  return provider.complete(prompt, options);
}

export { synthesize as default };
