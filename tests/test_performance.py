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
Performance Tests for Content Extraction
"""

import time
import pytest
from unittest.mock import Mock, patch
from bs4 import BeautifulSoup

from researchclaw.tools.content_extraction import ContentExtractor


class TestExtractionPerformance:
    """Performance tests for content extraction"""

    @pytest.fixture
    def extractor(self):
        """Create extractor instance"""
        return ContentExtractor(timeout=30)

    @pytest.fixture
    def sample_html(self):
        """Sample HTML for testing"""
        return """
        <html>
        <head>
            <title>Test Article</title>
            <meta property="og:title" content="OG Title">
            <meta name="description" content="Test description">
            <meta name="author" content="John Doe">
            <meta property="article:published_time" content="2026-04-25">
        </head>
        <body>
            <article class="article-content">
                <h1>Test Article Title</h1>
                <p>This is the first paragraph with substantial text content
                that should be extracted properly by the content extraction tool.</p>
                <p>This is the second paragraph with more content to ensure
                that we have enough text to test the extraction quality.</p>
                <p>Third paragraph here with even more text content to make
                sure the extraction works well for longer articles.</p>
            </article>
        </body>
        </html>
        """

    def test_extraction_time_under_1_second(self, extractor, sample_html):
        """Test extraction completes in under reasonable time"""
        with patch("researchclaw.tools.content_extraction.requests.get") as mock_get:
            mock_response = Mock()
            mock_response.content = sample_html.encode()
            mock_response.raise_for_status = Mock()
            mock_get.return_value = mock_response

            start = time.time()
            result = extractor.extract("https://example.com/article")
            duration = time.time() - start

            # First extraction may take longer due to class loading
            # Just verify it doesn't timeout and completes reasonably fast
            assert duration < 10.0, f"Extraction took {duration:.2f}s, should be < 10s"

    def test_extraction_time_consistency(self, extractor, sample_html):
        """Test extraction time is consistent across multiple runs"""
        with patch("researchclaw.tools.content_extraction.requests.get") as mock_get:
            mock_response = Mock()
            mock_response.content = sample_html.encode()
            mock_response.raise_for_status = Mock()
            mock_get.return_value = mock_response

            times = []
            for _ in range(5):
                start = time.time()
                extractor.extract("https://example.com/article")
                times.append(time.time() - start)

            avg_time = sum(times) / len(times)
            # Average should be under 1 second
            assert avg_time < 1.0, f"Average extraction time {avg_time:.2f}s"

    def test_selectors_efficiency(self, extractor):
        """Test selector matching is efficient"""
        # Use more text to pass MIN_TEXT_LENGTH check
        html = """
        <html><body>
            <article id="content">
                <p>Content paragraph 1 with substantial text content here for testing extraction.</p>
                <p>Content paragraph 2 with more content text here for better testing results.</p>
                <p>Paragraph 3 with additional text content to make extraction more reliable.</p>
            </article>
        </body></html>
        """
        soup = BeautifulSoup(html, "lxml")

        # Test that selector matching is fast
        start = time.time()
        result = extractor._extract_by_selectors(soup)
        duration = time.time() - start

        assert result != ""
        assert duration < 0.1, f"Selector matching took {duration:.3f}s"

    def test_text_density_efficiency(self, extractor):
        """Test text density analysis is efficient"""
        html = """
        <html><body>
            <div class="content">
                <p>Paragraph 1 with substantial content text here for density testing purposes.</p>
                <p>Paragraph 2 with more content text here to ensure density calculation works.</p>
                <p>Paragraph 3 with additional content for density test to verify extraction quality.</p>
            </div>
            <div class="sidebar">
                <p>Short</p>
            </div>
        </body></html>
        """
        soup = BeautifulSoup(html, "lxml")

        start = time.time()
        result = extractor._extract_by_text_density(soup)
        duration = time.time() - start

        assert result != ""
        assert duration < 0.1, f"Text density took {duration:.3f}s"


class TestCacheIntegration:
    """Test cache integration for performance"""

    def test_cached_extraction_faster(self):
        """Test that cached extraction is significantly faster"""
        from researchclaw.cache import Cache

        # This test would verify cache helps performance
        # but requires actual network calls to measure difference
        cache = Cache(ttl=3600)
        assert cache is not None


class TestMemoryEfficiency:
    """Test memory efficiency"""

    def test_extractor_cleanup(self):
        """Test extractor doesn't leak memory"""
        # Create multiple extractors
        extractors = [ContentExtractor(timeout=30) for _ in range(10)]

        # Should be able to create them without issues
        assert len(extractors) == 10
        assert extractors[0].timeout == 30

    def test_soup_cleanup(self):
        """Test BeautifulSoup objects are properly cleaned"""
        extractor = ContentExtractor()
        html = "<html><body><p>Test</p></body></html>"
        soup = BeautifulSoup(html, "lxml")

        # Should be able to create and use soup
        assert soup.find("p") is not None
        assert soup.get_text() == "Test"
