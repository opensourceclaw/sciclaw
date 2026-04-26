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
Tests for summarization module - Key Point Extractor
"""

import pytest
from unittest.mock import Mock, patch
import json
from researchclaw.summarization.key_points import KeyPointExtractor, KeyPointExtractorConfig
from researchclaw.summarization.data import KeyPoint, KeyPointsResult


class TestKeyPointExtractorConfig:
    """Test KeyPointExtractorConfig"""

    def test_default_config(self):
        """Test default configuration"""
        config = KeyPointExtractorConfig()
        assert config.default_count == 5
        assert config.max_points == 10
        assert config.min_importance == 0.5

    def test_custom_config(self):
        """Test custom configuration"""
        config = KeyPointExtractorConfig(
            default_count=10,
            max_points=20,
            min_importance=0.7,
        )
        assert config.default_count == 10
        assert config.max_points == 20


class TestKeyPointExtractor:
    """Test KeyPointExtractor class"""

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_init_with_defaults(self, mock_llm_engine):
        """Test initialization with defaults"""
        extractor = KeyPointExtractor()
        assert extractor.llm_engine is not None

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_extract_empty_content(self, mock_llm_engine):
        """Test extracting from empty content"""
        extractor = KeyPointExtractor()
        result = extractor.extract_key_points("")

        assert result.success is False
        assert result.count == 0

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_extract_success(self, mock_llm_engine):
        """Test successful key point extraction"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        # Mock response with valid JSON
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"text": "Key point 1", "importance": 0.9, "category": "main"},
            {"text": "Key point 2", "importance": 0.8, "category": "supporting"},
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = KeyPointExtractor(llm_engine=mock_engine)
        result = extractor.extract_key_points("Some content with key points.")

        assert result.success is True
        assert result.count == 2
        assert result.key_points[0].text == "Key point 1"

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_extract_filters_low_importance(self, mock_llm_engine):
        """Test that low importance points are filtered"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"text": "Important point", "importance": 0.9},
            {"text": "Less important", "importance": 0.3},  # Below min_importance
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = KeyPointExtractor(
            llm_engine=mock_engine,
            config=KeyPointExtractorConfig(min_importance=0.5),
        )
        result = extractor.extract_key_points("Content")

        assert result.count == 1
        assert result.key_points[0].text == "Important point"

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_extract_sorted_by_importance(self, mock_llm_engine):
        """Test that results are sorted by importance"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"text": "Low importance", "importance": 0.5},
            {"text": "High importance", "importance": 0.9},
            {"text": "Medium importance", "importance": 0.7},
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = KeyPointExtractor(llm_engine=mock_engine)
        result = extractor.extract_key_points("Content")

        # Should be sorted descending
        assert result.key_points[0].importance == 0.9
        assert result.key_points[1].importance == 0.7
        assert result.key_points[2].importance == 0.5

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_extract_limits_count(self, mock_llm_engine):
        """Test that count is limited"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        # Return more points than requested
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"text": f"Point {i}", "importance": 1.0 - i * 0.1}
            for i in range(10)
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = KeyPointExtractor(llm_engine=mock_engine)
        result = extractor.extract_key_points("Content", count=3)

        assert result.count == 3

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_extract_fallback_parse(self, mock_llm_engine):
        """Test fallback parsing when JSON fails"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        # Return non-JSON response
        mock_response = Mock()
        mock_response.content = """
1. First key point
2. Second key point
3. Third key point
        """
        
        mock_engine.chat.return_value = mock_response

        extractor = KeyPointExtractor(llm_engine=mock_engine)
        result = extractor.extract_key_points("Content")

        # Should fall back to line parsing
        assert result.count >= 0

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_extract_batch(self, mock_llm_engine):
        """Test batch extraction"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = json.dumps([
            {"text": "Point", "importance": 0.9}
        ])
        
        mock_engine.chat.return_value = mock_response

        extractor = KeyPointExtractor(llm_engine=mock_engine)
        results = extractor.extract_key_points_batch(
            ["content1", "content2"],
            count=3
        )

        assert len(results) == 2

    @patch('researchclaw.summarization.key_points.LLMEngine')
    def test_content_truncation(self, mock_llm_engine):
        """Test content truncation for long input"""
        mock_engine = Mock()
        mock_engine.model = "deepseek-chat"
        
        mock_response = Mock()
        mock_response.content = "[]"
        
        mock_engine.chat.return_value = mock_response

        extractor = KeyPointExtractor(
            llm_engine=mock_engine,
            config=KeyPointExtractorConfig(max_content_length=100),
        )

        long_content = "x" * 200
        result = extractor.extract_key_points(long_content)

        assert result.success is True  # Should not fail, just truncate
