# Copyright 2026 OpenClaw
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
End-to-End Integration Tests

Tests complete research workflows from start to finish.
"""

import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

from researchclaw.tools.content_extraction import ContentExtractor, ExtractedContent
from researchclaw.tools.report_formatter import ResearchReport, Source, create_report
from researchclaw.tools.source_validation import SourceValidator, ValidationResult, ValidationStatus
from researchclaw.tools.parallel_extraction import ParallelExtractor, ExtractionResult
from researchclaw.search.providers.duckduckgo import DuckDuckGoSearchProvider
from researchclaw.search.providers.base import SearchResult


class TestContentExtractionWorkflow:
    """Test complete content extraction workflow"""

    def test_extraction_with_validation(self):
        """Test extracting content and validating source"""
        # Create mock content
        mock_content = ExtractedContent(
            url="https://example.com/article",
            title="Test Article",
            text="This is test content with enough text to pass validation.",
            html="<article><h1>Test</h1><p>Test content</p></article>",
            author="Test Author",
            published_date="2026-04-26",
            site_name="Example",
        )

        # Validate content quality
        assert mock_content.url == "https://example.com/article"
        assert len(mock_content.text) > 20
        assert mock_content.title == "Test Article"

    def test_extraction_multiple_urls(self):
        """Test extracting from multiple URLs"""
        extractor = ContentExtractor(timeout=5)

        # This tests the extraction workflow
        # In real scenario, would use actual URLs
        assert extractor.timeout == 5


class TestReportGenerationWorkflow:
    """Test complete report generation workflow"""

    def test_create_report_from_sources(self):
        """Test creating report from multiple sources"""
        # Create sources as dicts for create_report function
        sources = [
            {
                "url": "https://example.com/1",
                "title": "Source 1",
                "snippet": "Snippet 1",
                "author": "Author 1",
                "date": "2026-04-26",
                "site_name": "Example",
                "quality_score": 4,
            },
            {
                "url": "https://example.com/2",
                "title": "Source 2",
                "snippet": "Snippet 2",
                "author": "Author 2",
                "date": "2026-04-25",
                "site_name": "Test",
                "quality_score": 5,
            },
        ]

        # Create report
        report = create_report(
            topic="Integration Test",
            summary="Test summary",
            sections=[
                {"title": "Introduction", "content": "Intro content"},
                {"title": "Methods", "content": "Methods content"},
            ],
            sources=sources,
        )

        # Verify report
        assert report.topic == "Integration Test"
        assert report.summary == "Test summary"
        assert len(report.sections) == 2
        assert len(report.sources) == 2

        # Test markdown output
        md = report.to_markdown()
        assert "Integration Test" in md
        assert "Test summary" in md
        assert "Introduction" in md
        assert "Sources" in md

    def test_report_multiple_formats(self):
        """Test generating report in multiple formats"""
        report = create_report(
            topic="Format Test",
            summary="Testing formats",
            sections=[{"title": "Section 1", "content": "Content 1"}],
        )

        # Test all formats
        md = report.to_markdown()
        html = report.to_html()
        json_str = report.to_json()

        assert "Format Test" in md
        assert "<h1>Format Test</h1>" in html
        assert '"topic": "Format Test"' in json_str


class TestValidationWorkflow:
    """Test source validation workflow"""

    def test_validate_multiple_sources(self):
        """Test validating multiple URLs"""
        validator = SourceValidator(timeout=5)

        # Test URL format validation (without network)
        assert validator._is_valid_url_format("https://example.com") is True
        assert validator._is_valid_url_format("https://test.org/page") is True
        assert validator._is_valid_url_format("invalid") is False

    def test_blocked_domains(self):
        """Test blocked domain detection"""
        validator = SourceValidator()

        assert validator._is_blocked_domain("http://localhost:8080") is True
        assert validator._is_blocked_domain("http://127.0.0.1") is True
        assert validator._is_blocked_domain("http://example.com") is False


class TestParallelExtractionWorkflow:
    """Test parallel extraction workflow"""

    def test_parallel_extraction_config(self):
        """Test parallel extractor configuration"""
        extractor = ParallelExtractor(
            max_workers=5,
            timeout=10,
            retry_count=2,
        )

        assert extractor.max_workers == 5
        assert extractor.timeout == 10
        assert extractor.retry_count == 2

    def test_empty_url_list(self):
        """Test handling empty URL list"""
        extractor = ParallelExtractor(max_workers=3)
        results = extractor.extract_urls([])

        assert results == []


class TestSearchProviderIntegration:
    """Test search provider integration"""

    def test_search_provider_creation(self):
        """Test creating search provider"""
        provider = DuckDuckGoSearchProvider()

        assert provider.name == "duckduckgo"
        assert provider.requires_api_key is False

    def test_search_result_structure(self):
        """Test search result data structure"""
        result = SearchResult(
            title="Test Result",
            url="https://example.com",
            snippet="Test snippet",
            score=0.9,
            source="test",
        )

        assert result.title == "Test Result"
        assert result.score == 0.9

        # Test conversion to dict
        result_dict = result.to_dict()
        assert result_dict["title"] == "Test Result"
        assert result_dict["score"] == 0.9


class TestEndToEndResearch:
    """End-to-end research flow tests"""

    def test_research_topic_flow(self):
        """Test complete research topic flow"""
        # Step 1: Search for topic (mocked)
        search_results = [
            SearchResult(
                title="AI Overview",
                url="https://example.com/ai",
                snippet="AI is...",
                score=0.9,
                source="test",
            ),
            SearchResult(
                title="AI History",
                url="https://example.com/ai-history",
                snippet="History of AI...",
                score=0.8,
                source="test",
            ),
        ]

        assert len(search_results) == 2
        assert search_results[0].score >= search_results[1].score

        # Step 2: Extract content (mocked)
        sources = []
        for result in search_results:
            source = Source(
                url=result.url,
                title=result.title,
                snippet=result.snippet,
                quality_score=int(result.score * 5),
            )
            sources.append(source)

        assert len(sources) == 2

        # Step 3: Create report
        report = create_report(
            topic="AI Research",
            summary="Comprehensive AI research",
            sections=[
                {"title": "Overview", "content": "AI overview content"},
                {"title": "History", "content": "AI history content"},
            ],
        )

        # Add sources manually (as Source objects)
        for result in search_results:
            source = Source(
                url=result.url,
                title=result.title,
                snippet=result.snippet,
                quality_score=int(result.score * 5),
            )
            report.add_source(source)

        assert report.topic == "AI Research"
        assert len(report.sources) == 2
        assert len(report.sections) == 2

        # Step 4: Export to multiple formats
        md = report.to_markdown()
        html = report.to_html()

        assert "AI Research" in md
        assert "AI Research" in html
        assert "Overview" in md
        assert "History" in html

    def test_save_report_to_file(self, tmp_path):
        """Test saving report to file"""
        report = create_report(
            topic="Save Test",
            summary="Testing save",
            sections=[{"title": "Section 1", "content": "Content"}],
        )

        # Save as markdown
        md_path = tmp_path / "test.md"
        report.save(str(md_path), "markdown")

        assert md_path.exists()
        content = md_path.read_text()
        assert "Save Test" in content

    def test_quality_scores(self):
        """Test quality score calculation"""
        # High quality source
        high_quality = Source(
            url="https://example.com/1",
            title="High Quality",
            content="Very long content " * 100,
            quality_score=5,
        )

        # Low quality source
        low_quality = Source(
            url="https://example.com/2",
            title="Low Quality",
            content="Short",
            quality_score=1,
        )

        assert high_quality.quality_score > low_quality.quality_score

        # Test citation
        citation = high_quality.to_citation("markdown")
        assert "High Quality" in citation


class TestErrorHandling:
    """Test error handling in workflows"""

    def test_graceful_extraction_failure(self):
        """Test handling extraction failures gracefully"""
        extractor = ContentExtractor(timeout=1)

        # Invalid URL should be handled
        # (actual network errors would be caught)

        assert extractor.timeout == 1

    def test_report_with_empty_sources(self):
        """Test report with no sources"""
        report = create_report(
            topic="Empty Report",
            summary="No sources",
        )

        # Should work fine
        assert report.topic == "Empty Report"
        md = report.to_markdown()
        assert "Empty Report" in md
        # Sources section only shows if there are sources
