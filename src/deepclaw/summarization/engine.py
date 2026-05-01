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
Summarization Engine - Unified engine with error handling and fallbacks
"""

import time
import logging
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum

from deepclaw.llm.engine import LLMEngine
from deepclaw.llm.base import ChatMessage, MessageRole
from deepclaw.summarization.data import (
    SummarizationLength,
    SummarizationStyle,
    SummaryResult,
    KeyPoint,
    KeyPointsResult,
    ExtractedFact,
    FactsResult,
)
from deepclaw.summarization.summarizer import Summarizer, SummarizerConfig
from deepclaw.summarization.key_points import KeyPointExtractor, KeyPointExtractorConfig
from deepclaw.summarization.facts import FactExtractor, FactExtractorConfig
from deepclaw.summarization.errors import (
    LLMError,
    RateLimitError,
    FallbackError,
    SummarizationError,
    ErrorSeverity,
)

logger = logging.getLogger(__name__)


class FallbackStrategy(str, Enum):
    """Fallback strategies when primary LLM fails"""
    RETRY = "retry"               # Simple retry
    REDUCE_LENGTH = "reduce_length"  # Try shorter length
    SIMPLIFY_STYLE = "simplify_style"  # Try simpler style
    FALLBACK_PROVIDER = "fallback_provider"  # Switch provider
    EXTRACTIVE = "extractive"     # Use extractive summarization


@dataclass
class EngineConfig:
    """Configuration for the summarization engine"""
    # Primary settings
    default_provider: str = "deepseek"
    fallback_providers: List[str] = field(default_factory=lambda: ["glm", "kimi"])
    default_model: Optional[str] = None

    # Retry settings
    max_retries: int = 3
    retry_delay: float = 1.0
    exponential_backoff: bool = True

    # Timeout settings
    default_timeout: float = 30.0
    summary_timeout: float = 30.0
    key_points_timeout: float = 30.0
    facts_timeout: float = 30.0

    # Performance targets
    target_latency_ms: float = 3000.0  # 3 seconds target

    # Fallback settings
    fallback_strategies: List[FallbackStrategy] = field(
        default_factory=lambda: [
            FallbackStrategy.RETRY,
            FallbackStrategy.REDUCE_LENGTH,
            FallbackStrategy.SIMPLIFY_STYLE,
            FallbackStrategy.FALLBACK_PROVIDER,
            FallbackStrategy.EXTRACTIVE,
        ]
    )


class PerformanceTracker:
    """Track performance metrics"""

    def __init__(self):
        self.total_requests: int = 0
        self.successful_requests: int = 0
        self.failed_requests: int = 0
        self.total_duration_ms: float = 0.0
        self.latencies: List[float] = []

    def record(self, success: bool, duration_ms: float):
        """Record a request"""
        self.total_requests += 1
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        self.total_duration_ms += duration_ms
        self.latencies.append(duration_ms)

    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_requests == 0:
            return 0.0
        return self.successful_requests / self.total_requests

    @property
    def average_latency_ms(self) -> float:
        """Calculate average latency"""
        if self.total_requests == 0:
            return 0.0
        return self.total_duration_ms / self.total_requests

    @property
    def p95_latency_ms(self) -> float:
        """Calculate P95 latency"""
        if not self.latencies:
            return 0.0
        sorted_latencies = sorted(self.latencies)
        index = int(len(sorted_latencies) * 0.95)
        return sorted_latencies[index] if index < len(sorted_latencies) else sorted_latencies[-1]

    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": self.success_rate,
            "average_latency_ms": self.average_latency_ms,
            "p95_latency_ms": self.p95_latency_ms,
        }


class SummarizationEngine:
    """Unified summarization engine with error handling and fallbacks"""

    def __init__(
        self,
        config: Optional[EngineConfig] = None,
        api_key: Optional[str] = None,
    ):
        """Initialize the summarization engine

        Args:
            config: Engine configuration (optional)
            api_key: API key for primary provider (optional)
        """
        self.config = config or EngineConfig()
        self.api_key = api_key

        # Initialize components
        self._init_components()

        # Performance tracking
        self.performance = PerformanceTracker()

    def _init_components(self):
        """Initialize LLM engine and extractors"""
        # Primary LLM engine
        self.llm_engine = LLMEngine(
            provider=self.config.default_provider,
            model=self.config.default_model,
            api_key=self.api_key,
        )

        # Initialize extractors
        self.summarizer = Summarizer(
            llm_engine=self.llm_engine,
            config=SummarizerConfig(max_retries=self.config.max_retries),
        )

        self.key_point_extractor = KeyPointExtractor(
            llm_engine=self.llm_engine,
            config=KeyPointExtractorConfig(max_retries=self.config.max_retries),
        )

        self.fact_extractor = FactExtractor(
            llm_engine=self.llm_engine,
            config=FactExtractorConfig(max_retries=self.config.max_retries),
        )

    def summarize(
        self,
        content: str,
        length: SummarizationLength = SummarizationLength.MEDIUM,
        style: SummarizationStyle = SummarizationStyle.CONCISE,
    ) -> SummaryResult:
        """Summarize content with automatic fallback handling

        Args:
            content: Content to summarize
            length: Desired summary length
            style: Desired summary style

        Returns:
            SummaryResult: Summarization result
        """
        start_time = time.time()

        try:
            result = self.summarizer.summarize(content, length, style)
            duration_ms = (time.time() - start_time) * 1000
            self.performance.record(result.success, duration_ms)
            return result

        except Exception as e:
            # Try fallback strategies
            logger.warning(f"Primary summarization failed: {e}")
            result = self._fallback_summarize(content, length, style)
            duration_ms = (time.time() - start_time) * 1000
            self.performance.record(result.success, duration_ms)
            return result

    def _fallback_summarize(
        self,
        content: str,
        length: SummarizationLength,
        style: SummarizationStyle,
    ) -> SummaryResult:
        """Handle fallback when primary LLM fails"""
        strategies_tried = []

        for strategy in self.config.fallback_strategies:
            try:
                if strategy == FallbackStrategy.RETRY:
                    # Simple retry
                    result = self.summarizer.summarize(content, length, style)
                    if result.success:
                        return result

                elif strategy == FallbackStrategy.REDUCE_LENGTH:
                    # Try shorter length
                    shorter_length = SummarizationLength.SHORT
                    result = self.summarizer.summarize(content, shorter_length, style)
                    if result.success:
                        return result

                elif strategy == FallbackStrategy.SIMPLIFY_STYLE:
                    # Try simpler style
                    result = self.summarizer.summarize(content, length, SummarizationStyle.CONCISE)
                    if result.success:
                        return result

                elif strategy == FallbackStrategy.FALLBACK_PROVIDER:
                    # Try fallback provider
                    result = self._try_fallback_provider(
                        lambda engine: Summarizer(llm_engine=engine).summarize(content, length, style)
                    )
                    if result:
                        return result

                elif strategy == FallbackStrategy.EXTRACTIVE:
                    # Use extractive summarization as last resort
                    result = self._extractive_summarize(content, length)
                    if result.success:
                        return result

                strategies_tried.append(strategy)

            except Exception as e:
                logger.warning(f"Fallback strategy {strategy} failed: {e}")
                continue

        # All strategies exhausted
        return SummaryResult(
            summary="",
            original_length=len(content),
            summary_length=0,
            length_type=length,
            style=style,
            model=self.llm_engine.model,
            duration_ms=0,
            success=False,
            error=f"All fallback strategies exhausted. Tried: {strategies_tried}",
        )

    def _try_fallback_provider(
        self,
        func: Callable[[LLMEngine], SummaryResult]
    ) -> Optional[SummaryResult]:
        """Try fallback providers"""
        for provider_name in self.config.fallback_providers:
            try:
                logger.info(f"Trying fallback provider: {provider_name}")
                fallback_engine = LLMEngine(
                    provider=provider_name,
                    api_key=self.api_key,
                )
                result = func(fallback_engine)
                if result.success:
                    # Update main engine to use working provider
                    self.llm_engine = fallback_engine
                    self.summarizer.llm_engine = fallback_engine
                    return result
            except Exception as e:
                logger.warning(f"Fallback provider {provider_name} failed: {e}")
                continue

        return None

    def _extractive_summarize(
        self,
        content: str,
        length: SummarizationLength,
    ) -> SummaryResult:
        """Fallback to extractive summarization"""
        # Simple extractive summarization: take first N sentences
        sentences = content.split('. ')
        if length == SummarizationLength.SHORT:
            n = 2
        elif length == SummarizationLength.MEDIUM:
            n = 5
        else:
            n = 10

        selected = sentences[:n]
        summary = '. '.join(selected)
        if not summary.endswith('.'):
            summary += '.'

        return SummaryResult(
            summary=summary,
            original_length=len(content),
            summary_length=len(summary),
            length_type=length,
            style=SummarizationStyle.CONCISE,
            model="extractive",
            duration_ms=0,
            success=True,
            metadata={"method": "extractive"},
        )

    def extract_key_points(
        self,
        content: str,
        count: int = 5,
    ) -> KeyPointsResult:
        """Extract key points with fallback handling

        Args:
            content: Content to extract from
            count: Number of key points

        Returns:
            KeyPointsResult: Extraction result
        """
        start_time = time.time()

        try:
            result = self.key_point_extractor.extract_key_points(content, count)
            duration_ms = (time.time() - start_time) * 1000
            self.performance.record(result.success, duration_ms)
            return result

        except Exception as e:
            logger.warning(f"Primary key point extraction failed: {e}")
            result = self._fallback_key_points(content, count)
            duration_ms = (time.time() - start_time) * 1000
            self.performance.record(result.success, duration_ms)
            return result

    def _fallback_key_points(
        self,
        content: str,
        count: int,
    ) -> KeyPointsResult:
        """Fallback key point extraction"""
        # Simple extractive fallback
        sentences = content.split('. ')
        key_points = []

        for i, sentence in enumerate(sentences[:count]):
            if sentence.strip():
                key_points.append(
                    KeyPoint(
                        text=sentence.strip() + '.',
                        importance=1.0 - (i * 0.1),  # Earlier = more important
                    )
                )

        return KeyPointsResult(
            key_points=key_points,
            count=len(key_points),
            model="extractive",
            duration_ms=0,
            success=True,
            metadata={"method": "extractive"},
        )

    def extract_facts(
        self,
        content: str,
        count: int = 10,
    ) -> FactsResult:
        """Extract facts with fallback handling

        Args:
            content: Content to extract from
            count: Maximum number of facts

        Returns:
            FactsResult: Extraction result
        """
        start_time = time.time()

        try:
            result = self.fact_extractor.extract_facts(content, count)
            duration_ms = (time.time() - start_time) * 1000
            self.performance.record(result.success, duration_ms)
            return result

        except Exception as e:
            logger.warning(f"Primary fact extraction failed: {e}")
            result = self._fallback_facts(content, count)
            duration_ms = (time.time() - start_time) * 1000
            self.performance.record(result.success, duration_ms)
            return result

    def _fallback_facts(
        self,
        content: str,
        count: int,
    ) -> FactsResult:
        """Fallback fact extraction"""
        # Simple extractive fallback: extract sentences with numbers/dates
        import re

        facts = []
        sentences = content.split('. ')

        # Pattern for numbers, dates, percentages
        patterns = [
            r'\d+%',           # Percentages
            r'\$\d+',          # Money
            r'\d{4}',          # Years
            r'\d+\s*(million|billion|thousand)',  # Large numbers
            r'\d+\.\d+',       # Decimals
        ]

        for sentence in sentences:
            for pattern in patterns:
                if re.search(pattern, sentence):
                    facts.append(
                        ExtractedFact(
                            statement=sentence.strip() + '.',
                            subject="",
                            predicate="",
                            value=re.search(pattern, sentence).group(),
                            confidence=0.5,
                        )
                    )
                    break

            if len(facts) >= count:
                break

        return FactsResult(
            facts=facts,
            count=len(facts),
            model="extractive",
            duration_ms=0,
            success=True,
            metadata={"method": "extractive"},
        )

    def process(
        self,
        content: str,
        extract_summary: bool = True,
        extract_key_points: bool = True,
        extract_facts: bool = True,
        summary_length: SummarizationLength = SummarizationLength.MEDIUM,
        summary_style: SummarizationStyle = SummarizationStyle.CONCISE,
        key_points_count: int = 5,
        facts_count: int = 10,
    ) -> Dict[str, Any]:
        """Process content with all extraction methods

        Args:
            content: Content to process
            extract_summary: Whether to extract summary
            extract_key_points: Whether to extract key points
            extract_facts: Whether to extract facts
            summary_length: Summary length
            summary_style: Summary style
            key_points_count: Number of key points
            facts_count: Number of facts

        Returns:
            Dict[str, Any]: Combined results
        """
        result = {
            "success": True,
            "content_length": len(content),
        }

        if extract_summary:
            summary_result = self.summarize(content, summary_length, summary_style)
            result["summary"] = summary_result.to_dict()

        if extract_key_points:
            key_points_result = self.extract_key_points(content, key_points_count)
            result["key_points"] = key_points_result.to_dict()

        if extract_facts:
            facts_result = self.extract_facts(content, facts_count)
            result["facts"] = facts_result.to_dict()

        # Overall success
        result["success"] = all([
            result.get("summary", {}).get("success", True),
            result.get("key_points", {}).get("success", True),
            result.get("facts", {}).get("success", True),
        ])

        return result

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics

        Returns:
            Dict[str, Any]: Performance stats
        """
        return {
            **self.performance.get_stats(),
            "meets_latency_target": self.performance.average_latency_ms < self.config.target_latency_ms,
            "target_latency_ms": self.config.target_latency_ms,
        }


__all__ = [
    "SummarizationEngine",
    "EngineConfig",
    "FallbackStrategy",
    "PerformanceTracker",
]
