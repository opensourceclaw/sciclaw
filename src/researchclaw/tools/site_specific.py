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

Features:
- Extensible parser registry with dynamic registration
- Support for 20+ popular sites
- Domain pattern matching with subdomain support
- Custom extraction rules per site
"""

import re
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Type
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from dataclasses import dataclass, field


@dataclass
class SiteParserConfig:
    """Configuration for a site parser"""
    domains: List[str] = field(default_factory=list)
    selectors: Dict[str, str] = field(default_factory=dict)
    requires_js: bool = False
    priority: int = 100  # Higher = more specific


class SiteParser(ABC):
    """Base class for site-specific parsers"""

    # Site domains this parser handles
    DOMAINS: list[str] = []
    
    # CSS selectors for content extraction
    SELECTORS: Dict[str, str] = {}
    
    # Priority for matching (higher = more specific)
    PRIORITY: int = 100
    
    # Whether this site requires JavaScript rendering
    REQUIRES_JS: bool = False

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
        if not cls.DOMAINS:
            return False
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # Remove www. prefix for matching
        domain = re.sub(r'^www\.', '', domain)
        return any(d in domain for d in cls.DOMAINS)
    
    @classmethod
    def get_config(cls) -> SiteParserConfig:
        """Get parser configuration"""
        return SiteParserConfig(
            domains=cls.DOMAINS,
            selectors=cls.SELECTORS,
            requires_js=cls.REQUIRES_JS,
            priority=cls.PRIORITY,
        )


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
    SELECTORS = {
        "title": "[data-testid='post-title'], .title",
        "content": ".post-content, [data-testid='post-content']",
    }
    PRIORITY = 120

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


class HackerNewsParser(SiteParser):
    """Parser for Hacker News"""

    DOMAINS = [
        "news.ycombinator.com",
        "hn.firechat.co",
    ]
    SELECTORS = {
        "title": "title, .titleline a",
        "content": ".comment",
        "author": ".hnuser",
    }
    PRIORITY = 200

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Hacker News content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        title_elem = soup.select_one(".titleline a")
        if title_elem:
            result["title"] = title_elem.get_text(strip=True)

        # Author
        author_elem = soup.select_one(".hnuser")
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Date
        time_elem = soup.select_one(".age")
        if time_elem and time_elem.get("title"):
            result["date"] = time_elem["title"]

        # Content (for comments)
        comment = soup.select_one(".comment")
        if comment:
            result["content"] = comment.get_text(separator="\n", strip=True)

        return result


class TechCrunchParser(SiteParser):
    """Parser for TechCrunch"""

    DOMAINS = [
        "techcrunch.com",
        "techcrunch.jp",
    ]
    SELECTORS = {
        "title": "article h1, .article-title",
        "content": ".article-content, .article-body",
    }
    PRIORITY = 150

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract TechCrunch article content"""
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
            title_elem = soup.select_one("article h1, .article-title")
            if title_elem:
                result["title"] = title_elem.get_text(strip=True)

        # Author
        author = soup.find("meta", attrs={"name": "author"})
        if author and author.get("content"):
            result["author"] = author["content"]

        # Date
        date = soup.find("meta", property="article:published_time")
        if date and date.get("content"):
            result["date"] = date["content"]

        # Content
        article = soup.select_one(".article-content, .article-body, article")
        if article:
            for elem in article.select(".ad, .newsletter, .share"):
                elem.decompose()
            result["content"] = article.get_text(separator="\n", strip=True)

        return result


class VergeParser(SiteParser):
    """Parser for The Verge"""

    DOMAINS = ["theverge.com", "www.theverge.com"]
    SELECTORS = {
        "title": "h1, [data-testid='title']",
        "content": ".article-body, .c-entry-content",
    }
    PRIORITY = 150

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract The Verge article content"""
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
        author = soup.find("meta", attrs={"name": "author"})
        if author and author.get("content"):
            result["author"] = author["content"]

        # Date
        date = soup.find("meta", property="article:published_time")
        if date and date.get("content"):
            result["date"] = date["content"]

        # Content
        article = soup.select_one(".article-body, .c-entry-content, article")
        if article:
            result["content"] = article.get_text(separator="\n", strip=True)

        return result


class ArsTechnicaParser(SiteParser):
    """Parser for Ars Technica"""

    DOMAINS = ["arstechnica.com"]
    SELECTORS = {
        "title": "h1, .article-title",
        "content": ".article-content, .post-content",
    }
    PRIORITY = 150

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Ars Technica article content"""
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
        author = soup.find("meta", attrs={"name": "author"})
        if author and author.get("content"):
            result["author"] = author["content"]

        # Date
        date = soup.find("meta", property="article:published_time")
        if date and date.get("content"):
            result["date"] = date["content"]

        # Content
        article = soup.select_one(".article-content, .post-content, article")
        if article:
            result["content"] = article.get_text(separator="\n", strip=True)

        return result


class V2exParser(SiteParser):
    """Parser for V2EX"""

    DOMAINS = ["v2ex.com", "www.v2ex.com"]
    SELECTORS = {
        "title": ".header .topic",
        "content": ".topic_content",
    }
    PRIORITY = 150

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract V2EX content"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title
        title_elem = soup.select_one(".header .topic")
        if title_elem:
            result["title"] = title_elem.get_text(strip=True)

        # Author
        author_elem = soup.select_one(".header a.username")
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Content
        content_elem = soup.select_one(".topic_content")
        if content_elem:
            result["content"] = content_elem.get_text(separator="\n", strip=True)

        return result


