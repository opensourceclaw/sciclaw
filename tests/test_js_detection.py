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
Tests for User-Agent Pool and JS Detection
"""

import pytest
from researchclaw.tools.user_agent import (
    UserAgentPool,
    get_user_agent,
    get_default_headers,
)
from researchclaw.tools.js_detection import (
    JSSiteDetector,
    detect_js_site,
    should_use_headless,
    get_recommendation,
    JS_HEAVY_SITES,
)


class TestUserAgentPool:
    """Test UserAgentPool class"""

    def test_get_random(self):
        """Test getting random user agent"""
        pool = UserAgentPool()
        ua = pool.get()
        assert ua is not None
        assert len(ua) > 0
        assert "Mozilla" in ua

    def test_get_desktop(self):
        """Test getting desktop user agent"""
        pool = UserAgentPool()
        ua = pool.get_desktop()
        assert ua is not None
        assert "Mozilla" in ua
        # Mobile-specific strings should not be present
        assert "Android" not in ua
        assert "iPhone" not in ua

    def test_get_mobile(self):
        """Test getting mobile user agent"""
        pool = UserAgentPool()
        ua = pool.get_mobile()
        assert ua is not None
        # Should be mobile
        assert "Android" in ua or "iPhone" in ua

    def test_pool_with_mobile(self):
        """Test pool with mobile agents included"""
        pool = UserAgentPool(use_mobile=True)
        agents = pool.agents
        # Should have both desktop and mobile
        assert len(agents) > len(UserAgentPool.USER_AGENTS)

    def test_rotate(self):
        """Test rotate method"""
        pool = UserAgentPool()
        ua1 = pool.rotate()
        ua2 = pool.rotate()
        # Should get different agents occasionally (random)
        # Not guaranteed but likely over multiple calls
        assert ua1 is not None
        assert ua2 is not None

    def test_get_headers(self):
        """Test getting headers dict"""
        headers = UserAgentPool.get_headers()
        assert "User-Agent" in headers
        assert "Accept" in headers
        assert "Accept-Language" in headers

    def test_get_headers_mobile(self):
        """Test getting mobile headers"""
        from researchclaw.tools.user_agent import UserAgentPool
        pool = UserAgentPool(use_mobile=True)
        headers = {"User-Agent": pool.get_mobile()}
        # Should be mobile UA
        ua = headers["User-Agent"]
        assert "Android" in ua or "iPhone" in ua


class TestGetUserAgent:
    """Test module-level functions"""

    def test_get_user_agent(self):
        """Test get_user_agent function"""
        ua = get_user_agent()
        assert ua is not None
        assert len(ua) > 0

    def test_get_default_headers_has_ua(self):
        """Test get_default_headers function"""
        headers = get_default_headers()
        assert "User-Agent" in headers
        assert len(headers["User-Agent"]) > 0


class TestJSSiteDetector:
    """Test JSSiteDetector class"""

    @pytest.fixture
    def detector(self):
        """Create detector instance"""
        return JSSiteDetector()

    def test_creation(self, detector):
        """Test creating detector"""
        assert detector is not None
        assert detector.spa_pattern is not None

    def test_is_likely_spa_known_sites(self, detector):
        """Test detection on known JS-heavy sites"""
        # Twitter/X
        assert detector.is_likely_spa("https://twitter.com/user/status/123")
        assert detector.is_likely_spa("https://x.com/user/status/123")
        # Reddit
        assert detector.is_likely_spa("https://reddit.com/r/python/comments/abc")

    def test_is_likely_spa_regular_site(self, detector):
        """Test detection on regular sites"""
        # Should not be flagged as SPA
        assert not detector.is_likely_spa("https://example.com/article")
        assert not detector.is_likely_spa("https://python.org")

    def test_is_likely_spa_with_empty_root(self, detector):
        """Test SPA detection with empty root div"""
        html = '<div id="root"></div>'
        result = detector.is_likely_spa("https://example.com", html)
        assert result is True

    def test_is_likely_spa_with_content_root(self, detector):
        """Test SPA detection with substantial content in root"""
        html = '<div id="root"><p>Some content here with enough text to not be considered empty</p><p>More content to make it substantial</p></div>'
        result = detector.is_likely_spa("https://example.com", html)
        # Should not be flagged as SPA with substantial content
        assert result is False

    def test_is_likely_spa_with_framework(self, detector):
        """Test SPA detection with React script"""
        html = """
        <html>
        <head>
            <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        </head>
        <body>
            <div id="root">Content</div>
        </body>
        </html>
        """
        result = detector.is_likely_spa("https://example.com", html)
        assert result is True

    def test_should_use_headless(self, detector):
        """Test headless browser recommendation"""
        # Should recommend headless for Twitter
        assert detector.should_use_headless("https://twitter.com/user/status/123")
        assert detector.should_use_headless("https://x.com/user/status/123")
        # Should not for regular sites
        assert not detector.should_use_headless("https://python.org")

    def test_get_recommendation_spa(self, detector):
        """Test recommendation for SPA"""
        rec = detector.get_recommendation("https://twitter.com/user/status/123")
        assert rec["likely_spa"] is True
        assert rec["recommend_headless"] is True
        assert "headless" in rec["fallback_message"].lower()

    def test_get_recommendation_regular(self, detector):
        """Test recommendation for regular site"""
        rec = detector.get_recommendation("https://python.org")
        assert rec["likely_spa"] is False
        assert rec["recommend_headless"] is False


class TestModuleFunctions:
    """Test module-level functions"""

    def test_detect_js_site_true(self):
        """Test detect_js_site for SPA"""
        assert detect_js_site("https://twitter.com/user/status/123") is True

    def test_detect_js_site_false(self):
        """Test detect_js_site for regular site"""
        assert detect_js_site("https://python.org") is False

    def test_should_use_headless_true(self):
        """Test should_use_headless"""
        assert should_use_headless("https://twitter.com/user/status/123") is True

    def test_should_use_headless_false(self):
        """Test should_use_headless for regular site"""
        assert should_use_headless("https://python.org") is False

    def test_get_recommendation(self):
        """Test get_recommendation"""
        rec = get_recommendation("https://python.org")
        assert "url" in rec
        assert "likely_spa" in rec
        assert "recommend_headless" in rec


class TestJSHeavySites:
    """Test JS_HEAVY_SITES list"""

    def test_has_sites(self):
        """Test that list has entries"""
        assert len(JS_HEAVY_SITES) > 0

    def test_contains_expected(self):
        """Test expected sites are in list"""
        assert "twitter.com" in JS_HEAVY_SITES
        assert "reddit.com" in JS_HEAVY_SITES
        assert "youtube.com" in JS_HEAVY_SITES
