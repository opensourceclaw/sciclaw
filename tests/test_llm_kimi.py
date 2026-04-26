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
Tests for Kimi (Moonshot AI) LLM provider
"""

import pytest
from unittest.mock import patch, MagicMock
from researchclaw.llm.providers.kimi import KimiProvider
from researchclaw.llm.base import (
    ChatMessage,
    ChatCompletionRequest,
    MessageRole,
)


class TestKimiProvider:
    """Test Kimi provider"""

    @pytest.fixture
    def provider(self):
        """Create provider with mock API key"""
        return KimiProvider(api_key="test-api-key")

    def test_provider_name(self, provider):
        """Test provider name"""
        assert provider.name == "kimi"

    def test_requires_api_key(self, provider):
        """Test API key requirement"""
        assert provider.requires_api_key is True

    def test_default_model(self, provider):
        """Test default model"""
        assert provider.default_model == "moonshot-v1-8k-chat"

    def test_supported_models(self, provider):
        """Test supported models"""
        assert "moonshot-v1-8k-chat" in provider.supported_models
        assert "moonshot-v1-32k-chat" in provider.supported_models
        assert "moonshot-v1-128k-chat" in provider.supported_models

    def test_base_url(self, provider):
        """Test base URL"""
        assert provider.base_url == "https://api.moonshot.cn/v1"

    def test_custom_base_url(self):
        """Test custom base URL"""
        provider = KimiProvider(api_key="test", base_url="https://custom.example.com")
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
            "id": "kimi-123",
            "model": "moonshot-v1-8k-chat",
            "created": 1234567890,
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "你好，我是Kimi。",
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
            model="moonshot-v1-8k-chat",
            messages=[ChatMessage(role=MessageRole.USER, content="你好")],
        )

        response = provider.chat(request)

        assert response.id == "kimi-123"
        assert response.content == "你好，我是Kimi。"
        assert response.usage["total_tokens"] == 30

    @patch("requests.post")
    def test_chat_stream(self, mock_post, provider):
        """Test streaming chat completion"""
        mock_response = MagicMock()
        mock_response.iter_lines.return_value = [
            b'data: {"id":"kimi-123","choices":[{"delta":{"role":"assistant","content":"\xe4\xbd\xa0"},"finish_reason":null}]}',
            b'data: {"id":"kimi-123","choices":[{"delta":{"content":"\xe5\xa5\xbd"},"finish_reason":"stop"}]}',
            b"data: [DONE]",
        ]
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        request = ChatCompletionRequest(
            model="moonshot-v1-8k-chat",
            messages=[ChatMessage(role=MessageRole.USER, content="你好")],
            stream=True,
        )

        chunks = list(provider.chat_stream(request))

        assert len(chunks) == 2
        assert chunks[0].delta == "你"
        assert chunks[1].delta == "好"

    @patch("requests.post")
    def test_embeddings(self, mock_post, provider):
        """Test embeddings (one at a time)"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {"embedding": [0.1, 0.2, 0.3], "index": 0},
            ],
            "usage": {"total_tokens": 5},
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        results = provider.embeddings(["test text"])

        assert len(results) == 1
        assert results[0].embedding == [0.1, 0.2, 0.3]
