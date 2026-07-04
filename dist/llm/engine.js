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
 * LLM Engine - Unified interface for LLM providers
 */
import { MessageRole, } from "./types";
import { LLMProviderRegistry } from "./base";
/**
 * Unified LLM engine that wraps all providers
 */
export class LLMEngine {
    providerName;
    _model;
    apiKey;
    baseUrl;
    config;
    _provider;
    constructor(options = {}) {
        this.providerName = (options.provider || "deepseek").toLowerCase();
        this._model = options.model || "";
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl;
        this.config = options;
        // Create provider instance
        this._provider = this.createProvider(this._model);
        // Update model with actual value
        this._model = this._model || this._provider.defaultModel;
    }
    createProvider(model) {
        const providerClass = LLMProviderRegistry.get(this.providerName);
        if (!providerClass) {
            const available = LLMProviderRegistry.listProviders();
            throw new Error(`Unknown provider: ${this.providerName}. Available: ${available.join(", ")}`);
        }
        // Use provided model or get default
        let actualModel = model;
        if (!actualModel) {
            // Create temp instance to get default model
            const tempProvider = new providerClass({
                apiKey: this.apiKey,
                baseUrl: this.baseUrl,
            });
            actualModel = tempProvider.defaultModel;
        }
        return new providerClass({
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            model: actualModel,
            ...this.config,
        });
    }
    /**
     * Get the underlying provider
     */
    get provider() {
        return this._provider;
    }
    /**
     * Provider name
     */
    get name() {
        return this._provider.name;
    }
    /**
     * Current model
     */
    get model() {
        return this._model;
    }
    /**
     * Set model
     */
    set model(value) {
        this._model = value || this._provider.defaultModel;
    }
    /**
     * Execute chat completion
     */
    async chat(messages, options = {}) {
        const request = {
            model: options.model || this._model,
            messages,
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens,
            topP: options.topP ?? 1.0,
            stream: false,
            stop: options.stop,
        };
        return this._provider.chat(request);
    }
    /**
     * Execute streaming chat completion
     */
    async *chatStream(messages, options = {}) {
        const request = {
            model: options.model || this._model,
            messages,
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens,
            topP: options.topP ?? 1.0,
            stream: true,
            stop: options.stop,
        };
        yield* this._provider.chatStream(request);
    }
    /**
     * Generate embeddings
     */
    async embeddings(texts, model) {
        return this._provider.embeddings(texts, model);
    }
    /**
     * Simple chat with a single prompt
     */
    async chatSimple(prompt, systemPrompt, options = {}) {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: MessageRole.SYSTEM, content: systemPrompt });
        }
        messages.push({ role: MessageRole.USER, content: prompt });
        const response = await this.chat(messages, options);
        return response.content;
    }
    /**
     * List supported models
     */
    listModels() {
        return this._provider.supportedModels;
    }
    /**
     * Get model information
     */
    getModelInfo() {
        return {
            provider: this.name,
            model: this._model,
            defaultModel: this._provider.defaultModel,
            supportedModels: this._provider.supportedModels,
            supportsStreaming: this._provider.supportsStreaming,
            supportsEmbeddings: this._provider.supportsEmbeddings,
        };
    }
    /**
     * String representation
     */
    toString() {
        return `LLMEngine(provider=${this.name}, model=${this._model})`;
    }
}
//# sourceMappingURL=engine.js.map