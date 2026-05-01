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
LLM Provider - GLM (Zhipu AI)
"""

import json
from typing import List, Dict, Any, Optional, Iterator
import requests

from deepclaw.llm.base import (
    LLMProvider,
    LLMProviderRegistry,
    register_llm_provider,
    ChatMessage,
    ChatCompletion,
    ChatCompletionStreamChunk,
    ChatCompletionRequest,
    EmbeddingResult,
    MessageRole,
)


@register_llm_provider("glm")
class GLMProvider(LLMProvider):
    """GLM (Zhipu AI) LLM provider"""

    DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
    DEFAULT_MODEL = "glm-4"
    DEFAULT_EMBEDDING_MODEL = "embedding-2"

    SUPPORTED_MODELS = [
        "glm-4",
        "glm-4-flash",
        "glm-4-plus",
        "glm-3-turbo",
    ]

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, **config):
        """Initialize GLM provider

        Args:
            api_key: Zhipu AI API key
            base_url: Custom API base URL
            **config: Additional configuration
        """
        super().__init__(
            api_key=api_key,
            base_url=base_url or self.DEFAULT_BASE_URL,
            **config
        )

    @property
    def name(self) -> str:
        return "glm"

    @property
    def requires_api_key(self) -> bool:
        return True

    @property
    def default_model(self) -> str:
        return self.DEFAULT_MODEL

    @property
    def supported_models(self) -> List[str]:
        return self.SUPPORTED_MODELS

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def chat(self, request: ChatCompletionRequest) -> ChatCompletion:
        """Execute chat completion

        Args:
            request: Chat completion request

        Returns:
            ChatCompletion: Chat completion response
        """
        url = f"{self.base_url}/chat/completions"
        headers = self._get_headers()
        
        # GLM-specific request format
        payload = {
            "model": request.model,
            "messages": [m.to_dict() for m in request.messages],
            "temperature": request.temperature,
            "top_p": request.top_p,
        }
        
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.stop:
            payload["stop"] = request.stop

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()

        # Parse response
        choice = data.get("choices", [{}])[0]
        message = choice.get("message", {})
        
        return ChatCompletion(
            id=data.get("id", self._generate_id()),
            model=data.get("model", request.model),
            created=data.get("created", self._timestamp()),
            role=MessageRole(message.get("role", "assistant")),
            content=message.get("content", ""),
            finish_reason=choice.get("finish_reason", "stop"),
            usage=data.get("usage", {}),
            raw_response=data,
        )

    def chat_stream(self, request: ChatCompletionRequest) -> Iterator[ChatCompletionStreamChunk]:
        """Execute streaming chat completion

        Args:
            request: Chat completion request

        Yields:
            ChatCompletionStreamChunk: Stream chunks
        """
        url = f"{self.base_url}/chat/completions"
        headers = self._get_headers()
        
        payload = {
            "model": request.model,
            "messages": [m.to_dict() for m in request.messages],
            "temperature": request.temperature,
            "top_p": request.top_p,
            "stream": True,
        }
        
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.stop:
            payload["stop"] = request.stop

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            stream=True,
            timeout=60
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                line = line.decode("utf-8")
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    
                    try:
                        data = json.loads(data_str)
                        choice = data.get("choices", [{}])[0]
                        delta = choice.get("delta", {})
                        
                        yield ChatCompletionStreamChunk(
                            id=data.get("id", self._generate_id()),
                            model=data.get("model", request.model),
                            created=data.get("created", self._timestamp()),
                            role=MessageRole(delta.get("role")) if delta.get("role") else None,
                            content=delta.get("content", ""),
                            delta=delta.get("content", ""),
                            finish_reason=choice.get("finish_reason"),
                        )
                    except json.JSONDecodeError:
                        continue

    def embeddings(self, texts: List[str], model: Optional[str] = None) -> List[EmbeddingResult]:
        """Generate embeddings

        Args:
            texts: List of texts to embed
            model: Embedding model

        Returns:
            List[EmbeddingResult]: Embedding results
        """
        url = f"{self.base_url}/embeddings"
        headers = self._get_headers()
        
        embedding_model = model or self.DEFAULT_EMBEDDING_MODEL
        
        results = []
        
        # GLM API accepts one text at a time
        for text in texts:
            payload = {
                "input": text,
                "model": embedding_model,
            }

            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            item = data.get("data", [{}])[0]
            results.append(EmbeddingResult(
                embedding=item.get("embedding", []),
                model=embedding_model,
                usage=data.get("usage", {}),
            ))
        
        return results
