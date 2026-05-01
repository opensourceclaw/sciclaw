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
Tests for LLM Engine
"""

import pytest
from deepclaw.llm.engine import LLMEngine


class TestLLMEngineBasic:
    """Test LLMEngine basic functionality with real providers"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure providers are registered"""
        import deepclaw.llm.providers.deepseek  # noqa: F401
        import deepclaw.llm.providers.glm  # noqa: F401
        import deepclaw.llm.providers.minimax  # noqa: F401
        import deepclaw.llm.providers.kimi  # noqa: F401

    def test_deepseek_default_model(self):
        """Test DeepSeek has correct default model"""
        engine = LLMEngine(provider="deepseek", api_key="test-key")
        assert engine.name == "deepseek"
        assert engine.model == "deepseek-chat"

    def test_glm_default_model(self):
        """Test GLM has correct default model"""
        engine = LLMEngine(provider="glm", api_key="test-key")
        assert engine.name == "glm"
        assert engine.model == "glm-4"

    def test_minimax_default_model(self):
        """Test MiniMax has correct default model"""
        engine = LLMEngine(provider="minimax", api_key="test-key")
        assert engine.name == "minimax"
        assert engine.model == "abab6.5s-chat"

    def test_kimi_default_model(self):
        """Test Kimi has correct default model"""
        engine = LLMEngine(provider="kimi", api_key="test-key")
        assert engine.name == "kimi"
        assert engine.model == "moonshot-v1-8k-chat"

    def test_custom_model(self):
        """Test custom model override"""
        engine = LLMEngine(provider="deepseek", api_key="test-key", model="deepseek-coder")
        assert engine.model == "deepseek-coder"

    def test_invalid_provider(self):
        """Test invalid provider raises error"""
        with pytest.raises(ValueError) as exc:
            LLMEngine(provider="nonexistent")
        assert "Unknown provider" in str(exc.value)

    def test_provider_property(self):
        """Test provider property"""
        engine = LLMEngine(provider="deepseek", api_key="test-key")
        assert engine.provider is not None

    def test_list_models(self):
        """Test listing models"""
        engine = LLMEngine(provider="deepseek", api_key="test-key")
        models = engine.list_models()
        assert "deepseek-chat" in models
        assert "deepseek-coder" in models

    def test_get_model_info(self):
        """Test getting model info"""
        engine = LLMEngine(provider="deepseek", api_key="test-key")
        info = engine.get_model_info()
        assert info["provider"] == "deepseek"
        assert info["model"] == "deepseek-chat"

    def test_repr(self):
        """Test string representation"""
        engine = LLMEngine(provider="deepseek", api_key="test-key")
        r = repr(engine)
        assert "deepseek" in r
        assert "deepseek-chat" in r
