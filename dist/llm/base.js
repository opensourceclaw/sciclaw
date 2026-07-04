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
import { MessageRole, } from "./types";
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
 * Registry for LLM providers
 */
export class LLMProviderRegistry {
    static providers = new Map();
    /**
     * Register an LLM provider
     */
    static register(name, providerClass) {
        LLMProviderRegistry.providers.set(name.toLowerCase(), providerClass);
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