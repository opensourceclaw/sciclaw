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
Tests for Content Extraction
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from bs4 import BeautifulSoup

from researchclaw.tools.content_extraction import (
    ContentExtractor,
    ExtractedContent,
    extract_content,
    NOISE_TAGS,
    NOISE_CLASSES,
    NOISE_IDS,
)


class TestExtractedContent:
    """Test ExtractedContent dataclass"""

    def test_creation(self):
        """Test creating ExtractedContent"""
        content = ExtractedContent(
            url="https://example.com",
            title="Test Title",
            text="Test content",
            html="<div>Test content</div>",
        )
        assert content.url == "https://example.com"
        assert content.title == "Test Title"
        assert content.text == "Test content"
        assert content.site_name is None

    def test_creation_with_optional_fields(self):
        """Test creating ExtractedContent with optional fields"""
        content = ExtractedContent(
            url="https://example.com",
            title="Test Title",
            text="Test content",
            html="<div>Test content</div>",
            author="John Doe",
            published_date="2026-01-01",
            excerpt="Test excerpt",
            site_name="Example",
        )
        assert content.author == "John Doe"
        assert content.published_date == "2026-01-01"
        assert content.excerpt == "Test excerpt"
        assert content.site_name == "Example"


class TestContentExtractor:
    """Test ContentExtractor class"""

    @pytest.fixture
    def extractor(self):
        """Create a ContentExtractor instance"""
        return ContentExtractor(timeout=10)

    def test_creation(self, extractor):
        """Test creating ContentExtractor"""
        assert extractor.timeout == 10
        assert extractor.converter is not None

    def test_clean_noise(self, extractor):
        """Test noise removal"""
        html = """
        <html>
        <head><script>var x = 1;</script></head>
        <body>
            <nav>Navigation</nav>
            <div class="sidebar">Sidebar</div>
            <div id="comments">Comments</div>
            <article class="content">
                <p>Main content paragraph here with enough text to pass the minimum length check.</p>
            </article>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        extractor._clean_noise(soup)

        # Script should be removed
        assert soup.find("script") is None

        # nav should be removed
        assert soup.find("nav") is None

        # Sidebar might be removed depending on content
        # Article should remain
        assert soup.find("article") is not None

    def test_extract_title_og(self, extractor):
        """Test extracting title from og:title"""
        html = """
        <html>
        <head>
            <meta property="og:title" content="OG Title">
            <title>Page Title - Site</title>
        </head>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        title = extractor._extract_title(soup)
        assert title == "OG Title"

    def test_extract_title_fallback(self, extractor):
        """Test extracting title fallback to title tag"""
        html = """
        <html>
        <head>
            <title>Page Title - My Site</title>
        </head>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        title = extractor._extract_title(soup)
        assert "Page Title" in title

    def test_extract_title_h1(self, extractor):
        """Test extracting title from h1 when no title tag"""
        html = """
        <html>
        <body>
            <h1>Main Heading</h1>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        title = extractor._extract_title(soup)
        assert title == "Main Heading"

    def test_extract_author_meta(self, extractor):
        """Test extracting author from meta tag"""
        html = """
        <html>
        <head>
            <meta name="author" content="John Doe">
        </head>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        author = extractor._extract_author(soup)
        assert author == "John Doe"

    def test_extract_author_schema(self, extractor):
        """Test extracting author from schema.org"""
        html = """
        <html>
        <body>
            <span itemprop="author">Jane Smith</span>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        author = extractor._extract_author(soup)
        assert author == "Jane Smith"

    def test_extract_date_og(self, extractor):
        """Test extracting date from og"""
        html = """
        <html>
        <head>
            <meta property="article:published_time" content="2026-04-25T10:00:00Z">
        </head>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        date = extractor._extract_date(soup)
        assert date == "2026-04-25T10:00:00Z"

    def test_extract_date_time_tag(self, extractor):
        """Test extracting date from time tag"""
        html = """
        <html>
        <body>
            <time datetime="2026-04-25">April 25, 2026</time>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        date = extractor._extract_date(soup)
        assert date == "2026-04-25"

    def test_extract_excerpt_og(self, extractor):
        """Test extracting excerpt from og:description"""
        html = """
        <html>
        <head>
            <meta property="og:description" content="OG Description">
            <meta name="description" content="Meta Description">
        </head>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        excerpt = extractor._extract_excerpt(soup)
        assert excerpt == "OG Description"

    def test_extract_excerpt_fallback(self, extractor):
        """Test extracting excerpt fallback to meta description"""
        html = """
        <html>
        <head>
            <meta name="description" content="Meta Description">
        </head>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        excerpt = extractor._extract_excerpt(soup)
        assert excerpt == "Meta Description"

    def test_extract_site_name_og(self, extractor):
        """Test extracting site name from og"""
        html = """
        <html>
        <head>
            <meta property="og:site_name" content="Example Site">
        </head>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        site_name = extractor._extract_site_name(soup, "https://example.com/article")
        assert site_name == "Example Site"

    def test_extract_site_name_fallback(self, extractor):
        """Test extracting site name fallback to domain"""
        html = "<html></html>"
        soup = BeautifulSoup(html, "lxml")
        site_name = extractor._extract_site_name(soup, "https://example.com/article")
        assert site_name == "Example"

    def test_extract_by_selectors(self, extractor):
        """Test extraction by CSS selectors"""
        html = """
        <html>
        <body>
            <article>
                <p>Article content with enough text to pass minimum length requirements.</p>
                <p>More article content here for better text density.</p>
            </article>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        result = extractor._extract_by_selectors(soup)
        assert "article" in result.lower()
        assert "Article content" in result

    def test_extract_by_text_density(self, extractor):
        """Test extraction by text density"""
        html = """
        <html>
        <body>
            <div class="content">
                <p>This is a substantial amount of text content that should be extracted by the text density algorithm. It has enough text to pass the minimum length check and should score well in the density analysis.</p>
                <p>More content here to increase the text density and make this div a better candidate for extraction.</p>
            </div>
            <div class="sidebar">
                <p>Short</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        result = extractor._extract_by_text_density(soup)
        assert result != ""
        assert "substantial" in result.lower()

    def test_extract_by_readability(self, extractor):
        """Test extraction by readability algorithm"""
        html = """
        <html>
        <body>
            <div>
                <p>This paragraph has enough text to be considered as content by the readability algorithm.</p>
                <p>Another paragraph with substantial text content for the readability scoring mechanism.</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        result = extractor._extract_by_readability(soup)
        assert result != ""

    @patch("researchclaw.tools.content_extraction.requests.get")
    def test_extract_success(self, mock_get, extractor):
        """Test successful content extraction"""
        mock_response = Mock()
        mock_response.content = b"""
        <html>
        <head>
            <title>Test Article - Site</title>
            <meta property="og:title" content="OG Title">
            <meta name="description" content="Test description">
        </head>
        <body>
            <article class="article-content">
                <h1>Test Article Title</h1>
                <p>This is the main content of the article. It has enough text to be extracted successfully by the content extraction tool.</p>
                <p>Another paragraph with more content for better extraction results.</p>
            </article>
        </body>
        </html>
        """
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        result = extractor.extract("https://example.com/article")

        assert result is not None
        assert result.url == "https://example.com/article"
        assert "OG Title" in result.title
        assert "Test description" in result.excerpt
        assert len(result.text) > 100

    @patch("researchclaw.tools.content_extraction.requests.get")
    def test_extract_network_error(self, mock_get, extractor):
        """Test extraction with network error"""
        import requests
        mock_get.side_effect = requests.RequestException("Connection error")

        result = extractor.extract("https://example.com/article")
        assert result is None

    @patch("researchclaw.tools.content_extraction.requests.get")
    def test_extract_http_error(self, mock_get, extractor):
        """Test extraction with HTTP error"""
        import requests
        mock_response = Mock()
        mock_response.raise_for_status = Mock(side_effect=requests.HTTPError("404"))
        mock_get.return_value = mock_response

        result = extractor.extract("https://example.com/article")
        assert result is None


class TestExtractContent:
    """Test module-level extract_content function"""

    @patch("researchclaw.tools.content_extraction.ContentExtractor")
    def test_extract_content_function(self, mock_extractor_class):
        """Test extract_content helper function"""
        mock_extractor = Mock()
        mock_content = ExtractedContent(
            url="https://test.com",
            title="Test",
            text="Test text",
            html="<div>Test</div>",
        )
        mock_extractor.extract.return_value = mock_content
        mock_extractor_class.return_value = mock_extractor

        result = extract_content("https://test.com", timeout=30)

        mock_extractor_class.assert_called_once_with(30)
        mock_extractor.extract.assert_called_once_with("https://test.com")
        assert result == mock_content
