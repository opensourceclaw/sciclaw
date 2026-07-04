import { DEFAULT_ADAPTER_CONFIG } from "./types.js";
export class OpenClawModelAdapter {
    config;
    fetchImpl;
    constructor(config) {
        this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
        this.fetchImpl = globalThis.fetch.bind(globalThis);
    }
    async chat(request) {
        const startTime = Date.now();
        const model = this.resolveModel(request);
        const body = {
            model,
            messages: request.messages,
            temperature: request.options?.temperature,
            max_tokens: request.options?.maxTokens,
        };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
        try {
            const response = await this.fetchImpl(`${this.config.baseUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`OpenClaw Gateway error: ${response.status} ${response.statusText}`);
            }
            const json = await response.json();
            const choice = json.choices?.[0];
            const content = choice?.message?.content ?? "";
            return {
                content,
                model: json.model ?? model,
                provider: (model.split("/")[0] ?? "unknown"),
                usage: json.usage ? {
                    inputTokens: json.usage.prompt_tokens ?? 0,
                    outputTokens: json.usage.completion_tokens ?? 0,
                    costUSD: 0,
                } : undefined,
                latencyMs: Date.now() - startTime,
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async chatStream(request, onToken) {
        const startTime = Date.now();
        const model = this.resolveModel(request);
        let fullContent = "";
        const body = {
            model,
            messages: request.messages,
            temperature: request.options?.temperature,
            max_tokens: request.options?.maxTokens,
            stream: true,
        };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
        try {
            const response = await this.fetchImpl(`${this.config.baseUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`OpenClaw Gateway error: ${response.status}`);
            }
            const reader = response.body?.getReader();
            if (!reader)
                throw new Error("No response body");
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]")
                            continue;
                        try {
                            const json = JSON.parse(data);
                            const token = json.choices?.[0]?.delta?.content ?? "";
                            if (token) {
                                fullContent += token;
                                onToken(token);
                            }
                        }
                        catch {
                            // skip unparseable chunks
                        }
                    }
                }
            }
        }
        finally {
            clearTimeout(timeout);
        }
        return {
            content: fullContent,
            model,
            provider: (model.split("/")[0] ?? "unknown"),
            latencyMs: Date.now() - startTime,
        };
    }
    async healthCheck() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const response = await this.fetchImpl(`${this.config.baseUrl}/v1/models`, { signal: controller.signal });
            clearTimeout(timeout);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async listModels() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await this.fetchImpl(`${this.config.baseUrl}/v1/models`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok)
                return [];
            const json = await response.json();
            return (json.data ?? []).map((m) => m.id);
        }
        catch {
            return [];
        }
    }
    getConfig() {
        return { ...this.config };
    }
    resolveModel(request) {
        return request.options?.model ?? this.config.defaultModel;
    }
}
//# sourceMappingURL=adapter.js.map