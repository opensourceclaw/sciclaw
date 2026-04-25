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
Tests for Site-Specific Parsers
"""

import pytest
from bs4 import BeautifulSoup

from researchclaw.tools.site_specific import (
    SiteParser,
    get_parser,
    can_handle,
    parse_site,
    GitHubParser,
    MediumParser,
    ZhihuParser,
    DevToParser,
    StackOverflowParser,
    WikipediaParser,
    RedditParser,
    YouTubeParser,
    TwitterParser,
    NewsSiteParser,
)


class TestSiteParser:
    """Test SiteParser base class"""

    def test_can_handle(self):
        """Test domain matching"""
        assert GitHubParser.can_handle("https://github.com/user/repo")
        assert GitHubParser.can_handle("https://gist.github.com/user/gist")
        assert not GitHubParser.can_handle("https://gitlab.com/user/repo")

    def test_can_handle_subdomains(self):
        """Test subdomain handling"""
        assert MediumParser.can_handle("https://medium.com/@user/article")
        assert MediumParser.can_handle("https://johndoe.substack.com/p/post")


class TestGitHubParser:
    """Test GitHub parser"""

    def test_can_handle(self):
        """Test GitHub domain detection"""
        assert GitHubParser.can_handle("https://github.com/user/repo")
        assert GitHubParser.can_handle("https://gist.github.com/user/gist")

    def test_parse_readme(self):
        """Test parsing README"""
        html = """
        <html>
        <head><title>test-repo - GitHub</title></head>
        <body>
            <div class="markdown-body">
                # Test Repository
                This is a test README content.
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        parser = GitHubParser()
        result = parser.parse(soup, "https://github.com/user/test-repo")

        assert "test-repo" in result["title"]
        assert "README" in result["content"] or "test" in result["content"]


class TestMediumParser:
    """Test Medium parser"""

    def test_can_handle(self):
        """Test Medium domain detection"""
        assert MediumParser.can_handle("https://medium.com/@user/article")
        assert MediumParser.can_handle("https://johndoe.substack.com/p/article")

    def test_parse_article(self):
        """Test parsing Medium article"""
        html = """
        <html>
        <head>
            <meta property="og:title" content="Test Article Title">
        </head>
        <body>
            <article>
                <h1>Test Article Title</h1>
                <p>This is the article content with substantial text.</p>
            </article>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        parser = MediumParser()
        result = parser.parse(soup, "https://medium.com/@user/article")

        assert "Test Article Title" in result["title"]
        assert "article content" in result["content"]


class TestZhihuParser:
    """Test Zhihu parser"""

    def test_can_handle(self):
        """Test Zhihu domain detection"""
        assert ZhihuParser.can_handle("https://zhihu.com/question/123")
        assert ZhihuParser.can_handle("https://www.zhihu.com/answer/456")

    def test_parse_question(self):
        """Test parsing Zhihu question"""
        html = """
        <html>
        <head><title>问题标题 - 知乎</title></head>
        <body>
            <div class="zm-item">
                <p>这是问题的详细内容。</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        parser = ZhihuParser()
        result = parser.parse(soup, "https://zhihu.com/question/123")

        assert "问题标题" in result["title"]


