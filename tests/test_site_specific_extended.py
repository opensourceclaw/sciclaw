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
Tests for new site parsers
"""

import pytest
from unittest.mock import Mock, patch
from bs4 import BeautifulSoup

from deepclaw.tools.site_specific import (
    get_parser,
    can_handle,
    parse_site,
    register_parser,
    unregister_parser,
    get_registered_domains,
    get_parser_by_priority,
    SiteParser,
    HackerNewsParser,
    V2exParser,
    CSDNParser,
    JianShuParser,
    SegmentFaultParser,
    TechCrunchParser,
    VergeParser,
    ArsTechnicaParser,
    ProductHuntParser,
    BiliBiliParser,
)


class TestNewParsers:
    """Test new site parsers"""

    def test_hackernews_can_handle(self):
        """Test HackerNews parser can handle URLs"""
        assert HackerNewsParser.can_handle("https://news.ycombinator.com/item?id=123")
        assert HackerNewsParser.can_handle("https://news.ycombinator.com/")
        assert not HackerNewsParser.can_handle("https://example.com")

    def test_hackernews_parse(self):
        """Test HackerNews parser content extraction"""
        html = """
        <html>
        <head><title>Hacker News</title></head>
        <body>
            <span class="titleline"><a href="/item?id=123">Test Title</a></span>
            <span class="hnuser">testuser</span>
            <span class="age" title="2026-04-26T10:00:00Z">2 hours ago</span>
            <div class="comment">
                <p>Test comment content here with enough text to be extracted.</p>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "lxml")
        parser = HackerNewsParser()
        result = parser.parse(soup, "https://news.ycombinator.com/item?id=123")
        
        assert result["title"] == "Test Title"
        assert result["author"] == "testuser"
        assert "Test comment" in result["content"]

    def test_v2ex_can_handle(self):
        """Test V2EX parser can handle URLs"""
        assert V2exParser.can_handle("https://www.v2ex.com/t/123456")
        assert V2exParser.can_handle("https://v2ex.com/")
        assert not V2exParser.can_handle("https://example.com")

    def test_csdn_can_handle(self):
        """Test CSDN parser can handle URLs"""
        assert CSDNParser.can_handle("https://blog.csdn.net/user/article/123")
        assert CSDNParser.can_handle("https://csdn.net/")
        assert not CSDNParser.can_handle("https://example.com")

    def test_jianshu_can_handle(self):
        """Test JianShu parser can handle URLs"""
        assert JianShuParser.can_handle("https://www.jianshu.com/p/abc123")
        assert JianShuParser.can_handle("https://jianshu.com/")
        assert not JianShuParser.can_handle("https://example.com")

    def test_segmentfault_can_handle(self):
        """Test SegmentFault parser can handle URLs"""
        assert SegmentFaultParser.can_handle("https://segmentfault.com/a/123")
        assert SegmentFaultParser.can_handle("https://www.segmentfault.com/")
        assert not SegmentFaultParser.can_handle("https://example.com")

    def test_techcrunch_can_handle(self):
        """Test TechCrunch parser can handle URLs"""
        assert TechCrunchParser.can_handle("https://techcrunch.com/2026/04/26/test")
        assert not TechCrunchParser.can_handle("https://example.com")

    def test_verge_can_handle(self):
        """Test Verge parser can handle URLs"""
        assert VergeParser.can_handle("https://www.theverge.com/2026/4/26/test")
        assert not VergeParser.can_handle("https://example.com")

    def test_arstechnica_can_handle(self):
        """Test ArsTechnica parser can handle URLs"""
        assert ArsTechnicaParser.can_handle("https://arstechnica.com/science/2026/04/test")
        assert not ArsTechnicaParser.can_handle("https://example.com")

    def test_producthunt_requires_js(self):
        """Test Product Hunt requires JS rendering"""
        assert ProductHuntParser.REQUIRES_JS == True

    def test_bilibili_requires_js(self):
        """Test Bilibili requires JS rendering"""
        assert BiliBiliParser.REQUIRES_JS == True


class TestParserRegistry:
    """Test parser registry functions"""

    def test_register_parser(self):
        """Test dynamic parser registration"""
        class CustomParser(SiteParser):
            DOMAINS = ["custom.example.com"]
            
            def parse(self, soup, url):
                return {}
        
        # Clear any existing registration
        unregister_parser("custom.example.com")
        
        register_parser(CustomParser)
        assert "custom.example.com" in get_registered_domains()
        
        # Clean up
        unregister_parser("custom.example.com")

    def test_unregister_parser(self):
        """Test parser unregistration"""
        class TempParser(SiteParser):
            DOMAINS = ["temp.example.com"]
            
            def parse(self, soup, url):
                return {}
        
        register_parser(TempParser)
        assert "temp.example.com" in get_registered_domains()
        
        unregister_parser("temp.example.com")
        assert "temp.example.com" not in get_registered_domains()

    def test_get_parser_with_registration(self):
        """Test get_parser uses registered parsers"""
        class CustomParser(SiteParser):
            DOMAINS = ["custom.example.com"]
            
            def parse(self, soup, url):
                return {"custom": True}
        
        unregister_parser("custom.example.com")
        register_parser(CustomParser)
        
        parser = get_parser("https://custom.example.com/test")
        assert parser is not None
        
        unregister_parser("custom.example.com")

    def test_get_parser_by_priority(self):
        """Test priority-based parser selection"""
        parser = get_parser_by_priority("https://news.ycombinator.com/item?id=123")
        assert parser is not None
        assert isinstance(parser, HackerNewsParser)


class TestSiteParserBase:
    """Test base SiteParser class"""

    def test_get_config(self):
        """Test parser config retrieval"""
        config = HackerNewsParser.get_config()
        assert config.domains == HackerNewsParser.DOMAINS
        assert config.priority == 200
        assert "news.ycombinator.com" in config.domains


class TestMultipleSiteHandles:
    """Test multiple sites can be handled"""

    def test_supported_sites(self):
        """Test all supported sites"""
        test_urls = [
            ("https://github.com/user/repo", True),
            ("https://medium.com/@user/post", True),
            ("https://news.ycombinator.com/item?id=123", True),
            ("https://stackoverflow.com/questions/123", True),
            ("https://www.v2ex.com/t/123", True),
            ("https://blog.csdn.net/user/article", True),
            ("https://www.jianshu.com/p/abc", True),
            ("https://segmentfault.com/a/123", True),
            ("https://techcrunch.com/2026/04/test", True),
            ("https://www.theverge.com/2026/4/test", True),
            ("https://arstechnica.com/test", True),
            ("https://example.com", False),
        ]
        
        for url, expected in test_urls:
            result = can_handle(url)
            assert result == expected, f"Failed for {url}"

    def test_parser_count(self):
        """Test we have 20+ parsers"""
        from deepclaw.tools.site_specific import SITE_PARSERS
        # Count unique parser classes
        parser_count = len(set(SITE_PARSERS))
        assert parser_count >= 20, f"Expected 20+ parsers, got {parser_count}"
