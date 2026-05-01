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
Tests for summarization module - Engine and Performance
"""

import pytest
from unittest.mock import Mock, patch
from deepclaw.summarization.engine import (
    SummarizationEngine,
    EngineConfig,
    FallbackStrategy,
    PerformanceTracker,
)
from deepclaw.summarization.data import (
    SummarizationLength,
    SummarizationStyle,
    SummaryResult,
    KeyPointsResult,
    FactsResult,
)


class TestEngineConfig:
    """Test EngineConfig"""

    def test_default_config(self):
        """Test default engine configuration"""
        config = EngineConfig()
        assert config.default_provider == "deepseek"
        assert config.max_retries == 3
        assert config.target_latency_ms == 3000.0
        assert FallbackStrategy.RETRY in config.fallback_strategies

    def test_custom_config(self):
        """Test custom engine configuration"""
        config = EngineConfig(
            default_provider="glm",
            max_retries=5,
            target_latency_ms=2000.0,
        )
        assert config.default_provider == "glm"
        assert config.max_retries == 5


class TestPerformanceTracker:
    """Test PerformanceTracker"""

    def test_empty_tracker(self):
        """Test empty tracker statistics"""
        tracker = PerformanceTracker()
        assert tracker.total_requests == 0
        assert tracker.success_rate == 0.0
        assert tracker.average_latency_ms == 0.0

    def test_record_success(self):
        """Test recording successful request"""
        tracker = PerformanceTracker()
        tracker.record(success=True, duration_ms=1000.0)
        
        assert tracker.total_requests == 1
        assert tracker.successful_requests == 1
        assert tracker.failed_requests == 0

    def test_record_failure(self):
        """Test recording failed request"""
        tracker = PerformanceTracker()
        tracker.record(success=False, duration_ms=500.0)
        
        assert tracker.total_requests == 1
        assert tracker.successful_requests == 0
        assert tracker.failed_requests == 1

    def test_success_rate(self):
        """Test success rate calculation"""
        tracker = PerformanceTracker()
        tracker.record(success=True, duration_ms=1000.0)
        tracker.record(success=True, duration_ms=1500.0)
        tracker.record(success=False, duration_ms=800.0)
        
        assert tracker.success_rate == 2/3

    def test_average_latency(self):
        """Test average latency calculation"""
        tracker = PerformanceTracker()
        tracker.record(success=True, duration_ms=1000.0)
        tracker.record(success=True, duration_ms=2000.0)
        tracker.record(success=True, duration_ms=3000.0)
        
        assert tracker.average_latency_ms == 2000.0

    def test_p95_latency(self):
        """Test P95 latency calculation"""
        tracker = PerformanceTracker()
        # Add 100 requests with latency 1-100ms
        for i in range(1, 101):
            tracker.record(success=True, duration_ms=float(i))
        
        # P95 should be around 95
        assert 90 <= tracker.p95_latency_ms <= 100

    def test_get_stats(self):
        """Test get_stats method"""
        tracker = PerformanceTracker()
        tracker.record(success=True, duration_ms=1000.0)
        
        stats = tracker.get_stats()
        assert "total_requests" in stats
        assert "success_rate" in stats
        assert "average_latency_ms" in stats
        assert "p95_latency_ms" in stats


class TestSummarizationEngine:
    """Test SummarizationEngine"""

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_init(self, mock_llm_engine):
        """Test engine initialization"""
        engine = SummarizationEngine()
        assert engine.llm_engine is not None
        assert engine.summarizer is not None
        assert engine.key_point_extractor is not None
        assert engine.fact_extractor is not None

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_summarize_success(self, mock_llm_engine):
        """Test successful summarization"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        engine = SummarizationEngine()
        engine.summarizer.llm_engine = mock_engine
        
        # Mock summarizer to return success
        engine.summarizer.summarize = Mock(return_value=SummaryResult(
            summary="Test summary",
            original_length=100,
            summary_length=20,
            length_type=SummarizationLength.MEDIUM,
            style=SummarizationStyle.CONCISE,
            model="deepseek",
            duration_ms=1500.0,
            success=True,
        ))

        result = engine.summarize("Test content")
        
        assert result.success is True
        assert result.summary == "Test summary"

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_summarize_with_fallback(self, mock_llm_engine):
        """Test summarization with fallback"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        engine = SummarizationEngine()
        engine.summarizer.llm_engine = mock_engine
        
        # First call fails, fallback returns success
        engine.summarizer.summarize = Mock(side_effect=[
            Exception("API Error"),
            SummaryResult(
                summary="Fallback summary",
                original_length=100,
                summary_length=20,
                length_type=SummarizationLength.MEDIUM,
                style=SummarizationStyle.CONCISE,
                model="deepseek",
                duration_ms=1500.0,
                success=True,
            ),
        ])

        result = engine.summarize("Test content")
        # Should succeed with fallback
        assert result.success is True

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_extract_key_points(self, mock_llm_engine):
        """Test key point extraction"""
        mock_engine = Mock()
        
        engine = SummarizationEngine()
        engine.key_point_extractor.llm_engine = mock_engine
        
        from deepclaw.summarization.data import KeyPoint
        engine.key_point_extractor.extract_key_points = Mock(return_value=KeyPointsResult(
            key_points=[KeyPoint(text="Point 1", importance=0.9)],
            count=1,
            model="deepseek",
            duration_ms=1500.0,
            success=True,
        ))

        result = engine.extract_key_points("Test content")
        
        assert result.success is True
        assert result.count == 1

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_extract_facts(self, mock_llm_engine):
        """Test fact extraction"""
        mock_engine = Mock()
        
        engine = SummarizationEngine()
        engine.fact_extractor.llm_engine = mock_engine
        
        from deepclaw.summarization.data import ExtractedFact
        engine.fact_extractor.extract_facts = Mock(return_value=FactsResult(
            facts=[ExtractedFact(
                statement="Fact 1",
                subject="A",
                predicate="B",
                value="C",
                confidence=0.9,
            )],
            count=1,
            model="deepseek",
            duration_ms=1500.0,
            success=True,
        ))

        result = engine.extract_facts("Test content")
        
        assert result.success is True
        assert result.count == 1

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_process_combined(self, mock_llm_engine):
        """Test combined processing"""
        mock_engine = Mock()
        
        engine = SummarizationEngine()
        engine.summarizer.llm_engine = mock_engine
        engine.key_point_extractor.llm_engine = mock_engine
        engine.fact_extractor.llm_engine = mock_engine
        
        # Mock all methods
        from deepclaw.summarization.data import KeyPoint, ExtractedFact
        
        engine.summarizer.summarize = Mock(return_value=SummaryResult(
            summary="Summary",
            original_length=100,
            summary_length=20,
            length_type=SummarizationLength.MEDIUM,
            style=SummarizationStyle.CONCISE,
            model="deepseek",
            duration_ms=1000.0,
            success=True,
        ))
        
        engine.key_point_extractor.extract_key_points = Mock(return_value=KeyPointsResult(
            key_points=[KeyPoint(text="Point", importance=0.9)],
            count=1,
            model="deepseek",
            duration_ms=1000.0,
            success=True,
        ))
        
        engine.fact_extractor.extract_facts = Mock(return_value=FactsResult(
            facts=[ExtractedFact(
                statement="Fact",
                subject="A",
                predicate="B",
                value="C",
                confidence=0.9,
            )],
            count=1,
            model="deepseek",
            duration_ms=1000.0,
            success=True,
        ))

        result = engine.process(
            "Test content",
            extract_summary=True,
            extract_key_points=True,
            extract_facts=True,
        )
        
        assert result["success"] is True
        assert "summary" in result
        assert "key_points" in result
        assert "facts" in result

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_get_performance_stats(self, mock_llm_engine):
        """Test getting performance stats"""
        engine = SummarizationEngine()
        engine.performance.record(success=True, duration_ms=1000.0)
        
        stats = engine.get_performance_stats()
        
        assert "total_requests" in stats
        assert "meets_latency_target" in stats
        assert stats["target_latency_ms"] == 3000.0

    @patch('deepclaw.summarization.engine.LLMEngine')
    def test_fallback_extractive_summarize(self, mock_llm_engine):
        """Test extractive summarization fallback"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        engine = SummarizationEngine()
        engine.summarizer.llm_engine = mock_engine
        
        # Make all attempts fail
        engine.summarizer.summarize = Mock(side_effect=Exception("API Error"))

        # Should fall back to extractive
        result = engine._extractive_summarize(
            "This is sentence one. This is sentence two. This is sentence three.",
            SummarizationLength.SHORT
        )

        assert result.success is True
        assert result.model == "extractive"
