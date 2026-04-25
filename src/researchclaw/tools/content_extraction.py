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
Content Extraction Tool
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import html2text


@dataclass
class ExtractedContent:
    """Extracted web content"""
    url: str
    title: str
    text: str
    html: str
    author: Optional[str] = None
    published_date: Optional[str] = None
    excerpt: Optional[str] = None


class ContentExtractor:
    """Web content extraction tool"""

    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    def __init__(self, timeout: int = 30):
        """Initialize content extractor

        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self.converter = html2text.HTML2Text()
        self.converter.ignore_links = False
        self.converter.ignore_images = True
        self.converter.ignore_emphasis = True

    def extract(self, url: str) -> Optional[ExtractedContent]:
        """Extract content from a URL

        Args:
            url: URL to extract content from

        Returns:
            ExtractedContent: Extracted content or None on failure
        """
        try:
            response = requests.get(
                url,
                timeout=self.timeout,
                headers=self.DEFAULT_HEADERS
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "lxml")

            # Extract title
            title = self._extract_title(soup)

            # Extract main content
            html = self._extract_main_content(soup)
            text = self.converter.handle(html) if html else ""

            # Extract metadata
            author = self._extract_author(soup)
            published_date = self._extract_date(soup)
            excerpt = self._extract_excerpt(soup)

            return ExtractedContent(
                url=url,
                title=title,
                text=text.strip(),
                html=html,
                author=author,
                published_date=published_date,
                excerpt=excerpt,
            )
        except Exception as e:
            print(f"Failed to extract content from {url}: {e}")
            return None

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title"""
        # Try og:title first
        og_title = soup.find("meta", property="og:title")
        if og_title:
            return og_title.get("content", "")

        # Try regular title tag
        title_tag = soup.find("title")
        if title_tag:
            return title_tag.get_text(strip=True)

        # Try h1
        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)

        return ""

    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract main content from page"""
        # Remove script and style elements
        for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
            tag.decompose()

        # Try common content selectors
        contentSelectors = [
            "article",
            "main",
            "[role='main']",
            ".content",
            ".post-content",
            ".article-content",
            ".entry-content",
            "#content",
            "#main",
        ]

        for selector in contentSelectors:
            content = soup.select_one(selector)
            if content:
                return str(content)

        # Fallback to body
        body = soup.find("body")
        if body:
            return str(body)

        return str(soup)

    def _extract_author(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract author from page"""
        # Try meta tags
        author_meta = soup.find("meta", attrs={"name": "author"})
        if author_meta:
            return author_meta.get("content")

        # Try schema.org
        author_schema = soup.find(itemprop="author")
        if author_schema:
            return author_schema.get_text(strip=True)

        return None

    def _extract_date(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract publication date from page"""
        # Try meta tags
        date_meta = soup.find("meta", property="article:published_time")
        if date_meta:
            return date_meta.get("content")

        # Try time tag
        time_tag = soup.find("time", datetime=True)
        if time_tag:
            return time_tag.get("datetime") or time_tag.get_text(strip=True)

        return None

    def _extract_excerpt(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract excerpt/description from page"""
        # Try og:description
        og_desc = soup.find("meta", property="og:description")
        if og_desc:
            return og_desc.get("content")

        # Try meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            return meta_desc.get("content")

        return None


def extract_content(url: str, timeout: int = 30) -> Optional[ExtractedContent]:
    """Extract content from a URL

    Args:
        url: URL to extract content from
        timeout: Request timeout in seconds

    Returns:
        ExtractedContent: Extracted content or None on failure
    """
    extractor = ContentExtractor(timeout)
    return extractor.extract(url)


__all__ = ["ExtractedContent", "ContentExtractor", "extract_content"]
