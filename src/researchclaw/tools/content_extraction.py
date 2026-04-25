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
Content Extraction Tool - Enhanced with text density analysis and readability
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import urlparse
import re
import requests
from bs4 import BeautifulSoup, Tag
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
    site_name: Optional[str] = None


# Noise patterns to remove
NOISE_TAGS = [
    "script", "style", "nav", "header", "footer", "aside",
    "form", "iframe", "noscript", "svg", "canvas", "video", "audio"
]

NOISE_CLASSES = [
    "advertisement", "ad", "ads", "sidebar", "comment", "comments",
    "social", "share", "sharing", "related", "recommended", "newsletter",
    "subscribe", "popup", "modal", "banner", "promo", "promotion"
]

NOISE_IDS = [
    "advertisement", "comments", "sidebar", "footer", "header",
    "nav", "navigation", "social", "share", "related"
]


class ContentExtractor:
    """Web content extraction tool with enhanced readability"""

    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    # Extended content selectors (priority order)
    CONTENT_SELECTORS = [
        # Semantic HTML5
        "article",
        "main",
        "[role='main']",
        "[role='article']",
        # Common class names
        ".post-content",
        ".article-content",
        ".entry-content",
        ".content-body",
        ".article-body",
        ".story-body",
        ".post-body",
        ".node-content",
        # Common IDs
        "#content",
        "#main-content",
        "#article-content",
        "#post-content",
        "#page-content",
        ".content",
        "#content-area",
    ]

    # Minimum text length to consider a block as content
    MIN_TEXT_LENGTH = 100

    # Minimum text density ratio
    MIN_TEXT_DENSITY = 0.25

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
        self.converter.body_width = 0  # No line wrapping

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
                headers=self.DEFAULT_HEADERS,
                allow_redirects=True,
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "lxml")

            # Extract metadata first
            title = self._extract_title(soup)
            author = self._extract_author(soup)
            published_date = self._extract_date(soup)
            excerpt = self._extract_excerpt(soup)
            site_name = self._extract_site_name(soup, url)

            # Clean noise elements
            self._clean_noise(soup)

            # Extract main content using multiple strategies
            html = self._extract_main_content(soup)
            text = self.converter.handle(html) if html else ""

            return ExtractedContent(
                url=url,
                title=title,
                text=text.strip(),
                html=html,
                author=author,
                published_date=published_date,
                excerpt=excerpt,
                site_name=site_name,
            )
        except requests.RequestException as e:
            print(f"Failed to fetch {url}: {e}")
            return None
        except Exception as e:
            print(f"Failed to extract content from {url}: {e}")
            return None

    def _clean_noise(self, soup: BeautifulSoup) -> None:
        """Remove noise elements from the page"""
        # Remove script and style elements
        for tag in soup(NOISE_TAGS):
            tag.decompose()

        # Remove elements with noise classes
        for tag in soup.find_all(class_=True):
            classes = tag.get("class", [])
            class_str = " ".join(classes).lower()
            if any(noise in class_str for noise in NOISE_CLASSES):
                # Keep the element but remove if it's purely noise
                if not tag.find_all(string=True, recursive=False):
                    tag.decompose()
                else:
                    # Try to extract useful content before removing
                    text = tag.get_text(strip=True)
                    if len(text) < 50:  # Too short, probably noise
                        tag.decompose()

        # Remove elements with noise IDs
        for tag in soup.find_all(id=True):
            tag_id = tag.get("id", "").lower()
            if any(noise in tag_id for noise in NOISE_IDS):
                if not tag.find_all(string=True, recursive=False):
                    tag.decompose()

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title"""
        # Try og:title first
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"].strip()

        # Try twitter:title
        twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
        if twitter_title and twitter_title.get("content"):
            return twitter_title["content"].strip()

        # Try regular title tag
        title_tag = soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)
            # Clean up common title patterns
            title = re.sub(r'\s*[-|–]\s*.+$', '', title)  # Remove " - Site Name"
            return title.strip()

        # Try h1
        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)

        return ""

    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract main content using multiple strategies"""

        # Strategy 1: Try CSS selectors
        html = self._extract_by_selectors(soup)
        if html and len(html) > self.MIN_TEXT_LENGTH * 10:
            return html

        # Strategy 2: Text density analysis
        html = self._extract_by_text_density(soup)
        if html and len(html) > self.MIN_TEXT_LENGTH * 10:
            return html

        # Strategy 3: Readability-style extraction
        html = self._extract_by_readability(soup)
        if html:
            return html

        # Fallback to body
        body = soup.find("body")
        if body:
            return str(body)

        return str(soup)

    def _extract_by_selectors(self, soup: BeautifulSoup) -> str:
        """Extract content using CSS selectors"""
        for selector in self.CONTENT_SELECTORS:
            try:
                content = soup.select_one(selector)
                if content:
                    text = content.get_text(strip=True)
                    if len(text) >= self.MIN_TEXT_LENGTH:
                        return str(content)
            except Exception:
                continue
        return ""

    def _extract_by_text_density(self, soup: BeautifulSoup) -> str:
        """Extract content using text density analysis"""
        candidates = []

        # Find all potential content blocks
        for tag in soup.find_all(["div", "section", "article"]):
            # Skip if has noise class/id
            class_str = " ".join(tag.get("class", [])).lower()
            tag_id = tag.get("id", "").lower()

            if any(noise in class_str or noise in tag_id for noise in NOISE_CLASSES + NOISE_IDS):
                continue

            # Calculate text density
            text = tag.get_text(separator=" ", strip=True)
            html_len = len(str(tag))

            if html_len < 200:
                continue

            # Text to HTML ratio
            text_len = len(text)
            density = text_len / html_len if html_len > 0 else 0

            if density >= self.MIN_TEXT_DENSITY and text_len >= self.MIN_TEXT_LENGTH:
                candidates.append({
                    "tag": tag,
                    "text": text,
                    "html": str(tag),
                    "length": text_len,
                    "density": density,
                })

        if not candidates:
            return ""

        # Sort by score (length * density)
        candidates.sort(key=lambda x: x["length"] * x["density"], reverse=True)

        return candidates[0]["html"]

    def _extract_by_readability(self, soup: BeautifulSoup) -> str:
        """Extract content using readability-style algorithm"""
        # Score paragraphs
        paragraph_scores = {}

        for p in soup.find_all("p"):
            parent = p.parent
            if not parent:
                continue

            parent_key = str(parent)
            text = p.get_text(strip=True)

            if len(text) < 25:
                continue

            # Initialize score
            if parent_key not in paragraph_scores:
                paragraph_scores[parent_key] = {
                    "parent": parent,
                    "score": 0,
                    "text_length": 0,
                }

            # Add score based on text length
            paragraph_scores[parent_key]["score"] += len(text)
            paragraph_scores[parent_key]["text_length"] += len(text)

        if not paragraph_scores:
            return ""

        # Get best candidate
        best = max(paragraph_scores.values(), key=lambda x: x["score"])

        # Verify it's content
        if best["text_length"] >= self.MIN_TEXT_LENGTH:
            return str(best["parent"])

        return ""

    def _extract_author(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract author from page"""
        # Try meta tags
        author_meta = soup.find("meta", attrs={"name": "author"})
        if author_meta and author_meta.get("content"):
            return author_meta["content"].strip()

        # Try article:author
        author_og = soup.find("meta", property="article:author")
        if author_og and author_og.get("content"):
            return author_og["content"].strip()

        # Try schema.org
        author_schema = soup.find(itemprop="author")
        if author_schema:
            return author_schema.get_text(strip=True)

        # Try common class names
        author_elem = soup.find(class_=re.compile(r"author", re.I))
        if author_elem:
            return author_elem.get_text(strip=True)

        return None

    def _extract_date(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract publication date from page"""
        # Try article:published_time
        date_meta = soup.find("meta", property="article:published_time")
        if date_meta and date_meta.get("content"):
            return date_meta["content"].strip()

        # Try article:modified_time
        modified_meta = soup.find("meta", property="article:modified_time")
        if modified_meta and modified_meta.get("content"):
            return modified_meta["content"].strip()

        # Try time tag
        time_tag = soup.find("time", datetime=True)
        if time_tag:
            return time_tag.get("datetime") or time_tag.get_text(strip=True)

        # Try datePublished schema
        date_schema = soup.find(itemprop="datePublished")
        if date_schema:
            return date_schema.get("content") or date_schema.get_text(strip=True)

        return None

    def _extract_excerpt(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract excerpt/description from page"""
        # Try og:description
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            return og_desc["content"].strip()

        # Try twitter:description
        twitter_desc = soup.find("meta", attrs={"name": "twitter:description"})
        if twitter_desc and twitter_desc.get("content"):
            return twitter_desc["content"].strip()

        # Try meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            return meta_desc["content"].strip()

        return None

    def _extract_site_name(self, soup: BeautifulSoup, url: str) -> Optional[str]:
        """Extract site name"""
        # Try og:site_name
        og_site = soup.find("meta", property="og:site_name")
        if og_site and og_site.get("content"):
            return og_site["content"].strip()

        # Fallback to domain
        parsed = urlparse(url)
        domain = parsed.netloc
        # Remove www and TLD
        site_name = re.sub(r'^www\.', '', domain)
        if '.' in site_name:
            site_name = site_name.split('.')[0]
        return site_name.capitalize() if site_name else None


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
