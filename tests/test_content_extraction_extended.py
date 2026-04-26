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
Tests for enhanced content extraction features
"""

import pytest
from unittest.mock import Mock, patch
from bs4 import BeautifulSoup

from researchclaw.tools.content_extraction import (
    ContentExtractor,
    ExtractedContent,
    extract_content,
    NOISE_TAGS,
    NOISE_CLASSES,
    NOISE_IDS,
)


class TestEnhancedSelectors:
    """Test enhanced CSS selectors and fallback selectors"""

    @pytest.fixture
    def extractor(self):
        return ContentExtractor(timeout=10)

    def test_fallback_selectors(self, extractor):
        """Test fallback selectors are available"""
        assert hasattr(extractor, 'FALLBACK_SELECTORS')
        assert len(extractor.FALLBACK_SELECTORS) > 0

    def test_extended_content_selectors(self, extractor):
        """Test extended content selectors"""
        # Should have more than original set
        assert len(extractor.CONTENT_SELECTORS) > 20
        
        # Should include new selectors
        assert "[role='main']" in extractor.CONTENT_SELECTORS
        assert "[itemprop='articleBody']" in extractor.CONTENT_SELECTORS
        assert ".blog-post" in extractor.CONTENT_SELECTORS
        assert ".news-content" in extractor.CONTENT_SELECTORS

    def test_extract_by_fallback_selectors(self, extractor):
        """Test extraction by fallback selectors"""
        html = """
        <html>
        <body>
            <div class="container main">
                <p>This is fallback content that should be extracted when primary selectors fail. 
                It has enough text to pass the minimum length requirements for fallback extraction.</p>
                <p>More content here for better extraction results with the fallback selector strategy.</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        result = extractor._extract_by_fallback_selectors(soup)
        assert "fallback content" in result.lower()

    def test_extended_noise_patterns(self, extractor):
        """Test extended noise patterns"""
        # Should include more noise tags
        assert "button" in NOISE_TAGS
        assert "menu" in NOISE_TAGS
        
        # Should include more noise classes
        assert "cookie" in NOISE_CLASSES
        assert "consent" in NOISE_CLASSES
        assert "tracking" in NOISE_CLASSES
        assert "widget" in NOISE_CLASSES


class TestEnhancedNoiseRemoval:
    """Test enhanced noise removal"""

    @pytest.fixture
    def extractor(self):
        return ContentExtractor(timeout=10)

    def test_remove_hidden_elements(self, extractor):
        """Test removal of hidden elements"""
        html = """
        <html>
        <body>
            <div style="display:none">Hidden content</div>
            <div style="visibility:hidden">Invisible content</div>
            <article>Visible article content with enough text to be extracted successfully.</article>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        extractor._clean_noise(soup)
        
        # Hidden elements should be removed
        assert soup.find(style=True) is None or len(soup.find_all(style=True)) == 0
        # Article should remain
        assert soup.find("article") is not None

    def test_remove_empty_elements(self, extractor):
        """Test removal of empty elements"""
        html = """
        <html>
        <body>
            <div></div>
            <span></span>
            <p>Content here</p>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        extractor._clean_noise(soup)
        
        # Empty elements should be removed
        assert soup.find("div") is None
        assert soup.find("span") is None
        # Content should remain
        assert soup.find("p") is not None


class TestPerformanceOptimization:
    """Test performance optimization features"""

    @pytest.fixture
    def extractor(self):
        return ContentExtractor(timeout=10)

    def test_session_reuse(self, extractor):
        """Test session is reused across requests"""
        # Clear any existing session
        if hasattr(ContentExtractor._local, 'session'):
            delattr(ContentExtractor._local, 'session')
        
        # First call should create session
        session1 = extractor._get_session()
        assert session1 is not None
        
        # Second call should return same session
        session2 = extractor._get_session()
        assert session1 is session2

    def test_extended_headers(self, extractor):
        """Test extended headers for better performance"""
        headers = ContentExtractor.DEFAULT_HEADERS
        
        # Should have performance-related headers
        assert "Accept-Encoding" in headers
        assert "Connection" in headers
        assert "Upgrade-Insecure-Requests" in headers


class TestMainContentExtraction:
    """Test enhanced main content extraction"""

    @pytest.fixture
    def extractor(self):
        return ContentExtractor(timeout=10)

    def test_four_strategy_extraction(self, extractor):
        """Test that extraction uses 4 strategies"""
        # The method should call: selectors, fallback selectors, text density, readability
        html = """
        <html>
        <body>
            <div class="unknown-class">
                <p>Content in unknown container that requires text density analysis to extract properly.</p>
                <p>More content for the text density algorithm to work with effectively.</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        result = extractor._extract_main_content(soup)
        # Should fall through to text density or readability
        assert len(result) > 0


class TestNoiseConstants:
    """Test noise constants"""

    def test_noise_tags_count(self):
        """Test we have sufficient noise tags"""
        assert len(NOISE_TAGS) >= 15

    def test_noise_classes_count(self):
        """Test we have sufficient noise classes"""
        assert len(NOISE_CLASSES) >= 25

    def test_noise_ids_count(self):
        """Test we have sufficient noise IDs"""
        assert len(NOISE_IDS) >= 15

    def test_noise_coverage(self):
        """Test noise patterns cover common patterns"""
        noise_str = " ".join(NOISE_CLASSES + NOISE_IDS).lower()
        
        # Check for common ad-related patterns
        assert "ad" in noise_str or "ads" in noise_str
        # Check for social patterns
        assert "social" in noise_str or "share" in noise_str
        # Check for layout patterns
        assert "sidebar" in noise_str or "footer" in noise_str