class TestDevToParser:
    """Test DEV.to parser"""

    def test_can_handle(self):
        """Test DEV.to domain detection"""
        assert DevToParser.can_handle("https://dev.to/user/article")
        assert DevToParser.can_handle("https://dev.to.it/user/article")

    def test_parse_article(self):
        """Test parsing DEV.to article"""
        html = """
        <html>
        <head>
            <meta property="og:title" content="DEV Article">
        </head>
        <body>
            <article>
                <h1>DEV Article</h1>
                <p>Article content here.</p>
            </article>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        parser = DevToParser()
        result = parser.parse(soup, "https://dev.to/user/article")

        assert "DEV Article" in result["title"]


class TestStackOverflowParser:
    """Test Stack Overflow parser"""

    def test_can_handle(self):
        """Test Stack Overflow domain detection"""
        assert StackOverflowParser.can_handle("https://stackoverflow.com/q/123")
        assert StackOverflowParser.can_handle("https://serverfault.com/q/456")


class TestWikipediaParser:
    """Test Wikipedia parser"""

    def test_can_handle(self):
        """Test Wikipedia domain detection"""
        assert WikipediaParser.can_handle("https://en.wikipedia.org/wiki/Topic")
        assert WikipediaParser.can_handle("https://zh.wikipedia.org/wiki/主题")

    def test_parse_article(self):
        """Test parsing Wikipedia article"""
        html = """
        <html>
        <head><title>Python (programming language) - Wikipedia</title></head>
        <body>
            <h1 id="firstHeading">Python (programming language)</h1>
            <div id="mw-content-text">
                <p>Python is a high-level programming language.</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        parser = WikipediaParser()
        result = parser.parse(soup, "https://en.wikipedia.org/wiki/Python")

        assert "Python" in result["title"]
        assert "programming" in result["content"]


class TestRedditParser:
    """Test Reddit parser"""

    def test_can_handle(self):
        """Test Reddit domain detection"""
        assert RedditParser.can_handle("https://reddit.com/r/python/comments/abc")
        assert RedditParser.can_handle("https://old.reddit.com/r/python/comments/abc")


class TestYouTubeParser:
    """Test YouTube parser"""

    def test_can_handle(self):
        """Test YouTube domain detection"""
        assert YouTubeParser.can_handle("https://youtube.com/watch?v=abc")
        assert YouTubeParser.can_handle("https://youtu.be/abc")
        assert not YouTubeParser.can_handle("https://news.google.com/articles/abc")


class TestTwitterParser:
    """Test Twitter/X parser"""

    def test_can_handle(self):
        """Test Twitter domain detection"""
        assert TwitterParser.can_handle("https://twitter.com/user/status/123")
        assert TwitterParser.can_handle("https://x.com/user/status/123")


class TestNewsSiteParser:
    """Test news site parser"""

    def test_can_handle(self):
        """Test news site detection"""
        assert NewsSiteParser.can_handle("https://bbc.com/news/story")
        assert NewsSiteParser.can_handle("https://cnn.com/article")
        assert NewsSiteParser.can_handle("https://news.google.com/articles/abc")


class TestParserRegistry:
    """Test parser registry functions"""

    def test_get_parser_github(self):
        """Test getting GitHub parser"""
        parser = get_parser("https://github.com/user/repo")
        assert parser is not None
        assert isinstance(parser, GitHubParser)

    def test_get_parser_medium(self):
        """Test getting Medium parser"""
        parser = get_parser("https://medium.com/@user/article")
        assert parser is not None
        assert isinstance(parser, MediumParser)

    def test_get_parser_unknown(self):
        """Test getting parser for unknown site"""
        parser = get_parser("https://example.com/article")
        assert parser is None

    def test_can_handle_known(self):
        """Test can_handle for known sites"""
        assert can_handle("https://github.com/user/repo")
        assert can_handle("https://medium.com/@user/article")

    def test_can_handle_unknown(self):
        """Test can_handle for unknown sites"""
        assert not can_handle("https://example.com/article")
        assert not can_handle("https://random-site.org/page")

    def test_parse_site_with_parser(self):
        """Test parse_site with specific parser"""
        html = """
        <html>
        <head><title>Test - GitHub</title></head>
        <body><div class="markdown-body">Content</div></body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        result = parse_site("https://github.com/user/repo", soup)

        assert result is not None
        assert "title" in result

    def test_parse_site_without_parser(self):
        """Test parse_site without specific parser"""
        html = "<html><body><p>Content</p></body></html>"
        soup = BeautifulSoup(html, "lxml")
        result = parse_site("https://example.com/article", soup)

        assert result == {}
