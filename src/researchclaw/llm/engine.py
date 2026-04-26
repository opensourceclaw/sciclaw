# Copyright 2026 Peter Cheng
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
LLM Engine - Unified interface for LLM providers
"""

from typing import List, Dict, Any, Optional, Iterator
import logging

from researchclaw.llm import (
    LLMProvider,
    LLMProviderRegistry,
    ChatMessage,
    ChatCompletion,
    ChatCompletionStreamChunk,
    ChatCompletionRequest,
    EmbeddingResult,
    MessageRole,
)

logger = logging.getLogger(__name__)


class LLMEngine:
    """Unified LLM engine that wraps all providers"""

    def __init__(
        self,
        provider: str = "deepseek",
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        **config
    ):
        """Initialize LLM engine

        Args:
            provider: Provider name (deepseek, glm, minimax, kimi)
            model: Model name (optional, uses provider default)
            api_key: API key (optional)
            base_url: Custom base URL (optional)
            **config: Additional provider configuration
        """
        self.provider_name = provider.lower()
        self._model = model  # Store model first (may be None)
        self.api_key = api_key
        self.base_url = base_url
        self.config = config

        # Create provider instance first
        self._provider = self._create_provider(self._model)
        
        # Update model with actual value (may have been set to default)
        self._model = self._model or self._provider.default_model

    def _create_provider(self, model: Optional[str] = None) -> LLMProvider:
        """Create the underlying provider instance

        Args:
            model: Model name (optional, uses provider default)

        Returns:
            LLMProvider: Provider instance

        Raises:
            ValueError: If provider is not found
        """
        provider_class = LLMProviderRegistry.get(self.provider_name)
        if not provider_class:
            available = LLMProviderRegistry.list_providers()
            raise ValueError(
                f"Unknown provider: {self.provider_name}. "
                f"Available: {', '.join(available)}"
            )

        # Use provided model or get default
        if not model:
            # Create temp instance to get default model
            temp_provider = provider_class(api_key=self.api_key, base_url=self.base_url)
            model = temp_provider.default_model

        return provider_class(
            api_key=self.api_key,
            base_url=self.base_url,
            model=model,
            **self.config
        )

    @property
    def provider(self) -> LLMProvider:
        """Get the underlying provider"""
        return self._provider

    @property
    def name(self) -> str:
        """Provider name"""
        return self._provider.name

    @property
    def model(self) -> str:
        """Current model"""
        return self._model

    @model.setter
    def model(self, value: Optional[str]):
        """Set model"""
        self._model = value or self._provider.default_model

    def chat(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        top_p: float = 1.0,
        stop: Optional[List[str]] = None,
        **kwargs
    ) -> ChatCompletion:
        """Execute chat completion

        Args:
            messages: List of chat messages
            model: Model name (optional, uses current)
            temperature: Temperature (0-2)
            max_tokens: Max tokens (optional)
            top_p: Top p sampling
            stop: Stop sequences
            **kwargs: Additional parameters

        Returns:
            ChatCompletion: Chat completion response
        """
        request = ChatCompletionRequest(
            model=model or self._model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            stream=False,
            stop=stop,
            **kwargs
        )
        
        return self._provider.chat(request)

    def chat_stream(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        top_p: float = 1.0,
        stop: Optional[List[str]] = None,
        **kwargs
    ) -> Iterator[ChatCompletionStreamChunk]:
        """Execute streaming chat completion

        Args:
            messages: List of chat messages
            model: Model name (optional, uses current)
            temperature: Temperature (0-2)
            max_tokens: Max tokens (optional)
            top_p: Top p sampling
            stop: Stop sequences
            **kwargs: Additional parameters

        Yields:
            ChatCompletionStreamChunk: Stream chunks
        """
        request = ChatCompletionRequest(
            model=model or self._model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            stream=True,
            stop=stop,
            **kwargs
        )
        
        return self._provider.chat_stream(request)

    def embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> List[EmbeddingResult]:
        """Generate embeddings

        Args:
            texts: List of texts to embed
            model: Embedding model (optional)

        Returns:
            List[EmbeddingResult]: Embedding results
        """
        return self._provider.embeddings(texts, model)

    def chat_simple(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> str:
        """Simple chat with a single prompt

        Args:
            prompt: User prompt
            system_prompt: System prompt (optional)
            **kwargs: Additional parameters

        Returns:
            str: Response content
        """
        messages = []
        
        if system_prompt:
            messages.append(ChatMessage(role=MessageRole.SYSTEM, content=system_prompt))
        
        messages.append(ChatMessage(role=MessageRole.USER, content=prompt))
        
        response = self.chat(messages, **kwargs)
        return response.content

    def list_models(self) -> List[str]:
        """List supported models

        Returns:
            List[str]: List of model names
        """
        return self._provider.supported_models

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information

        Returns:
            Dict[str, Any]: Model info
        """
        return {
            "provider": self.name,
            "model": self._model,
            "default_model": self._provider.default_model,
            "supported_models": self._provider.supported_models,
            "supports_streaming": self._provider.supports_streaming,
            "supports_embeddings": self._provider.supports_embeddings,
        }

    def __repr__(self) -> str:
        return f"LLMEngine(provider={self.name}, model={self._model})"


__all__ = ["LLMEngine"]
