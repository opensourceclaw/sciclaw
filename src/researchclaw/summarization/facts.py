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
Fact Extractor - Extract structured facts and data from content
"""

import time
import logging
import json
import re
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from researchclaw.llm.engine import LLMEngine
from researchclaw.llm.base import ChatMessage, MessageRole
from researchclaw.summarization.data import ExtractedFact, FactsResult
from researchclaw.summarization.errors import LLMError, RateLimitError, SummarizationError

logger = logging.getLogger(__name__)


# System prompt for fact extraction
FACTS_SYSTEM_PROMPT = """You are an expert at extracting factual information from text.
Your task is to identify and extract structured facts, statistics, dates, numbers, and specific claims from the given content.
Return your response as a JSON array of facts."""

# User prompt template
FACTS_USER_PROMPT = """Extract up to {count} factual statements from the following content.

For each fact, provide:
1. statement: The factual statement (complete sentence)
2. subject: The subject of the fact
3. predicate: What is being claimed about the subject
4. value: The actual value/fact (can be a number, date, or text)
5. confidence: Confidence score (0.0-1.0) based on how explicitly stated
6. source: Source section if applicable

Content:
{content}

Return as JSON array:
[{{"statement": "...", "subject": "...", "predicate": "...", "value": "...", "confidence": 0.9, "source": "..."}}, ...]"""


@dataclass
class FactExtractorConfig:
    """Configuration for fact extraction"""
    default_count: int = 10
    max_facts: int = 20
    min_confidence: float = 0.5
    max_content_length: int = 50000
    max_retries: int = 3
    timeout: float = 30.0


class FactExtractor:
    """Extract structured facts from content using LLM"""

    def __init__(
        self,
        llm_engine: Optional[LLMEngine] = None,
        config: Optional[FactExtractorConfig] = None,
        provider: str = "deepseek",
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        """Initialize the fact extractor

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
        self.config = config or FactExtractorConfig()

    def extract_facts(
        self,
        content: str,
        count: Optional[int] = None,
        max_retries: Optional[int] = None,
    ) -> FactsResult:
        """Extract facts from content

        Args:
            content: Content to extract facts from
            count: Maximum number of facts to extract
            max_retries: Max retry attempts

        Returns:
            FactsResult: Extraction result
        """
        start_time = time.time()

        # Validate input
        if not content or not content.strip():
            return FactsResult(
                facts=[],
                count=0,
                model=self.llm_engine.model,
                duration_ms=0,
                success=False,
                error="Empty content provided",
            )

        # Use defaults
        count = min(count or self.config.default_count, self.config.max_facts)
        max_retries = max_retries or self.config.max_retries

        # Truncate content if needed
        original_length = len(content)
        if original_length > self.config.max_content_length:
            content = content[: self.config.max_content_length]
            logger.warning(
                f"Content truncated from {original_length} to {self.config.max_content_length} chars"
            )

        # Build prompt
        prompt = FACTS_USER_PROMPT.format(count=count, content=content)
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=FACTS_SYSTEM_PROMPT),
            ChatMessage(role=MessageRole.USER, content=prompt),
        ]

        # Try to extract facts with retries
        last_error = None
        for attempt in range(max_retries):
            try:
                response = self.llm_engine.chat(
                    messages=messages,
                    temperature=0.2,
                    max_tokens=1500,
                )

                # Parse JSON response
                facts = self._parse_response(response.content)

                # Filter by confidence
                facts = [
                    f for f in facts
                    if f.confidence >= self.config.min_confidence
                ]

                # Sort by confidence
                facts.sort(key=lambda x: x.confidence, reverse=True)

                # Limit count
                facts = facts[:count]

                duration_ms = (time.time() - start_time) * 1000

                return FactsResult(
                    facts=facts,
                    count=len(facts),
                    model=self.llm_engine.model,
                    duration_ms=duration_ms,
                    success=True,
                )

            except Exception as e:
                last_error = e
                logger.warning(f"Fact extraction attempt {attempt + 1} failed: {e}")

                if attempt < max_retries - 1:
                    time.sleep(1.0 * (attempt + 1))

        # All retries exhausted
        duration_ms = (time.time() - start_time) * 1000

        return FactsResult(
            facts=[],
            count=0,
            model=self.llm_engine.model,
            duration_ms=duration_ms,
            success=False,
            error=str(last_error) if last_error else "Unknown error",
        )

    def _parse_response(self, response: str) -> List[ExtractedFact]:
        """Parse LLM response into ExtractedFact objects"""
        facts = []

        # Try to extract JSON from response
        try:
            # Find JSON array in response
            json_match = re.search(r'\[[\s\S]*\]', response)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)

                for item in data:
                    facts.append(
                        ExtractedFact(
                            statement=item.get("statement", ""),
                            subject=item.get("subject", ""),
                            predicate=item.get("predicate", ""),
                            value=item.get("value", ""),
                            confidence=float(item.get("confidence", 0.5)),
                            source=item.get("source"),
                            context=item.get("context"),
                        )
                    )
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse facts JSON: {e}")
            # Try fallback parsing
            facts = self._fallback_parse(response)

        return facts

    def _fallback_parse(self, response: str) -> List[ExtractedFact]:
        """Fallback parsing when JSON fails"""
        facts = []
        lines = response.split('\n')

        for line in lines:
            line = line.strip()
            # Match lines like "1. fact" or "- fact"
            if re.match(r'^\d+[\.\)]\s+', line) or line.startswith('- '):
                text = re.sub(r'^\d+[\.\)]\s+', '', line).strip()
                if text:
                    facts.append(
                        ExtractedFact(
                            statement=text,
                            subject="",
                            predicate="",
                            value=text,
                            confidence=0.5,  # Default confidence
                        )
                    )

        return facts

    def extract_facts_batch(
        self,
        contents: List[str],
        count: Optional[int] = None,
    ) -> List[FactsResult]:
        """Extract facts from multiple contents

        Args:
            contents: List of contents to extract from
            count: Maximum number of facts per content

        Returns:
            List[FactsResult]: List of extraction results
        """
        results = []
        for content in contents:
            result = self.extract_facts(content, count)
            results.append(result)
        return results

    def to_structured_data(self, facts_result: FactsResult) -> Dict[str, Any]:
        """Convert facts to structured data format

        Args:
            facts_result: Facts extraction result

        Returns:
            Dict[str, Any]: Structured data
        """
        structured = {
            "count": facts_result.count,
            "success": facts_result.success,
            "facts": [],
        }

        for fact in facts_result.facts:
            structured["facts"].append({
                "subject": fact.subject,
                "predicate": fact.predicate,
                "value": fact.value,
                "confidence": fact.confidence,
            })

        return structured


__all__ = ["FactExtractor", "FactExtractorConfig", "ExtractedFact", "FactsResult"]
