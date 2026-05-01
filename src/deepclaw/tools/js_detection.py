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
JavaScript-Rendered Content Detection

Detects if a page is likely rendered via JavaScript (SPA)
"""

import re
from typing import Optional
from urllib.parse import urlparse
from bs4 import BeautifulSoup


# Known SPA frameworks
SPA_FRAMEWORKS = [
    "react",
    "vue",
    "angular",
    "svelte",
    "nextjs",
    "nuxt",
    "gatsby",
    "remix",
    "ember",
    "backbone",
    "mithril",
    "alpine",
]

# Known JS-heavy sites
JS_HEAVY_SITES = [
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "tiktok.com",
    "youtube.com",
    "reddit.com",
    "linkedin.com",
    "pinterest.com",
    "airbnb.com",
    "spotify.com",
    "notion.so",
    "slack.com",
    "figma.com",
    "canva.com",
]


class JSSiteDetector:
    """Detector for JavaScript-rendered sites"""

    def __init__(self):
        """Initialize detector"""
        self.spa_pattern = re.compile(
            r'|'.join(SPA_FRAMEWORKS),
            re.IGNORECASE
        )

    def is_likely_spa(self, url: str, html: str = "") -> bool:
        """Check if URL is likely a SPA

        Args:
            url: URL to check
            html: Optional HTML content for analysis

        Returns:
            True if likely a SPA
        """
        # Check domain against known JS-heavy sites
        parsed = urlparse(url)
        domain = parsed.netloc.lower()

        # Check for known JS-heavy sites
        for site in JS_HEAVY_SITES:
            if site in domain:
                return True

        # If we have HTML, analyze it
        if html:
            return self._analyze_html(html)

        return False

    def _analyze_html(self, html: str) -> bool:
        """Analyze HTML for SPA indicators

        Args:
            html: HTML content

        Returns:
            True if likely SPA
        """
        soup = BeautifulSoup(html, "lxml")

        # Check for root div with no content
        root = soup.find("div", id=re.compile(r"root|app|main"))
        if root:
            # Empty root div is strong SPA indicator
            text = root.get_text(strip=True)
            if len(text) < 50:
                return True

        # Check for framework scripts
        scripts = soup.find_all("script", src=True)
        for script in scripts:
            src = script.get("src", "")
            if self.spa_pattern.search(src):
                return True

        # Check for data attributes commonly used in SPAs
        data_attrs = soup.find_all(attrs={"data-server-rendered": "true"})
        if data_attrs:
            return True

        # Check for noscript with minimal content
        noscript = soup.find("noscript")
        if noscript:
            text = noscript.get_text(strip=True)
            if len(text) < 20:
                return True

        return False

    def should_use_headless(self, url: str) -> bool:
        """Check if site should be accessed via headless browser

        Args:
            url: URL to check

        Returns:
            True if headless browser recommended
        """
        parsed = urlparse(url)
        domain = parsed.netloc.lower()

        # Sites that definitely need headless
        need_headless = [
            "twitter.com",
            "x.com",
            "facebook.com",
            "instagram.com",
            "tiktok.com",
            "reddit.com",
            "linkedin.com",
        ]

        for site in need_headless:
            if site in domain:
                return True

        return False

    def get_recommendation(self, url: str, html: str = "") -> dict:
        """Get recommendation for handling the site

        Args:
            url: URL to check
            html: Optional HTML content

        Returns:
            Dict with recommendation details
        """
        is_spa = self.is_likely_spa(url, html)
        need_headless = self.should_use_headless(url)

        return {
            "url": url,
            "likely_spa": is_spa,
            "recommend_headless": need_headless,
            "fallback_message": self._get_fallback_message(need_headless),
        }

    def _get_fallback_message(self, need_headless: bool) -> str:
        """Get recommendation message"""
        if need_headless:
            return (
                "This site likely requires JavaScript rendering. "
                "Consider using a headless browser (Playwright/Selenium) "
                "for content extraction."
            )
        return (
            "Standard HTTP request should work. "
            "If content is empty, try using a headless browser."
        )


# Default detector instance
_default_detector: Optional[JSSiteDetector] = None


def detect_js_site(url: str, html: str = "") -> bool:
    """Check if URL is likely a JS-rendered site

    Args:
        url: URL to check
        html: Optional HTML content

    Returns:
        True if likely SPA
    """
    global _default_detector
    if _default_detector is None:
        _default_detector = JSSiteDetector()
    return _default_detector.is_likely_spa(url, html)


def should_use_headless(url: str) -> bool:
    """Check if headless browser recommended

    Args:
        url: URL to check

    Returns:
        True if headless recommended
    """
    global _default_detector
    if _default_detector is None:
        _default_detector = JSSiteDetector()
    return _default_detector.should_use_headless(url)


def get_recommendation(url: str, html: str = "") -> dict:
    """Get handling recommendation

    Args:
        url: URL to check
        html: Optional HTML content

    Returns:
        Recommendation dict
    """
    global _default_detector
    if _default_detector is None:
        _default_detector = JSSiteDetector()
    return _default_detector.get_recommendation(url, html)


__all__ = [
    "JSSiteDetector",
    "SPA_FRAMEWORKS",
    "JS_HEAVY_SITES",
    "detect_js_site",
    "should_use_headless",
    "get_recommendation",
]
