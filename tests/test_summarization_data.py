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
Tests for summarization module - Data classes and enums
"""

import pytest
from researchclaw.summarization.data import (
    SummarizationLength,
    SummarizationStyle,
    SummaryResult,
    KeyPoint,
    KeyPointsResult,
    ExtractedFact,
    FactsResult,
)


class TestSummarizationEnums:
    """Test summarization enums"""

    def test_summarization_length_values(self):
        """Test SummarizationLength enum values"""
        assert SummarizationLength.SHORT.value == "short"
        assert SummarizationLength.MEDIUM.value == "medium"
        assert SummarizationLength.LONG.value == "long"

    def test_summarization_style_values(self):
        """Test SummarizationStyle enum values"""
        assert SummarizationStyle.CONCISE.value == "concise"
        assert SummarizationStyle.DETAILED.value == "detailed"
        assert SummarizationStyle.TECHNICAL.value == "technical"
        assert SummarizationStyle.CASUAL.value == "casual"


class TestSummaryResult:
    """Test SummaryResult dataclass"""

    def test_create_summary_result(self):
        """Test creating a SummaryResult"""
        result = SummaryResult(
            summary="This is a test summary",
            original_length=100,
            summary_length=20,
            length_type=SummarizationLength.SHORT,
            style=SummarizationStyle.CONCISE,
            model="deepseek",
            duration_ms=1500.0,
            success=True,
        )

        assert result.summary == "This is a test summary"
        assert result.original_length == 100
        assert result.summary_length == 20
        assert result.success is True

    def test_compression_ratio(self):
        """Test compression ratio calculation"""
        result = SummaryResult(
            summary="Short",
            original_length=100,
            summary_length=20,
            length_type=SummarizationLength.MEDIUM,
            style=SummarizationStyle.CONCISE,
            model="deepseek",
            duration_ms=1000.0,
            success=True,
        )

        assert result.compression_ratio == 0.8  # 1 - (20/100)

    def test_compression_ratio_zero(self):
        """Test compression ratio with zero original length"""
        result = SummaryResult(
            summary="",
            original_length=0,
            summary_length=0,
            length_type=SummarizationLength.SHORT,
            style=SummarizationStyle.CONCISE,
            model="deepseek",
            duration_ms=0,
            success=False,
        )

        assert result.compression_ratio == 0.0

    def test_to_dict(self):
        """Test to_dict method"""
        result = SummaryResult(
            summary="Test",
            original_length=100,
            summary_length=20,
            length_type=SummarizationLength.MEDIUM,
            style=SummarizationStyle.DETAILED,
            model="deepseek",
            duration_ms=1500.0,
            success=True,
        )

        d = result.to_dict()
        assert d["summary"] == "Test"
        assert d["original_length"] == 100
        assert d["success"] is True
        assert "compression_ratio" in d


class TestKeyPoint:
    """Test KeyPoint dataclass"""

    def test_create_key_point(self):
        """Test creating a KeyPoint"""
        kp = KeyPoint(
            text="This is a key point",
            importance=0.9,
            category="main",
            supporting_evidence=["evidence1", "evidence2"],
            source_section="intro",
        )

        assert kp.text == "This is a key point"
        assert kp.importance == 0.9
        assert kp.category == "main"
        assert len(kp.supporting_evidence) == 2

    def test_key_point_to_dict(self):
        """Test KeyPoint to_dict"""
        kp = KeyPoint(
            text="Test point",
            importance=0.8,
        )

        d = kp.to_dict()
        assert d["text"] == "Test point"
        assert d["importance"] == 0.8


class TestKeyPointsResult:
    """Test KeyPointsResult dataclass"""

    def test_create_key_points_result(self):
        """Test creating a KeyPointsResult"""
        points = [
            KeyPoint(text="Point 1", importance=0.9),
            KeyPoint(text="Point 2", importance=0.8),
        ]

        result = KeyPointsResult(
            key_points=points,
            count=2,
            model="deepseek",
            duration_ms=2000.0,
            success=True,
        )

        assert result.count == 2
        assert len(result.key_points) == 2

    def test_key_points_to_dict(self):
        """Test KeyPointsResult to_dict"""
        result = KeyPointsResult(
            key_points=[KeyPoint(text="Test", importance=0.9)],
            count=1,
            model="deepseek",
            duration_ms=1500.0,
            success=True,
        )

        d = result.to_dict()
        assert d["count"] == 1
        assert len(d["key_points"]) == 1


class TestExtractedFact:
    """Test ExtractedFact dataclass"""

    def test_create_extracted_fact(self):
        """Test creating an ExtractedFact"""
        fact = ExtractedFact(
            statement="The company grew by 50%",
            subject="company",
            predicate="grew by",
            value="50%",
            confidence=0.95,
            source="financials",
            context="Q4 report",
        )

        assert fact.subject == "company"
        assert fact.value == "50%"
        assert fact.confidence == 0.95

    def test_extracted_fact_to_dict(self):
        """Test ExtractedFact to_dict"""
        fact = ExtractedFact(
            statement="Test fact",
            subject="test",
            predicate="is",
            value="true",
            confidence=0.8,
        )

        d = fact.to_dict()
        assert d["subject"] == "test"
        assert d["value"] == "true"


class TestFactsResult:
    """Test FactsResult dataclass"""

    def test_create_facts_result(self):
        """Test creating a FactsResult"""
        facts = [
            ExtractedFact(
                statement="Fact 1",
                subject="A",
                predicate="B",
                value="C",
                confidence=0.9,
            ),
        ]

        result = FactsResult(
            facts=facts,
            count=1,
            model="deepseek",
            duration_ms=1800.0,
            success=True,
        )

        assert result.count == 1
        assert len(result.facts) == 1

    def test_facts_to_dict(self):
        """Test FactsResult to_dict"""
        result = FactsResult(
            facts=[ExtractedFact(
                statement="Test",
                subject="A",
                predicate="B",
                value="C",
                confidence=0.8,
            )],
            count=1,
            model="deepseek",
            duration_ms=1000.0,
            success=True,
        )

        d = result.to_dict()
        assert d["count"] == 1
        assert len(d["facts"]) == 1
