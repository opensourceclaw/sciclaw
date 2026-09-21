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
 * LLM module - Large Language Model providers
 */

// Base types and classes
export {
  MessageRole,
  ChatMessage,
  ChatCompletion,
  ChatCompletionStreamChunk,
  ChatCompletionRequest,
  EmbeddingResult,
  TokenUsage,
  LLMProviderConfig,
  ChatMessageUtil,
  ChatCompletionUtil,
  ChatCompletionStreamChunkUtil,
  EmbeddingResultUtil,
  ChatCompletionRequestUtil,
  // v3.5.0 additions
  ProviderCapability,
  ProviderMetadata,
  ProviderHealth,
  RoutingConfig,
  FallbackConfig,
} from "./types.js";

// Base classes and registry
export {
  LLMProvider,
  LLMProviderRegistry,
  registerLLMProvider,
  LLMProviderClass,
} from "./base.js";

// Engine
export { LLMEngine, LLMEngineOptions, ModelInfo } from "./engine.js";

// Import providers to register them
import "./providers";

// Re-export provider classes
export {
  DeepSeekProvider,
  GLMProvider,
  MiniMaxProvider,
  KimiProvider,
  QwenProvider,
} from "./providers/index.js";
