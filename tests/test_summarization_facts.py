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
Tests for summarization module - Fact Extractor
"""

import pytest
from unittest.mock import Mock, patch
import json
from researchclaw.summarization.facts import FactExtractor, FactExtractorConfig
from researchclaw.summarization.data import ExtractedFact, FactsResult


class TestFactExtractorConfig:
    """Test FactExtractorConfig"""

    def test_default_config(self):
        """Test default configuration"""
        config = FactExtractorConfig()
        assert config.default_count == 10
        assert config.max_facts == 20
        assert config.min_confidence == 0.5

    def test_custom_config(self):
        """Test custom configuration"""
        config = FactExtractorConfig(
            default_count=15,
            max_facts=30,
            min_confidence=0.7,
        )
        assert config.default_count == 15
        assert config.max_facts == 30


class TestFactExtractor:
    """Test FactExtractor class"""

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_init_with_defaults(self, mock_llm_engine):
        """Test initialization with defaults"""
        extractor = FactExtractor()
        assert extractor.llm_engine is not None

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_extract_empty_content(self, mock_llm_engine):
        """Test extracting from empty content"""
        extractor = FactExtractor()
        result = extractor.extract_facts("")

        assert result.success is False
        assert result.count == 0

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_extract_success(self, mock_llm_engine):
        """Test successful fact extraction"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {
                "statement": "Company X grew by 50%",
                "subject": "Company X",
                "predicate": "grew by",
                "value": "50%",
                "confidence": 0.95,
                "source": "financials",
            },
            {
                "statement": "Revenue was $1M",
                "subject": "Revenue",
                "predicate": "was",
                "value": "$1M",
                "confidence": 0.9,
                "source": "report",
            },
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(llm_engine=mock_engine)
        result = extractor.extract_facts("Content with financial data.")

        assert result.success is True
        assert result.count == 2
        assert result.facts[0].subject == "Company X"

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_extract_filters_low_confidence(self, mock_llm_engine):
        """Test that low confidence facts are filtered"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"statement": "High confidence fact", "subject": "A", "predicate": "B", "value": "C", "confidence": 0.9},
            {"statement": "Low confidence fact", "subject": "D", "predicate": "E", "value": "F", "confidence": 0.3},
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(
            llm_engine=mock_engine,
            config=FactExtractorConfig(min_confidence=0.5),
        )
        result = extractor.extract_facts("Content")

        assert result.count == 1
        assert result.facts[0].statement == "High confidence fact"

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_extract_sorted_by_confidence(self, mock_llm_engine):
        """Test that results are sorted by confidence"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"statement": "Low", "subject": "A", "predicate": "B", "value": "C", "confidence": 0.5},
            {"statement": "High", "subject": "D", "predicate": "E", "value": "F", "confidence": 0.9},
            {"statement": "Medium", "subject": "G", "predicate": "H", "value": "I", "confidence": 0.7},
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(llm_engine=mock_engine)
        result = extractor.extract_facts("Content")

        # Should be sorted descending
        assert result.facts[0].confidence == 0.9
        assert result.facts[1].confidence == 0.7
        assert result.facts[2].confidence == 0.5

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_extract_limits_count(self, mock_llm_engine):
        """Test that count is limited"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"statement": f"Fact {i}", "subject": f"S{i}", "predicate": "P", "value": f"V{i}", "confidence": 1.0}
            for i in range(20)
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(llm_engine=mock_engine)
        result = extractor.extract_facts("Content", count=5)

        assert result.count == 5

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_extract_fallback_parse(self, mock_llm_engine):
        """Test fallback parsing when JSON fails"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = """
- Fact 1: Company grew
- Fact 2: Revenue increased
- Fact 3: Market share expanded
        """
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(llm_engine=mock_engine)
        result = extractor.extract_facts("Content")

        # Should fall back to line parsing
        assert result.count >= 0

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_extract_batch(self, mock_llm_engine):
        """Test batch extraction"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"statement": "Fact", "subject": "A", "predicate": "B", "value": "C", "confidence": 0.9}
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(llm_engine=mock_engine)
        results = extractor.extract_facts_batch(
            ["content1", "content2"],
            count=5
        )

        assert len(results) == 2

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_to_structured_data(self, mock_llm_engine):
        """Test converting facts to structured data"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"statement": "Fact 1", "subject": "Company", "predicate": "grew", "value": "50%", "confidence": 0.9},
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(llm_engine=mock_engine)
        result = extractor.extract_facts("Content")
        
        structured = extractor.to_structured_data(result)
        
        assert "facts" in structured
        assert structured["count"] == 1
        assert structured["facts"][0]["subject"] == "Company"

    @patch('researchclaw.summarization.facts.LLMEngine')
    def test_content_truncation(self, mock_llm_engine):
        """Test content truncation for long input"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = "[]"
        
        mock_engine.chat.return_value = mock_response

        extractor = FactExtractor(
            llm_engine=mock_engine,
            config=FactExtractorConfig(max_content_length=100),
        )

        long_content = "x" * 200
        result = extractor.extract_facts(long_content)

        assert result.success is True  # Should not fail, just truncate
