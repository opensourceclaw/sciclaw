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
Site-Specific Content Parsers
"""

import re
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from urllib.parse import urlparse
from bs4 import BeautifulSoup


class SiteParser(ABC):
    """Base class for site-specific parsers"""

    # Site domains this parser handles
    DOMAINS: list[str] = []

    @abstractmethod
    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Parse site-specific content

        Args:
            soup: BeautifulSoup object
            url: Source URL

        Returns:
            Dict with parsed content (title, content, author, date, etc.)
        """
        pass

    @classmethod
    def can_handle(cls, url: str) -> bool:
        """Check if this parser can handle the URL"""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        return any(d in domain for d in cls.DOMAINS)


class GitHubParser(SiteParser):
    """Parser for GitHub repositories and issues"""

    DOMAINS = ["github.com", "gist.github.com"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract GitHub content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Try to get title
        title_elem = soup.find("title")
        if title_elem:
            result["title"] = title_elem.get_text(strip=True)

        # Try to get repository description
        desc_elem = soup.select_one('[itemprop="description"]')
        if desc_elem:
            result["content"] = desc_elem.get_text(strip=True)

        # Try to get author (for gists)
        author_elem = soup.select_one('[itemprop="author"]')
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Try to get date
        time_elem = soup.find("time")
        if time_elem and time_elem.get("datetime"):
            result["date"] = time_elem["datetime"]

        # For README content
        readme = soup.select_one(".markdown-body")
        if readme:
            result["content"] = readme.get_text(separator="\n", strip=True)

        return result


class MediumParser(SiteParser):
    """Parser for Medium articles"""

    DOMAINS = ["medium.com", "substack.com"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Medium article content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title from og:title or h1
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"]

        if not result["title"]:
            h1 = soup.find("h1")
            if h1:
                result["title"] = h1.get_text(strip=True)

        # Author
        author_link = soup.select_one('a[rel="author"], [class*="author"]')
        if author_link:
            result["author"] = author_link.get_text(strip=True)

        # Publication date
        time_elem = soup.find("time")
        if time_elem and time_elem.get("datetime"):
            result["date"] = time_elem["datetime"]

        # Main content - try article body
        article = soup.select_one("article, [class*='article'], .post-content")
        if article:
            # Remove clutter
            for elem in article.select(".paywall, .subscription, .recommended"):
                elem.decompose()
            result["content"] = article.get_text(separator="\n", strip=True)

        return result


class ZhihuParser(SiteParser):
    """Parser for 知乎 (Zhihu)"""

    DOMAINS = ["zhihu.com"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Zhihu content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        title_elem = soup.find("title")
        if title_elem:
            result["title"] = title_elem.get_text(strip=True)
            result["title"] = re.sub(r'\s*[-|–]\s*知乎.*$', '', result["title"]).strip()

        # Author
        author_elem = soup.select_one('[class*="author"], a[class*="name"]')
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Content - try to find question/answer content
        content_elem = soup.select_one(
            '[class*="ContentItem"], [class*="Answer"], [class*="Post"], .zm-item'
        )
        if content_elem:
            result["content"] = content_elem.get_text(separator="\n", strip=True)

        # Fallback to article content
        if not result["content"]:
            article = soup.select_one("article, .post-content")
            if article:
                result["content"] = article.get_text(separator="\n", strip=True)

        return result


class DevToParser(SiteParser):
    """Parser for DEV Community"""

    DOMAINS = ["dev.to", "dev.to.it"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract DEV.to article content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"]

        # Author
        author_elem = soup.select_one('a[rel="author"], [class*="user"]')
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Date
        time_elem = soup.find("time")
        if time_elem and time_elem.get("datetime"):
            result["date"] = time_elem["datetime"]

        # Content
        article = soup.select_one("article, .article-content, .crayons-article")
        if article:
            # Remove code of conduct, etc.
            for elem in article.select(".crayons-notice, .hidden"):
                elem.decompose()
            result["content"] = article.get_text(separator="\n", strip=True)

        return result


class StackOverflowParser(SiteParser):
    """Parser for Stack Overflow and Stack Exchange"""

    DOMAINS = [
        "stackoverflow.com",
        "serverfault.com",
        "superuser.com",
        "askubuntu.com",
    ]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Stack Overflow content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        title_elem = soup.find("title")
        if title_elem:
            result["title"] = title_elem.get_text(strip=True)
            result["title"] = re.sub(r'\s*[-|–]\s*Stack.*$', '', result["title"]).strip()

        # Author
        author_elem = soup.select_one('[class*="user"], .post-signature a')
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Date - try time element
        time_elem = soup.find("time")
        if time_elem and time_elem.get("datetime"):
            result["date"] = time_elem["datetime"]

        # Content - try post body
        post = soup.select_one(".post-text, .answer, .question")
        if post:
            result["content"] = post.get_text(separator="\n", strip=True)

        return result


class WikipediaParser(SiteParser):
    """Parser for Wikipedia"""

    DOMAINS = ["wikipedia.org", "wikimedia.org"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Wikipedia content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        title_elem = soup.find("title")
        if title_elem:
            result["title"] = title_elem.get_text(strip=True)
            result["title"] = re.sub(r'\s*[-|–]\s*Wikipedia.*$', '', result["title"]).strip()

        # Also try h1
        h1 = soup.find("h1", id="firstHeading")
        if h1 and not result["title"]:
            result["title"] = h1.get_text(strip=True)

        # Content - main article body
        content_elem = soup.select_one("#mw-content-text, .mw-parser-output")
        if content_elem:
            # Remove references, etc.
            for elem in content_elem.select(".reference, .mw-editsection, .navbox"):
                elem.decompose()
            result["content"] = content_elem.get_text(separator="\n", strip=True)

        return result


class RedditParser(SiteParser):
    """Parser for Reddit"""

    DOMAINS = ["reddit.com", "old.reddit.com"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Reddit content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"]

        # Author
        author_elem = soup.select_one('[class*="author"], a[data-testid="author"]')
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Date
        time_elem = soup.find("time")
        if time_elem and time_elem.get("datetime"):
            result["date"] = time_elem["datetime"]

        # Content - post body
        post = soup.select_one('[class*="Post"], [class*="shreddit"], .entry')
        if post:
            result["content"] = post.get_text(separator="\n", strip=True)

        return result


class YouTubeParser(SiteParser):
    """Parser for YouTube"""

    DOMAINS = ["youtube.com", "youtu.be"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract YouTube video info"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title from og:title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"]

        # Channel name
        channel = soup.find("meta", attrs={"name": "author"})
        if channel and channel.get("content"):
            result["author"] = channel["content"]

        # Upload date
        date_meta = soup.find("meta", attrs={"name": "date"})
        if date_meta and date_meta.get("content"):
            result["date"] = date_meta["content"]

        # Description
        desc = soup.find("meta", property="og:description")
        if desc and desc.get("content"):
            result["content"] = desc["content"]

        return result


class TwitterParser(SiteParser):
    """Parser for Twitter/X"""

    DOMAINS = ["twitter.com", "x.com", "fxtwitter.com", "vxtwitter.com"]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Twitter/X tweet content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title from og:title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"]

        # Author from meta
        author = soup.find("meta", attrs={"name": "twitter:creator"})
        if author and author.get("content"):
            result["author"] = author["content"]

        # Content from og:description
        desc = soup.find("meta", property="og:description")
        if desc and desc.get("content"):
            result["content"] = desc["content"]

        return result


class NewsSiteParser(SiteParser):
    """Parser for news sites"""

    DOMAINS = [
        "news.google.com",
        "bbc.com",
        "bbc.co.uk",
        "cnn.com",
        "reuters.com",
        "apnews.com",
        "nytimes.com",
        "theguardian.com",
        "washingtonpost.com",
        "wsj.com",
    ]

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract news article content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"]

        if not result["title"]:
            title = soup.find("title")
            if title:
                result["title"] = title.get_text(strip=True)

        # Author
        author = soup.find("meta", attrs={"name": "author"})
        if author and author.get("content"):
            result["author"] = author["content"]

        # Try article:author
        if not result["author"]:
            author_og = soup.find("meta", property="article:author")
            if author_og and author_og.get("content"):
                result["author"] = author_og["content"]

        # Date
        date = soup.find("meta", property="article:published_time")
        if date and date.get("content"):
            result["date"] = date["content"]

        # Content - try article element
        article = soup.select_one(
            "article, [class*='article'], [class*='story'], "
            "[class*='post-body'], .article-body, .story-body"
        )
        if article:
            # Remove clutter
            for elem in article.select(
                ".ad, .share, .social, .newsletter, .promo, .paywall, script"
            ):
                elem.decompose()
            result["content"] = article.get_text(separator="\n", strip=True)

        return result


# Registry of all parsers
SITE_PARSERS: list[type[SiteParser]] = [
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
]


def get_parser(url: str) -> Optional[SiteParser]:
    """Get appropriate parser for URL

    Args:
        url: URL to parse

    Returns:
        SiteParser instance or None if no specific parser
    """
    for parser_class in SITE_PARSERS:
        if parser_class.can_handle(url):
            return parser_class()
    return None


def can_handle(url: str) -> bool:
    """Check if URL has a specific parser

    Args:
        url: URL to check

    Returns:
        True if there's a specific parser
    """
    return get_parser(url) is not None


def parse_site(url: str, soup: BeautifulSoup) -> Dict[str, Any]:
    """Parse site-specific content

    Args:
        url: Source URL
        soup: BeautifulSoup object

    Returns:
        Dict with parsed content (empty if no specific parser)
    """
    parser = get_parser(url)
    if parser:
        return parser.parse(soup, url)
    return {}


__all__ = [
    "SiteParser",
    "SITE_PARSERS",
    "get_parser",
    "can_handle",
    "parse_site",
    "GitHubParser",
    "MediumParser",
    "ZhihuParser",
    "DevToParser",
    "StackOverflowParser",
    "WikipediaParser",
    "RedditParser",
    "YouTubeParser",
    "TwitterParser",
    "NewsSiteParser",
]
