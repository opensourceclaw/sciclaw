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
Key Point Extractor - Extract key points and core arguments from content
"""

import time
import logging
import json
import re
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from deepclaw.llm.engine import LLMEngine
from deepclaw.llm.base import ChatMessage, MessageRole
from deepclaw.summarization.data import KeyPoint, KeyPointsResult
from deepclaw.summarization.errors import LLMError, RateLimitError, SummarizationError

logger = logging.getLogger(__name__)


# System prompt for key point extraction
KEY_POINTS_SYSTEM_PROMPT = """You are an expert at analyzing content and extracting key points.
Your task is to identify the most important points and arguments from the given text.
Return your response as a JSON array of key points."""

# User prompt template
KEY_POINTS_USER_PROMPT = """Extract the {count} most important key points from the following content.

For each key point, provide:
1. text: The key point (1-2 sentences)
2. importance: Importance score (0.0-1.0)
3. category: Category/theme if applicable

Content:
{content}

Return as JSON array:
[{{"text": "...", "importance": 0.9, "category": "..."}}, ...]"""


@dataclass
class KeyPointExtractorConfig:
    """Configuration for key point extraction"""
    default_count: int = 5
    max_points: int = 10
    min_importance: float = 0.5
    max_content_length: int = 50000
    max_retries: int = 3
    timeout: float = 30.0


class KeyPointExtractor:
    """Extract key points from content using LLM"""

    def __init__(
        self,
        llm_engine: Optional[LLMEngine] = None,
        config: Optional[KeyPointExtractorConfig] = None,
        provider: str = "deepseek",
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        """Initialize the key point extractor

        Args:
            llm_engine: Pre-configured LLM engine (optional)
            config: Extractor configuration (optional)
            provider: LLM provider name (default: deepseek)
            model: LLM model name (optional)
            api_key: API key (optional)
        """
        self.llm_engine = llm_engine or LLMEngine(
            provider=provider,
            model=model,
            api_key=api_key,
        )
        self.config = config or KeyPointExtractorConfig()

    def extract_key_points(
        self,
        content: str,
        count: Optional[int] = None,
        max_retries: Optional[int] = None,
    ) -> KeyPointsResult:
        """Extract key points from content

        Args:
            content: Content to extract key points from
            count: Number of key points to extract (uses default if not specified)
            max_retries: Max retry attempts

        Returns:
            KeyPointsResult: Extraction result
        """
        start_time = time.time()

        # Validate input
        if not content or not content.strip():
            return KeyPointsResult(
                key_points=[],
                count=0,
                model=self.llm_engine.model,
                duration_ms=0,
                success=False,
                error="Empty content provided",
            )

        # Use defaults
        count = min(count or self.config.default_count, self.config.max_points)
        max_retries = max_retries or self.config.max_retries

        # Truncate content if needed
        original_length = len(content)
        if original_length > self.config.max_content_length:
            content = content[: self.config.max_content_length]
            logger.warning(
                f"Content truncated from {original_length} to {self.config.max_content_length} chars"
            )

        # Build prompt
        prompt = KEY_POINTS_USER_PROMPT.format(count=count, content=content)
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=KEY_POINTS_SYSTEM_PROMPT),
            ChatMessage(role=MessageRole.USER, content=prompt),
        ]

        # Try to extract key points with retries
        last_error = None
        for attempt in range(max_retries):
            try:
                response = self.llm_engine.chat(
                    messages=messages,
                    temperature=0.3,
                    max_tokens=1000,
                )

                # Parse JSON response
                key_points = self._parse_response(response.content)

                # Filter by importance
                key_points = [
                    kp for kp in key_points
                    if kp.importance >= self.config.min_importance
                ]

                # Sort by importance
                key_points.sort(key=lambda x: x.importance, reverse=True)

                # Limit count
                key_points = key_points[:count]

                duration_ms = (time.time() - start_time) * 1000

                return KeyPointsResult(
                    key_points=key_points,
                    count=len(key_points),
                    model=self.llm_engine.model,
                    duration_ms=duration_ms,
                    success=True,
                )

            except Exception as e:
                last_error = e
                logger.warning(f"Key point extraction attempt {attempt + 1} failed: {e}")

                if attempt < max_retries - 1:
                    time.sleep(1.0 * (attempt + 1))

        # All retries exhausted
        duration_ms = (time.time() - start_time) * 1000

        return KeyPointsResult(
            key_points=[],
            count=0,
            model=self.llm_engine.model,
            duration_ms=duration_ms,
            success=False,
            error=str(last_error) if last_error else "Unknown error",
        )

    def _parse_response(self, response: str) -> List[KeyPoint]:
        """Parse LLM response into KeyPoint objects"""
        key_points = []

        # Try to extract JSON from response
        try:
            # Find JSON array in response
            json_match = re.search(r'\[[\s\S]*\]', response)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)

                for item in data:
                    key_points.append(
                        KeyPoint(
                            text=item.get("text", ""),
                            importance=float(item.get("importance", 0.5)),
                            category=item.get("category"),
                            supporting_evidence=item.get("supporting_evidence", []),
                            source_section=item.get("source_section"),
                        )
                    )
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse key points JSON: {e}")
            # Try fallback: extract lines starting with dash or numbered items
            key_points = self._fallback_parse(response)

        return key_points

    def _fallback_parse(self, response: str) -> List[KeyPoint]:
        """Fallback parsing when JSON fails"""
        key_points = []
        lines = response.split('\n')

        for line in lines:
            line = line.strip()
            # Match lines like "1. text" or "- text"
            if re.match(r'^\d+[\.\)]\s+', line) or line.startswith('- '):
                text = re.sub(r'^\d+[\.\)]\s+', '', line).strip()
                if text:
                    key_points.append(
                        KeyPoint(
                            text=text,
                            importance=0.5,  # Default importance
                        )
                    )

        return key_points

    def extract_key_points_batch(
        self,
        contents: List[str],
        count: Optional[int] = None,
    ) -> List[KeyPointsResult]:
        """Extract key points from multiple contents

        Args:
            contents: List of contents to extract from
            count: Number of key points per content

        Returns:
            List[KeyPointsResult]: List of extraction results
        """
        results = []
        for content in contents:
            result = self.extract_key_points(content, count)
            results.append(result)
        return results


__all__ = ["KeyPointExtractor", "KeyPointExtractorConfig", "KeyPoint", "KeyPointsResult"]
