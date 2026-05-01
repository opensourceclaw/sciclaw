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
Tests for summarization module - Summarizer
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from deepclaw.summarization.summarizer import Summarizer, SummarizerConfig
from deepclaw.summarization.data import SummarizationLength, SummarizationStyle, SummaryResult
from deepclaw.summarization.errors import SummarizationError


class TestSummarizerConfig:
    """Test SummarizerConfig"""

    def test_default_config(self):
        """Test default configuration"""
        config = SummarizerConfig()
        assert config.default_length == SummarizationLength.MEDIUM
        assert config.default_style == SummarizationStyle.CONCISE
        assert config.max_content_length == 50000
        assert config.max_retries == 3

    def test_custom_config(self):
        """Test custom configuration"""
        config = SummarizerConfig(
            default_length=SummarizationLength.LONG,
            default_style=SummarizationStyle.DETAILED,
            max_retries=5,
        )
        assert config.default_length == SummarizationLength.LONG
        assert config.default_style == SummarizationStyle.DETAILED
        assert config.max_retries == 5


class TestSummarizer:
    """Test Summarizer class"""

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_init_with_defaults(self, mock_llm_engine):
        """Test initialization with defaults"""
        summarizer = Summarizer()
        assert summarizer.llm_engine is not None
        assert summarizer.config.default_length == SummarizationLength.MEDIUM

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_init_with_custom_engine(self, mock_llm_engine):
        """Test initialization with custom LLM engine"""
        mock_engine = Mock()
        summarizer = Summarizer(llm_engine=mock_engine)
        assert summarizer.llm_engine == mock_engine

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_empty_content(self, mock_llm_engine):
        """Test summarizing empty content"""
        summarizer = Summarizer()
        result = summarizer.summarize("")

        assert result.success is False
        assert result.error == "Empty content provided"
        assert result.summary == ""

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_whitespace_content(self, mock_llm_engine):
        """Test summarizing whitespace-only content"""
        summarizer = Summarizer()
        result = summarizer.summarize("   ")

        assert result.success is False
        assert "Empty" in result.error

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_success(self, mock_llm_engine):
        """Test successful summarization"""
        # Mock the LLM engine
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        mock_engine.chat_simple.return_value = "This is a summary of the content."

        summarizer = Summarizer(llm_engine=mock_engine)
        result = summarizer.summarize("This is some long content that needs summarization.")

        assert result.success is True
        assert result.summary == "This is a summary of the content."
        assert result.original_length > 0

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_with_length_and_style(self, mock_llm_engine):
        """Test summarization with specific length and style"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        mock_engine.chat_simple.return_value = "Short summary."

        summarizer = Summarizer(llm_engine=mock_engine)
        result = summarizer.summarize(
            "Long content here",
            length=SummarizationLength.SHORT,
            style=SummarizationStyle.CASUAL,
        )

        assert result.length_type == SummarizationLength.SHORT
        assert result.style == SummarizationStyle.CASUAL
        mock_engine.chat_simple.assert_called_once()

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_content_truncation(self, mock_llm_engine):
        """Test content truncation for very long input"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        mock_engine.chat_simple.return_value = "Summary"

        summarizer = Summarizer(
            llm_engine=mock_engine,
            config=SummarizerConfig(max_content_length=100),
        )

        # Create content longer than max_content_length
        long_content = "x" * 200
        result = summarizer.summarize(long_content)

        # Verify truncation happened
        assert result.original_length == 200

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_retry_on_failure(self, mock_llm_engine):
        """Test retry on LLM failure"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        mock_engine.chat_simple.side_effect = [Exception("API Error"), "Success"]

        summarizer = Summarizer(
            llm_engine=mock_engine,
            config=SummarizerConfig(max_retries=2, retry_delay=0.01),
        )

        result = summarizer.summarize("Test content")
        assert result.success is True

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_all_retries_fail(self, mock_llm_engine):
        """Test when all retries fail"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        mock_engine.chat_simple.side_effect = Exception("API Error")

        summarizer = Summarizer(
            llm_engine=mock_engine,
            config=SummarizerConfig(max_retries=3, retry_delay=0.01),
        )

        result = summarizer.summarize("Test content")
        assert result.success is False
        assert result.error is not None

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_summarize_batch(self, mock_llm_engine):
        """Test batch summarization"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        mock_engine.chat_simple.return_value = "Summary"

        summarizer = Summarizer(llm_engine=mock_engine)
        results = summarizer.summarize_batch(["content1", "content2", "content3"])

        assert len(results) == 3
        assert all(r.success for r in results)

    @patch('deepclaw.summarization.summarizer.LLMEngine')
    def test_prompt_templates_exist(self, mock_llm_engine):
        """Test that all prompt templates exist"""
        from deepclaw.summarization.summarizer import PROMPT_TEMPLATES

        # Check all combinations
        for length in SummarizationLength:
            for style in SummarizationStyle:
                key = (length, style)
                assert key in PROMPT_TEMPLATES, f"Missing template for {key}"
