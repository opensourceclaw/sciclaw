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
Tests for Qwen LLM provider
"""

import pytest
from unittest.mock import patch, MagicMock
from deepclaw.llm.providers.qwen import QwenProvider
from deepclaw.llm.base import (
    ChatMessage,
    ChatCompletionRequest,
    MessageRole,
)


class TestQwenProvider:
    """Test Qwen provider"""

    @pytest.fixture
    def provider(self):
        """Create provider with mock API key"""
        return QwenProvider(api_key="test-api-key")

    def test_provider_name(self, provider):
        """Test provider name"""
        assert provider.name == "qwen"

    def test_requires_api_key(self, provider):
        """Test API key requirement"""
        assert provider.requires_api_key is True

    def test_default_model(self, provider):
        """Test default model"""
        assert provider.default_model == "qwen-turbo"

    def test_supported_models(self, provider):
        """Test supported models"""
        assert "qwen-turbo" in provider.supported_models
        assert "qwen-plus" in provider.supported_models
        assert "qwen-max" in provider.supported_models

    def test_base_url(self, provider):
        """Test base URL"""
        assert provider.base_url == "https://dashscope.aliyuncs.com/compatible-mode/v1"

    def test_custom_base_url(self):
        """Test custom base URL"""
        provider = QwenProvider(api_key="test", base_url="https://custom.example.com")
        assert provider.base_url == "https://custom.example.com"

    def test_get_headers(self, provider):
        """Test headers include API key"""
        headers = provider._get_headers()
        assert headers["Content-Type"] == "application/json"
        assert headers["Authorization"] == "Bearer test-api-key"

    @patch("requests.post")
    def test_chat(self, mock_post, provider):
        """Test chat completion"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "id": "chatcmpl-123",
            "model": "qwen-turbo",
            "created": 1234567890,
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Hello, how can I help?",
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30,
            },
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        request = ChatCompletionRequest(
            model="qwen-turbo",
            messages=[ChatMessage(role=MessageRole.USER, content="Hello")],
        )

        response = provider.chat(request)

        assert response.id == "chatcmpl-123"
        assert response.content == "Hello, how can I help?"
        assert response.usage["total_tokens"] == 30
        mock_post.assert_called_once()

    @patch("requests.post")
    def test_chat_with_qwen_plus(self, mock_post, provider):
        """Test chat completion with qwen-plus model"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "id": "chatcmpl-456",
            "model": "qwen-plus",
            "created": 1234567890,
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Response from qwen-plus",
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 15,
                "completion_tokens": 25,
                "total_tokens": 40,
            },
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        request = ChatCompletionRequest(
            model="qwen-plus",
            messages=[ChatMessage(role=MessageRole.USER, content="Hello")],
        )

        response = provider.chat(request)

        assert response.model == "qwen-plus"
        assert response.content == "Response from qwen-plus"

    @patch("requests.post")
    def test_chat_stream(self, mock_post, provider):
        """Test streaming chat completion"""
        mock_response = MagicMock()
        mock_response.iter_lines.return_value = [
            b'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}',
            b'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" World"},"finish_reason":"stop"}]}',
            b"data: [DONE]",
        ]
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        request = ChatCompletionRequest(
            model="qwen-turbo",
            messages=[ChatMessage(role=MessageRole.USER, content="Hello")],
            stream=True,
        )

        chunks = list(provider.chat_stream(request))

        assert len(chunks) == 2
        assert chunks[0].delta == "Hello"
        assert chunks[1].delta == " World"

    @patch("requests.post")
    def test_chat_stream_with_role(self, mock_post, provider):
        """Test streaming chat completion with role"""
        mock_response = MagicMock()
        mock_response.iter_lines.return_value = [
            b'data: {"id":"chatcmpl-123","choices":[{"delta":{"role":"assistant","content":"Hi"},"finish_reason":null}]}',
            b"data: [DONE]",
        ]
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        request = ChatCompletionRequest(
            model="qwen-turbo",
            messages=[ChatMessage(role=MessageRole.USER, content="Hello")],
            stream=True,
        )

        chunks = list(provider.chat_stream(request))

        assert len(chunks) == 1
        assert chunks[0].role == MessageRole.ASSISTANT
        assert chunks[0].delta == "Hi"

    @patch("requests.post")
    def test_embeddings(self, mock_post, provider):
        """Test embeddings"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {"embedding": [0.1, 0.2, 0.3], "index": 0},
                {"embedding": [0.4, 0.5, 0.6], "index": 1},
            ],
            "usage": {"total_tokens": 10},
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        results = provider.embeddings(["text1", "text2"])

        assert len(results) == 2
        assert results[0].embedding == [0.1, 0.2, 0.3]
        assert results[1].embedding == [0.4, 0.5, 0.6]

    @patch("requests.post")
    def test_embeddings_custom_model(self, mock_post, provider):
        """Test embeddings with custom model"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {"embedding": [0.7, 0.8, 0.9], "index": 0},
            ],
            "usage": {"total_tokens": 5},
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        results = provider.embeddings(["custom text"], model="text-embedding-v2")

        assert len(results) == 1
        assert results[0].embedding == [0.7, 0.8, 0.9]
        assert results[0].model == "text-embedding-v2"

    def test_registry_registration(self):
        """Test provider is registered in registry"""
        from deepclaw.llm.base import LLMProviderRegistry
        provider_class = LLMProviderRegistry.get("qwen")
        assert provider_class is not None
        assert provider_class == QwenProvider
