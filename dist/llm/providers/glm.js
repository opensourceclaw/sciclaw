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
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
/**
 * LLM Provider - GLM (Zhipu AI)
 */
import axios from "axios";
import { ChatMessageUtil, } from "../types";
import { LLMProvider, registerLLMProvider } from "../base";
let GLMProvider = (() => {
    let _classDecorators = [registerLLMProvider("glm")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = LLMProvider;
    var GLMProvider = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GLMProvider = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
        static DEFAULT_MODEL = "glm-4";
        static DEFAULT_EMBEDDING_MODEL = "embedding-2";
        static SUPPORTED_MODELS = [
            "glm-4",
            "glm-4-flash",
            "glm-4-plus",
            "glm-3-turbo",
        ];
        embeddingModel;
        constructor(config = {}) {
            super(config);
            this.baseUrl = config.baseUrl || GLMProvider.DEFAULT_BASE_URL;
            this.embeddingModel = config.embeddingModel || GLMProvider.DEFAULT_EMBEDDING_MODEL;
        }
        get name() {
            return "glm";
        }
        get requiresApiKey() {
            return true;
        }
        get defaultModel() {
            return GLMProvider.DEFAULT_MODEL;
        }
        get supportedModels() {
            return GLMProvider.SUPPORTED_MODELS;
        }
        getHeaders() {
            return {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            };
        }
        async chat(request) {
            const url = `${this.baseUrl}/chat/completions`;
            // GLM-specific request format
            const payload = {
                model: request.model,
                messages: request.messages.map((m) => ChatMessageUtil.toDict(m)),
                temperature: request.temperature,
                top_p: request.topP,
            };
            if (request.maxTokens !== undefined) {
                payload.max_tokens = request.maxTokens;
            }
            if (request.stop) {
                payload.stop = request.stop;
            }
            const response = await axios.post(url, payload, {
                headers: this.getHeaders(),
                timeout: request.timeout || 60000,
            });
            return this.parseChatResponse(response.data, request.model);
        }
        async *chatStream(request) {
            const url = `${this.baseUrl}/chat/completions`;
            const payload = {
                model: request.model,
                messages: request.messages.map((m) => ChatMessageUtil.toDict(m)),
                temperature: request.temperature,
                top_p: request.topP,
                stream: true,
            };
            if (request.maxTokens !== undefined) {
                payload.max_tokens = request.maxTokens;
            }
            if (request.stop) {
                payload.stop = request.stop;
            }
            const response = await axios.post(url, payload, {
                headers: this.getHeaders(),
                timeout: request.timeout || 60000,
                responseType: "stream",
            });
            const stream = response.data;
            let buffer = "";
            for await (const chunk of stream) {
                buffer += chunk.toString();
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: "))
                        continue;
                    const dataStr = trimmed.slice(6);
                    if (dataStr === "[DONE]")
                        return;
                    try {
                        const data = JSON.parse(dataStr);
                        const parsed = this.parseStreamChunk(data, request.model);
                        if (parsed)
                            yield parsed;
                    }
                    catch {
                        // Skip invalid JSON
                    }
                }
            }
        }
        async embeddings(texts, model) {
            const url = `${this.baseUrl}/embeddings`;
            const embeddingModel = model || this.embeddingModel;
            const results = [];
            // GLM API accepts one text at a time
            for (const text of texts) {
                const response = await axios.post(url, {
                    input: text,
                    model: embeddingModel,
                }, {
                    headers: this.getHeaders(),
                    timeout: 30000,
                });
                const data = response.data;
                const items = data.data || [];
                const item = items[0];
                const usage = {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0,
                };
                results.push({
                    embedding: item?.embedding || [],
                    model: embeddingModel,
                    usage,
                });
            }
            return results;
        }
        parseChatResponse(data, requestModel) {
            const choices = data.choices || [{}];
            const choice = choices[0] || {};
            const message = choice.message || {};
            const usage = {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
            };
            return {
                id: data.id || this.generateId(),
                model: data.model || requestModel,
                created: data.created || this.timestamp(),
                role: this.parseRole(message.role),
                content: message.content || "",
                finishReason: choice.finish_reason || "stop",
                usage,
                rawResponse: data,
            };
        }
        parseStreamChunk(data, requestModel) {
            const choices = data.choices || [{}];
            const choice = choices[0] || {};
            const delta = choice.delta || {};
            return {
                id: data.id || this.generateId(),
                model: data.model || requestModel,
                created: data.created || this.timestamp(),
                role: delta.role ? this.parseRole(delta.role) : undefined,
                content: delta.content || "",
                delta: delta.content || "",
                finishReason: choice.finish_reason,
            };
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return GLMProvider = _classThis;
})();
export { GLMProvider };
//# sourceMappingURL=glm.js.map