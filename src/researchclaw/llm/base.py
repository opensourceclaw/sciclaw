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
LLM Providers - Base classes and registry for LLM implementations
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Generator, Iterator
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    """Message role enum"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


@dataclass
class ChatMessage:
    """Chat message data class"""
    role: MessageRole
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = {
            "role": self.role.value,
            "content": self.content,
        }
        if self.name:
            result["name"] = self.name
        if self.tool_call_id:
            result["tool_call_id"] = self.tool_call_id
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ChatMessage":
        """Create from dictionary"""
        return cls(
            role=MessageRole(data.get("role", "user")),
            content=data.get("content", ""),
            name=data.get("name"),
            tool_call_id=data.get("tool_call_id"),
        )


@dataclass
class ChatCompletion:
    """Chat completion response"""
    id: str
    model: str
    created: int
    role: MessageRole
    content: str
    finish_reason: str = "stop"
    usage: Dict[str, int] = field(default_factory=lambda: {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
    })
    raw_response: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "model": self.model,
            "created": self.created,
            "role": self.role.value,
            "content": self.content,
            "finish_reason": self.finish_reason,
            "usage": self.usage,
        }


@dataclass
class ChatCompletionStreamChunk:
    """Chat completion stream chunk"""
    id: str
    model: str
    created: int
    role: Optional[MessageRole] = None
    content: str = ""
    delta: str = ""
    finish_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        result = {
            "id": self.id,
            "model": self.model,
            "created": self.created,
        }
        if self.role:
            result["role"] = self.role.value
        if self.content:
            result["content"] = self.content
        if self.delta:
            result["delta"] = self.delta
        if self.finish_reason:
            result["finish_reason"] = self.finish_reason
        return result


@dataclass
class EmbeddingResult:
    """Embedding result"""
    embedding: List[float]
    model: str
    usage: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "embedding": self.embedding,
            "model": self.model,
            "usage": self.usage,
        }


@dataclass
class ChatCompletionRequest:
    """Chat completion request"""
    model: str
    messages: List[ChatMessage]
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    top_p: float = 1.0
    stream: bool = False
    stop: Optional[List[str]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[str] = None
    presence_penalty: Optional[float] = None
    frequency_penalty: Optional[float] = None
    user: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to API request dict"""
        result = {
            "model": self.model,
            "messages": [m.to_dict() for m in self.messages],
            "temperature": self.temperature,
            "top_p": self.top_p,
            "stream": self.stream,
        }
        if self.max_tokens is not None:
            result["max_tokens"] = self.max_tokens
        if self.stop:
            result["stop"] = self.stop
        if self.tools:
            result["tools"] = self.tools
        if self.tool_choice:
            result["tool_choice"] = self.tool_choice
        if self.presence_penalty is not None:
            result["presence_penalty"] = self.presence_penalty
        if self.frequency_penalty is not None:
            result["frequency_penalty"] = self.frequency_penalty
        if self.user:
            result["user"] = self.user
        return result


class LLMProvider(ABC):
    """Base class for all LLM providers"""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, **config):
        """Initialize LLM provider

        Args:
            api_key: API key for the LLM service
            base_url: Base URL for API (optional, for custom endpoints)
            **config: Additional provider-specific configuration
        """
        self.api_key = api_key
        self.base_url = base_url
        self.config = config

    @abstractmethod
    def chat(self, request: ChatCompletionRequest) -> ChatCompletion:
        """Execute chat completion

        Args:
            request: Chat completion request

        Returns:
            ChatCompletion: Chat completion response
        """
        pass

    @abstractmethod
    def chat_stream(self, request: ChatCompletionRequest) -> Iterator[ChatCompletionStreamChunk]:
        """Execute streaming chat completion

        Args:
            request: Chat completion request (stream must be True)

        Yields:
            ChatCompletionStreamChunk: Stream chunks
        """
        pass

    @abstractmethod
    def embeddings(self, texts: List[str], model: Optional[str] = None) -> List[EmbeddingResult]:
        """Generate embeddings

        Args:
            texts: List of texts to embed
            model: Embedding model (provider-specific)

        Returns:
            List[EmbeddingResult]: Embedding results
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name

        Returns:
            str: Provider name
        """
        pass

    @property
    @abstractmethod
    def requires_api_key(self) -> bool:
        """Whether this provider requires an API key

        Returns:
            bool: True if API key is required
        """
        pass

    @property
    def default_model(self) -> str:
        """Default model for this provider

        Returns:
            str: Default model name
        """
        return ""

    @property
    def supported_models(self) -> List[str]:
        """List of supported models

        Returns:
            List[str]: List of model names
        """
        return []

    @property
    def supports_streaming(self) -> bool:
        """Whether this provider supports streaming

        Returns:
            bool: True if streaming is supported
        """
        return True

    @property
    def supports_embeddings(self) -> bool:
        """Whether this provider supports embeddings

        Returns:
            bool: True if embeddings are supported
        """
        return True

    def validate_config(self) -> bool:
        """Validate provider configuration

        Returns:
            bool: True if configuration is valid
        """
        if self.requires_api_key and not self.api_key:
            return False
        return True

    def _generate_id(self) -> str:
        """Generate a unique ID for requests"""
        import uuid
        return f"chatcmpl-{uuid.uuid4().hex[:8]}"

    def _timestamp(self) -> int:
        """Get current timestamp"""
        return int(datetime.now().timestamp())


class LLMProviderRegistry:
    """Registry for LLM providers"""

    _providers: Dict[str, type] = {}

    @classmethod
    def register(cls, name: str, provider_class: type) -> None:
        """Register an LLM provider

        Args:
            name: Provider name
            provider_class: Provider class
        """
        cls._providers[name.lower()] = provider_class

    @classmethod
    def get(cls, name: str) -> Optional[type]:
        """Get provider class by name

        Args:
            name: Provider name

        Returns:
            Optional[type]: Provider class or None
        """
        return cls._providers.get(name.lower())

    @classmethod
    def list_providers(cls) -> List[str]:
        """List all registered provider names

        Returns:
            List[str]: List of provider names
        """
        return list(cls._providers.keys())

    @classmethod
    def create(cls, name: str, **kwargs) -> Optional[LLMProvider]:
        """Create a provider instance

        Args:
            name: Provider name
            **kwargs: Provider configuration

        Returns:
            Optional[LLMProvider]: Provider instance or None
        """
        provider_class = cls.get(name)
        if provider_class:
            return provider_class(**kwargs)
        return None


def register_llm_provider(name: str):
    """Decorator to register an LLM provider

    Args:
        name: Provider name

    Returns:
        Decorator function
    """
    def decorator(cls: type) -> type:
        LLMProviderRegistry.register(name, cls)
        return cls
    return decorator


__all__ = [
    "MessageRole",
    "ChatMessage",
    "ChatCompletion",
    "ChatCompletionStreamChunk",
    "ChatCompletionRequest",
    "EmbeddingResult",
    "LLMProvider",
    "LLMProviderRegistry",
    "register_llm_provider",
]
