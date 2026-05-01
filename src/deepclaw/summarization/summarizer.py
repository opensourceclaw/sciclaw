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
Content Summarizer - LLM-based content summarization
"""

import time
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from deepclaw.llm.engine import LLMEngine
from deepclaw.llm.base import ChatMessage, MessageRole
from deepclaw.summarization.data import (
    SummarizationLength,
    SummarizationStyle,
    SummaryResult,
)
from deepclaw.summarization.errors import (
    LLMError,
    RateLimitError,
    FallbackError,
    ValidationError,
    SummarizationError,
)

logger = logging.getLogger(__name__)


# Prompt templates for different lengths and styles
PROMPT_TEMPLATES = {
    (SummarizationLength.SHORT, SummarizationStyle.CONCISE): (
        "Summarize the following content in 1-2 concise sentences:\n\n{content}\n\nSummary:"
    ),
    (SummarizationLength.SHORT, SummarizationStyle.DETAILED): (
        "Summarize the following content in 1-2 sentences with some details:\n\n{content}\n\nSummary:"
    ),
    (SummarizationLength.SHORT, SummarizationStyle.TECHNICAL): (
        "Provide a technical summary of the following content in 1-2 sentences:\n\n{content}\n\nTechnical Summary:"
    ),
    (SummarizationLength.SHORT, SummarizationStyle.CASUAL): (
        "Quickly summarize this in casual language (1-2 sentences):\n\n{content}\n\nQuick Summary:"
    ),
    (SummarizationLength.MEDIUM, SummarizationStyle.CONCISE): (
        "Summarize the following content in one concise paragraph using bullet points if helpful:\n\n{content}\n\nConcise Summary:"
    ),
    (SummarizationLength.MEDIUM, SummarizationStyle.DETAILED): (
        "Summarize the following content in a detailed paragraph:\n\n{content}\n\nDetailed Summary:"
    ),
    (SummarizationLength.MEDIUM, SummarizationStyle.TECHNICAL): (
        "Provide a technical summary of the following content in one paragraph with precise terminology:\n\n{content}\n\nTechnical Summary:"
    ),
    (SummarizationLength.MEDIUM, SummarizationStyle.CASUAL): (
        "Summarize this in casual, conversational tone in one paragraph:\n\n{content}\n\nCasual Summary:"
    ),
    (SummarizationLength.LONG, SummarizationStyle.CONCISE): (
        "Summarize the following content comprehensively but concisely, covering all key points:\n\n{content}\n\nComprehensive Summary:"
    ),
    (SummarizationLength.LONG, SummarizationStyle.DETAILED): (
        "Provide a thorough, detailed summary of the following content, covering all important aspects:\n\n{content}\n\nDetailed Summary:"
    ),
    (SummarizationLength.LONG, SummarizationStyle.TECHNICAL): (
        "Provide a comprehensive technical summary of the following content with precise terminology:\n\n{content}\n\nTechnical Summary:"
    ),
    (SummarizationLength.LONG, SummarizationStyle.CASUAL): (
        "Summarize this content in a friendly, conversational way with all key points:\n\n{content}\n\nFriendly Summary:"
    ),
}


@dataclass
class SummarizerConfig:
    """Configuration for the summarizer"""
    default_length: SummarizationLength = SummarizationLength.MEDIUM
    default_style: SummarizationStyle = SummarizationStyle.CONCISE
    max_content_length: int = 50000  # Max chars to send to LLM
    max_retries: int = 3
    retry_delay: float = 1.0  # seconds
    timeout: float = 30.0  # seconds


class Summarizer:
    """LLM-based content summarizer"""

    def __init__(
        self,
        llm_engine: Optional[LLMEngine] = None,
        config: Optional[SummarizerConfig] = None,
        provider: str = "deepseek",
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        """Initialize the summarizer

        Args:
            llm_engine: Pre-configured LLM engine (optional)
            config: Summarizer configuration (optional)
            provider: LLM provider name (default: deepseek)
            model: LLM model name (optional)
            api_key: API key (optional)
        """
        self.llm_engine = llm_engine or LLMEngine(
            provider=provider,
            model=model,
            api_key=api_key,
        )
        self.config = config or SummarizerConfig()

    def summarize(
        self,
        content: str,
        length: Optional[SummarizationLength] = None,
        style: Optional[SummarizationStyle] = None,
        max_retries: Optional[int] = None,
    ) -> SummaryResult:
        """Summarize the given content

        Args:
            content: Content to summarize
            length: Desired summary length (uses default if not specified)
            style: Desired summary style (uses default if not specified)
            max_retries: Max retry attempts (uses config if not specified)

        Returns:
            SummaryResult: Summarization result
        """
        start_time = time.time()

        # Validate input
        if not content or not content.strip():
            return SummaryResult(
                summary="",
                original_length=0,
                summary_length=0,
                length_type=length or self.config.default_length,
                style=style or self.config.default_style,
                model=self.llm_engine.model,
                duration_ms=0,
                success=False,
                error="Empty content provided",
            )

        # Use defaults
        length = length or self.config.default_length
        style = style or self.config.default_style
        max_retries = max_retries or self.config.max_retries

        # Truncate content if needed
        original_length = len(content)
        if original_length > self.config.max_content_length:
            content = content[: self.config.max_content_length]
            logger.warning(
                f"Content truncated from {original_length} to {self.config.max_content_length} chars"
            )

        # Build prompt
        prompt = self._build_prompt(content, length, style)

        # Try to generate summary with retries
        last_error = None
        for attempt in range(max_retries):
            try:
                response = self.llm_engine.chat_simple(
                    prompt=prompt,
                    temperature=0.5,
                    max_tokens=self._get_max_tokens(length),
                )

                duration_ms = (time.time() - start_time) * 1000

                return SummaryResult(
                    summary=response.strip(),
                    original_length=original_length,
                    summary_length=len(response),
                    length_type=length,
                    style=style,
                    model=self.llm_engine.model,
                    duration_ms=duration_ms,
                    success=True,
                )

            except Exception as e:
                last_error = e
                logger.warning(f"Summarization attempt {attempt + 1} failed: {e}")

                if attempt < max_retries - 1:
                    time.sleep(self.config.retry_delay * (attempt + 1))

        # All retries exhausted
        duration_ms = (time.time() - start_time) * 1000
        error_msg = str(last_error) if last_error else "Unknown error"

        return SummaryResult(
            summary="",
            original_length=original_length,
            summary_length=0,
            length_type=length,
            style=style,
            model=self.llm_engine.model,
            duration_ms=duration_ms,
            success=False,
            error=error_msg,
        )

    def _build_prompt(
        self,
        content: str,
        length: SummarizationLength,
        style: SummarizationStyle,
    ) -> str:
        """Build prompt for summarization"""
        key = (length, style)
        template = PROMPT_TEMPLATES.get(key, PROMPT_TEMPLATES[(length, SummarizationStyle.CONCISE)])
        return template.format(content=content)

    def _get_max_tokens(self, length: SummarizationLength) -> int:
        """Get max tokens for the given length"""
        tokens_map = {
            SummarizationLength.SHORT: 100,
            SummarizationLength.MEDIUM: 300,
            SummarizationLength.LONG: 800,
        }
        return tokens_map.get(length, 300)

    def summarize_batch(
        self,
        contents: List[str],
        length: Optional[SummarizationLength] = None,
        style: Optional[SummarizationStyle] = None,
    ) -> List[SummaryResult]:
        """Summarize multiple contents

        Args:
            contents: List of contents to summarize
            length: Desired summary length
            style: Desired summary style

        Returns:
            List[SummaryResult]: List of summarization results
        """
        results = []
        for content in contents:
            result = self.summarize(content, length, style)
            results.append(result)
        return results


__all__ = ["Summarizer", "SummarizerConfig", "SummarizationLength", "SummarizationStyle"]
