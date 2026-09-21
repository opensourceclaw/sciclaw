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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MiniMaxProvider_1;
/**
 * LLM Provider - MiniMax
 */
import axios from "axios";
import { ChatMessageUtil, } from "../types.js";
import { LLMProvider, registerLLMProvider } from "../base.js";
let MiniMaxProvider = class MiniMaxProvider extends LLMProvider {
    static { MiniMaxProvider_1 = this; }
    static DEFAULT_BASE_URL = "https://api.minimax.chat/v1";
    static DEFAULT_MODEL = "abab6.5s-chat";
    static DEFAULT_EMBEDDING_MODEL = "embo-01";
    static SUPPORTED_MODELS = [
        "abab6.5s-chat",
        "abab6.5g-chat",
        "abab5.5s-chat",
        "abab5.5g-chat",
    ];
    embeddingModel;
    constructor(config = {}) {
        super(config);
        this.baseUrl = config.baseUrl || MiniMaxProvider_1.DEFAULT_BASE_URL;
        this.embeddingModel = config.embeddingModel || MiniMaxProvider_1.DEFAULT_EMBEDDING_MODEL;
    }
    get name() {
        return "minimax";
    }
    get requiresApiKey() {
        return true;
    }
    get defaultModel() {
        return MiniMaxProvider_1.DEFAULT_MODEL;
    }
    get supportedModels() {
        return MiniMaxProvider_1.SUPPORTED_MODELS;
    }
    getHeaders() {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        };
    }
    async chat(request) {
        // MiniMax uses a different endpoint
        const url = `${this.baseUrl}/text/chatcompletion_v2`;
        // MiniMax-specific request format
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
        const url = `${this.baseUrl}/text/chatcompletion_v2`;
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
        const response = await axios.post(url, {
            input: texts,
            model: embeddingModel,
        }, {
            headers: this.getHeaders(),
            timeout: 60000,
        });
        const data = response.data;
        const usage = {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
        };
        return (data.data || []).map((item) => ({
            embedding: item.embedding,
            model: embeddingModel,
            usage,
        }));
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
};
MiniMaxProvider = MiniMaxProvider_1 = __decorate([
    registerLLMProvider("minimax")
], MiniMaxProvider);
export { MiniMaxProvider };
//# sourceMappingURL=minimax.js.map