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
Tests for LLM base classes
"""

import pytest
from deepclaw.llm.base import (
    MessageRole,
    ChatMessage,
    ChatCompletion,
    ChatCompletionStreamChunk,
    ChatCompletionRequest,
    EmbeddingResult,
    LLMProvider,
    LLMProviderRegistry,
    register_llm_provider,
)


class TestMessageRole:
    """Test MessageRole enum"""

    def test_message_role_values(self):
        """Test MessageRole enum values"""
        assert MessageRole.SYSTEM.value == "system"
        assert MessageRole.USER.value == "user"
        assert MessageRole.ASSISTANT.value == "assistant"
        assert MessageRole.TOOL.value == "tool"


class TestChatMessage:
    """Test ChatMessage dataclass"""

    def test_create_user_message(self):
        """Test creating a user message"""
        msg = ChatMessage(role=MessageRole.USER, content="Hello")
        assert msg.role == MessageRole.USER
        assert msg.content == "Hello"
        assert msg.name is None
        assert msg.tool_call_id is None

    def test_create_message_with_name(self):
        """Test creating a message with name"""
        msg = ChatMessage(role=MessageRole.USER, content="Hello", name="user1")
        assert msg.name == "user1"

    def test_to_dict(self):
        """Test converting to dictionary"""
        msg = ChatMessage(role=MessageRole.USER, content="Hello")
        d = msg.to_dict()
        assert d["role"] == "user"
        assert d["content"] == "Hello"

    def test_from_dict(self):
        """Test creating from dictionary"""
        d = {"role": "user", "content": "Hello", "name": "user1"}
        msg = ChatMessage.from_dict(d)
        assert msg.role == MessageRole.USER
        assert msg.content == "Hello"
        assert msg.name == "user1"


class TestChatCompletion:
    """Test ChatCompletion dataclass"""

    def test_create_completion(self):
        """Test creating a chat completion"""
        completion = ChatCompletion(
            id="test-123",
            model="gpt-3.5",
            created=1234567890,
            role=MessageRole.ASSISTANT,
            content="Hello, how can I help?",
        )
        assert completion.id == "test-123"
        assert completion.model == "gpt-3.5"
        assert completion.role == MessageRole.ASSISTANT
        assert completion.content == "Hello, how can I help?"

    def test_to_dict(self):
        """Test converting to dictionary"""
        completion = ChatCompletion(
            id="test-123",
            model="gpt-3.5",
            created=1234567890,
            role=MessageRole.ASSISTANT,
            content="Hello",
            usage={"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        )
        d = completion.to_dict()
        assert d["id"] == "test-123"
        assert d["usage"]["total_tokens"] == 15


class TestChatCompletionStreamChunk:
    """Test ChatCompletionStreamChunk dataclass"""

    def test_create_chunk(self):
        """Test creating a stream chunk"""
        chunk = ChatCompletionStreamChunk(
            id="test-123",
            model="gpt-3.5",
            created=1234567890,
            delta="Hello",
            content="Hello",
        )
        assert chunk.delta == "Hello"
        assert chunk.content == "Hello"


class TestChatCompletionRequest:
    """Test ChatCompletionRequest dataclass"""

    def test_create_request(self):
        """Test creating a chat completion request"""
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content="You are helpful."),
            ChatMessage(role=MessageRole.USER, content="Hello"),
        ]
        request = ChatCompletionRequest(
            model="gpt-3.5",
            messages=messages,
            temperature=0.7,
            max_tokens=100,
        )
        assert request.model == "gpt-3.5"
        assert len(request.messages) == 2
        assert request.temperature == 0.7
        assert request.max_tokens == 100

    def test_to_dict(self):
        """Test converting to dictionary"""
        messages = [ChatMessage(role=MessageRole.USER, content="Hello")]
        request = ChatCompletionRequest(
            model="gpt-3.5",
            messages=messages,
            temperature=0.5,
        )
        d = request.to_dict()
        assert d["model"] == "gpt-3.5"
        assert d["messages"][0]["role"] == "user"
        assert d["temperature"] == 0.5


class TestEmbeddingResult:
    """Test EmbeddingResult dataclass"""

    def test_create_embedding(self):
        """Test creating an embedding result"""
        result = EmbeddingResult(
            embedding=[0.1, 0.2, 0.3],
            model="text-embedding-ada-002",
        )
        assert len(result.embedding) == 3
        assert result.model == "text-embedding-ada-002"

    def test_to_dict(self):
        """Test converting to dictionary"""
        result = EmbeddingResult(
            embedding=[0.1, 0.2],
            model="test-model",
            usage={"tokens": 10},
        )
        d = result.to_dict()
        assert len(d["embedding"]) == 2
        assert d["usage"]["tokens"] == 10


class MockLLMProvider(LLMProvider):
    """Mock LLM provider for testing"""

    DEFAULT_MODEL = "mock-model"

    @property
    def name(self) -> str:
        return "mock"

    @property
    def requires_api_key(self) -> bool:
        return False

    def chat(self, request: ChatCompletionRequest) -> ChatCompletion:
        return ChatCompletion(
            id="mock-123",
            model=request.model,
            created=1234567890,
            role=MessageRole.ASSISTANT,
            content="Mock response",
        )

    def chat_stream(self, request: ChatCompletionRequest):
        for i in range(3):
            yield ChatCompletionStreamChunk(
                id="mock-123",
                model=request.model,
                created=1234567890,
                delta=f"Chunk {i}",
                content=f"Chunk {i}",
            )

    def embeddings(self, texts, model=None):
        return [EmbeddingResult(embedding=[0.1], model=model or "mock-embed") for _ in texts]


class TestLLMProvider:
    """Test LLMProvider base class"""

    def test_provider_validation(self):
        """Test provider configuration validation"""
        provider = MockLLMProvider(api_key=None)
        assert provider.validate_config() is True

    def test_generate_id(self):
        """Test ID generation"""
        provider = MockLLMProvider()
        id1 = provider._generate_id()
        id2 = provider._generate_id()
        assert id1.startswith("chatcmpl-")
        assert id1 != id2

    def test_timestamp(self):
        """Test timestamp generation"""
        provider = MockLLMProvider()
        ts = provider._timestamp()
        assert isinstance(ts, int)
        assert ts > 0


class TestLLMProviderRegistry:
    """Test LLMProviderRegistry"""

    # Note: Don't clear registry as it clears real providers registered at import time

    def test_register_provider(self):
        """Test registering a provider"""
        LLMProviderRegistry.register("test", MockLLMProvider)
        assert LLMProviderRegistry.get("test") == MockLLMProvider

    def test_get_provider_case_insensitive(self):
        """Test provider lookup is case insensitive"""
        LLMProviderRegistry.register("Test", MockLLMProvider)
        assert LLMProviderRegistry.get("test") == MockLLMProvider
        assert LLMProviderRegistry.get("TEST") == MockLLMProvider

    def test_list_providers(self):
        """Test listing providers"""
        LLMProviderRegistry.register("test1", MockLLMProvider)
        LLMProviderRegistry.register("test2", MockLLMProvider)
        providers = LLMProviderRegistry.list_providers()
        assert "test1" in providers
        assert "test2" in providers

    def test_create_provider(self):
        """Test creating provider instance"""
        LLMProviderRegistry.register("mock", MockLLMProvider)
        provider = LLMProviderRegistry.create("mock")
        assert isinstance(provider, MockLLMProvider)
        assert provider.name == "mock"

    def test_create_nonexistent_provider(self):
        """Test creating nonexistent provider returns None"""
        provider = LLMProviderRegistry.create("nonexistent")
        assert provider is None


class TestRegisterLLMProvider:
    """Test register_llm_provider decorator - basic check"""

    def test_decorator_exists(self):
        """Test that the register_llm_provider decorator is defined"""
        from deepclaw.llm.base import register_llm_provider
        assert callable(register_llm_provider)