class ProductHuntParser(SiteParser):
    """Parser for Product Hunt"""

    DOMAINS = ["producthunt.com", "www.producthunt.com"]
    SELECTORS = {
        "title": "h1, .productName",
        "content": ".productDescription",
    }
    PRIORITY = 150
    REQUIRES_JS = True  # Requires JS rendering

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Product Hunt content"""
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

        # Description
        desc = soup.find("meta", property="og:description")
        if desc and desc.get("content"):
            result["content"] = desc["content"]

        return result


class BiliBiliParser(SiteParser):
    """Parser for Bilibili"""

    DOMAINS = ["bilibili.com", "www.bilibili.com"]
    SELECTORS = {
        "title": "h1, .video-title",
        "content": ".video-desc",
    }
    PRIORITY = 150
    REQUIRES_JS = True

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract Bilibili video info"""
        result = {
            "title": "",
            "content": "",
            "author": None,
            "date": None,
        }

        # Title from og
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"]

        # Description
        desc = soup.find("meta", property="og:description")
        if desc and desc.get("content"):
            result["content"] = desc["content"]

        return result


class CSDNParser(SiteParser):
    """Parser for CSDN"""

    DOMAINS = ["blog.csdn.net", "csdn.net"]
    SELECTORS = {
        "title": "h1, .title-article",
        "content": ".article_content",
    }
    PRIORITY = 150

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract CSDN blog content"""
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
            title_elem = soup.select_one("h1, .title-article")
            if title_elem:
                result["title"] = title_elem.get_text(strip=True)

        # Author
        author_elem = soup.select_one("[class*='author'], .username")
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Content
        content_elem = soup.select_one(".article_content, .blog-content")
        if content_elem:
            result["content"] = content_elem.get_text(separator="\n", strip=True)

        return result


class JianShuParser(SiteParser):
    """Parser for 简书 (JianShu)"""

    DOMAINS = ["jianshu.com", "www.jianshu.com"]
    SELECTORS = {
        "title": "h1, .title",
        "content": ".content, .article",
    }
    PRIORITY = 150

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract JianShu article content"""
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
        author_elem = soup.select_one("[class*='author'], a[rel='author']")
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Content
        content_elem = soup.select_one(".content, .article, article")
        if content_elem:
            result["content"] = content_elem.get_text(separator="\n", strip=True)

        return result


class SegmentFaultParser(SiteParser):
    """Parser for SegmentFault"""

    DOMAINS = ["segmentfault.com", "www.segmentfault.com"]
    SELECTORS = {
        "title": "h1, .article-title",
        "content": ".article-content",
    }
    PRIORITY = 150

    def parse(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract SegmentFault content"""
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
        author_elem = soup.select_one("[class*='author']")
        if author_elem:
            result["author"] = author_elem.get_text(strip=True)

        # Content
        content_elem = soup.select_one(".article-content, .post-content")
        if content_elem:
            result["content"] = content_elem.get_text(separator="\n", strip=True)

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


# Registry of all parsers (ordered by priority for matching)
SITE_PARSERS: list[type[SiteParser]] = [
    # High-priority specific parsers
    HackerNewsParser,      # 200
    ProductHuntParser,    # 150 (requires JS)
    BiliBiliParser,       # 150 (requires JS)
    V2exParser,           # 150
    CSDNParser,           # 150
    JianShuParser,        # 150
    SegmentFaultParser,   # 150
    TechCrunchParser,     # 150
    VergeParser,          # 150
    ArsTechnicaParser,    # 150
    # Standard parsers
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

# Parser registry for dynamic registration
_PARSER_REGISTRY: dict[str, type[SiteParser]] = {}


def register_parser(parser_class: type[SiteParser]) -> None:
    """Register a new parser dynamically
    
    Args:
        parser_class: SiteParser subclass to register
    """
    for domain in parser_class.DOMAINS:
        _PARSER_REGISTRY[domain] = parser_class


def unregister_parser(domain: str) -> None:
    """Unregister a parser by domain
    
    Args:
        domain: Domain to unregister
    """
    _PARSER_REGISTRY.pop(domain, None)


def get_registered_domains() -> list[str]:
    """Get list of all registered domains"""
    return list(_PARSER_REGISTRY.keys())


def get_parser(url: str) -> Optional[SiteParser]:
    """Get appropriate parser for URL

    Args:
        url: URL to parse

    Returns:
        SiteParser instance or None if no specific parser
    """
    # Check registered parsers first
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    domain = re.sub(r'^www\.', '', domain)
    
    if domain in _PARSER_REGISTRY:
        return _PARSER_REGISTRY[domain]()
    
    # Fall back to built-in parsers
    for parser_class in SITE_PARSERS:
        if parser_class.can_handle(url):
            return parser_class()
    return None


def get_parser_by_priority(url: str) -> Optional[SiteParser]:
    """Get parser with highest priority matching the URL
    
    Args:
        url: URL to parse
        
    Returns:
        SiteParser instance or None
    """
    matching_parsers = []
    
    for parser_class in SITE_PARSERS:
        if parser_class.can_handle(url):
            matching_parsers.append(parser_class)
    
    if not matching_parsers:
        return None
    
    # Return highest priority
    return max(matching_parsers, key=lambda p: p.PRIORITY)()


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
    "SiteParserConfig",
    "SITE_PARSERS",
    "get_parser",
    "get_parser_by_priority",
    "can_handle",
    "parse_site",
    "register_parser",
    "unregister_parser",
    "get_registered_domains",
    # Parser classes
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
    "HackerNewsParser",
    "TechCrunchParser",
    "VergeParser",
    "ArsTechnicaParser",
    "V2exParser",
    "ProductHuntParser",
    "BiliBiliParser",
    "CSDNParser",
    "JianShuParser",
    "SegmentFaultParser",
]
