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
import { MessageRole, } from "./types.js";
/**
 * Abstract base class for all LLM providers
 */
export class LLMProvider {
    apiKey;
    baseUrl;
    config;
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl;
        this.config = config;
    }
    /**
     * Default model for this provider
     */
    get defaultModel() {
        return "";
    }
    /**
     * List of supported models
     */
    get supportedModels() {
        return [];
    }
    /**
     * Whether this provider supports streaming
     */
    get supportsStreaming() {
        return true;
    }
    /**
     * Whether this provider supports embeddings
     */
    get supportsEmbeddings() {
        return true;
    }
    /**
     * Validate provider configuration
     */
    validateConfig() {
        if (this.requiresApiKey && !this.apiKey) {
            return false;
        }
        return true;
    }
    /**
     * Generate a unique ID for requests
     */
    generateId() {
        return `chatcmpl-${uuidv4().split("-")[0]}`;
    }
    /**
     * Get current timestamp
     */
    timestamp() {
        return Math.floor(Date.now() / 1000);
    }
    /**
     * Parse role from string
     */
    parseRole(role) {
        if (!role)
            return MessageRole.ASSISTANT;
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
 * Registry for LLM providers with capabilities and fallback support (v3.5.0)
 */
export class LLMProviderRegistry {
    static providers = new Map();
    static metadata = new Map();
    static health = new Map();
    // ── Registration ─────────────────────────────────────────────────────
    /**
     * Register an LLM provider
     */
    static register(name, providerClass, metadata) {
        const key = name.toLowerCase();
        LLMProviderRegistry.providers.set(key, providerClass);
        if (metadata) {
            LLMProviderRegistry.metadata.set(key, {
                name: name.toLowerCase(),
                capabilities: metadata.capabilities ?? ["chat"],
                defaultModel: metadata.defaultModel ?? "",
                maxTokens: metadata.maxTokens ?? 4096,
                pricing: metadata.pricing,
            });
        }
        // Initialize health status
        LLMProviderRegistry.health.set(key, {
            name: name.toLowerCase(),
            status: "healthy",
            successRate: 1,
            avgLatency: 0,
            lastCheck: new Date().toISOString(),
        });
    }
    /**
     * Get provider class by name
     */
    static get(name) {
        return LLMProviderRegistry.providers.get(name.toLowerCase());
    }
    /**
     * List all registered provider names
     */
    static listProviders() {
        return Array.from(LLMProviderRegistry.providers.keys());
    }
    /**
     * Create a provider instance
     */
    static create(name, config = {}) {
        const providerClass = LLMProviderRegistry.get(name);
        if (providerClass) {
            return new providerClass(config);
        }
        return undefined;
    }
    // ── Capability-based Lookup ──────────────────────────────────────────
    /**
     * Get providers by capability.
     */
    static getByCapability(capability) {
        const result = [];
        for (const [name, meta] of LLMProviderRegistry.metadata) {
            if (meta.capabilities.includes(capability)) {
                const providerClass = LLMProviderRegistry.providers.get(name);
                if (providerClass) {
                    result.push(providerClass);
                }
            }
        }
        return result;
    }
    /**
     * List providers by capability.
     */
    static listByCapability(capability) {
        const result = [];
        for (const [name, meta] of LLMProviderRegistry.metadata) {
            if (meta.capabilities.includes(capability)) {
                result.push(name);
            }
        }
        return result;
    }
    // ── Health Tracking ───────────────────────────────────────────────────
    /**
     * Report provider success.
     */
    static reportSuccess(name, latency) {
        const key = name.toLowerCase();
        const health = LLMProviderRegistry.health.get(key);
        if (!health)
            return;
        // Update success rate (exponential moving average)
        health.successRate = health.successRate * 0.9 + 0.1;
        health.avgLatency = health.avgLatency * 0.9 + latency * 0.1;
        health.lastCheck = new Date().toISOString();
        // Update status
        if (health.successRate > 0.9) {
            health.status = "healthy";
        }
        else if (health.successRate > 0.5) {
            health.status = "degraded";
        }
        LLMProviderRegistry.health.set(key, health);
    }
    /**
     * Report provider failure.
     */
    static reportFailure(name, error) {
        const key = name.toLowerCase();
        const health = LLMProviderRegistry.health.get(key);
        if (!health)
            return;
        // Update success rate
        health.successRate = health.successRate * 0.9;
        health.lastError = error;
        health.lastCheck = new Date().toISOString();
        // Update status
        if (health.successRate < 0.5) {
            health.status = "unhealthy";
        }
        else if (health.successRate < 0.9) {
            health.status = "degraded";
        }
        LLMProviderRegistry.health.set(key, health);
    }
    /**
     * Get provider health.
     */
    static getHealth(name) {
        return LLMProviderRegistry.health.get(name.toLowerCase());
    }
    /**
     * Get all health statuses.
     */
    static getAllHealth() {
        return Array.from(LLMProviderRegistry.health.values());
    }
    // ── Fallback Execution ────────────────────────────────────────────────
    /**
     * Execute with automatic fallback on failure.
     */
    static async executeWithFallback(request, config) {
        const providers = config.providers ?? LLMProviderRegistry.listProviders();
        let lastError;
        for (const name of providers) {
            const provider = LLMProviderRegistry.create(name);
            if (!provider)
                continue;
            const startTime = Date.now();
            try {
                const result = await provider.chat(request);
                LLMProviderRegistry.reportSuccess(name, Date.now() - startTime);
                return result;
            }
            catch (err) {
                lastError = err;
                LLMProviderRegistry.reportFailure(name, lastError.message);
                if (!config.enabled) {
                    throw lastError;
                }
                // Wait before trying next provider
                if (config.retryDelay > 0) {
                    await new Promise((r) => setTimeout(r, config.retryDelay));
                }
            }
        }
        throw new Error(`All providers failed. Last error: ${lastError?.message}`);
    }
    // ── Metadata ──────────────────────────────────────────────────────────
    /**
     * Get provider metadata.
     */
    static getMetadata(name) {
        return LLMProviderRegistry.metadata.get(name.toLowerCase());
    }
}
/**
 * Decorator to register an LLM provider
 */
export function registerLLMProvider(name) {
    return function (target) {
        LLMProviderRegistry.register(name, target);
    };
}
//# sourceMappingURL=base.js.map