/**
 * LLM module - Language model integration
 */
const providers = new Map();
export function registerProvider(provider) {
    providers.set(provider.name, provider);
}
export function getProvider(name) {
    return providers.get(name);
}
export async function synthesize(topic, contents) {
    // Simple synthesis without LLM (placeholder)
    const summaries = contents
        .slice(0, 5)
        .map((c) => `- **${c.title}**: ${c.content.slice(0, 200)}...`)
        .join('\n');
    return `# Research Summary: ${topic}\n\nBased on analysis of ${contents.length} sources:\n\n${summaries}`;
}
export async function complete(prompt, options) {
    const providerName = options?.model ?? 'default';
    const provider = getProvider(providerName);
    if (!provider) {
        throw new Error(`LLM provider not found: ${providerName}`);
    }
    return provider.complete(prompt, options);
}
export { synthesize as default };
//# sourceMappingURL=index.js.map