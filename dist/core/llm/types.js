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
 * LLM Types - Type definitions for LLM module
 */
/**
 * Message role enum
 */
export var MessageRole;
(function (MessageRole) {
    MessageRole["SYSTEM"] = "system";
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["TOOL"] = "tool";
})(MessageRole || (MessageRole = {}));
/**
 * Chat message utilities
 */
export const ChatMessageUtil = {
    toDict(msg) {
        const result = {
            role: msg.role,
            content: msg.content,
        };
        if (msg.name)
            result.name = msg.name;
        if (msg.toolCallId)
            result.tool_call_id = msg.toolCallId;
        return result;
    },
    fromDict(data) {
        return {
            role: typeof data.role === "string" ? data.role : MessageRole.USER,
            content: typeof data.content === "string" ? data.content : "",
            name: typeof data.name === "string" ? data.name : undefined,
            toolCallId: typeof data.tool_call_id === "string" ? data.tool_call_id : undefined,
        };
    },
};
/**
 * Chat completion utilities
 */
export const ChatCompletionUtil = {
    toDict(completion) {
        return {
            id: completion.id,
            model: completion.model,
            created: completion.created,
            role: completion.role,
            content: completion.content,
            finish_reason: completion.finishReason,
            usage: completion.usage,
        };
    },
};
/**
 * Chat completion stream chunk utilities
 */
export const ChatCompletionStreamChunkUtil = {
    toDict(chunk) {
        const result = {
            id: chunk.id,
            model: chunk.model,
            created: chunk.created,
        };
        if (chunk.role)
            result.role = chunk.role;
        if (chunk.content)
            result.content = chunk.content;
        if (chunk.delta)
            result.delta = chunk.delta;
        if (chunk.finishReason)
            result.finish_reason = chunk.finishReason;
        return result;
    },
};
/**
 * Embedding result utilities
 */
export const EmbeddingResultUtil = {
    toDict(result) {
        return {
            embedding: result.embedding,
            model: result.model,
            usage: result.usage,
        };
    },
};
/**
 * Chat completion request utilities
 */
export const ChatCompletionRequestUtil = {
    toDict(req) {
        const result = {
            model: req.model,
            messages: req.messages.map((m) => ChatMessageUtil.toDict(m)),
            temperature: req.temperature,
            top_p: req.topP,
            stream: req.stream,
        };
        if (req.maxTokens !== undefined)
            result.max_tokens = req.maxTokens;
        if (req.stop)
            result.stop = req.stop;
        if (req.tools)
            result.tools = req.tools;
        if (req.toolChoice)
            result.tool_choice = req.toolChoice;
        if (req.presencePenalty !== undefined)
            result.presence_penalty = req.presencePenalty;
        if (req.frequencyPenalty !== undefined)
            result.frequency_penalty = req.frequencyPenalty;
        if (req.user)
            result.user = req.user;
        return result;
    },
};
//# sourceMappingURL=types.js.map