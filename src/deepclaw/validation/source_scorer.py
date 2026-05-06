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
Source Scoring Module

Domain reputation scoring, content freshness assessment, and combined
source quality evaluation.

Source Score = Domain Score x 0.4 + Freshness Score x 0.3 + Authority Score x 0.3
"""

import re
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
from dataclasses import dataclass, field
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


# ============================================================================
# Known domain reputation database
# ============================================================================

KNOWN_DOMAINS: Dict[str, float] = {
    # Academic & Research (high trust)
    "wikipedia.org": 0.85,
    "arxiv.org": 0.95,
    "scholar.google.com": 0.90,
    "ieee.org": 0.95,
    "acm.org": 0.90,
    "springer.com": 0.90,
    "nature.com": 0.95,
    "science.org": 0.95,
    "sciencedirect.com": 0.90,
    "pubmed.ncbi.nlm.nih.gov": 0.95,
    "researchgate.net": 0.70,
    "semanticscholar.org": 0.85,

    # Government & Official
    "who.int": 0.95,
    "un.org": 0.90,
    "nist.gov": 0.95,
    "nasa.gov": 0.90,
    "noaa.gov": 0.90,
    "cdc.gov": 0.95,
    "nih.gov": 0.95,
    "nsf.gov": 0.90,
    "data.gov": 0.85,

    # Development & Technology
    "github.com": 0.80,
    "stackoverflow.com": 0.70,
    "docs.python.org": 0.90,
    "developer.mozilla.org": 0.90,
    "w3.org": 0.90,
    "pypi.org": 0.75,
    "npmjs.com": 0.75,
    "docker.com": 0.75,

    # News & Media (moderate trust)
    "reuters.com": 0.80,
    "apnews.com": 0.80,
    "bbc.com": 0.75,
    "bbc.co.uk": 0.75,
    "bloomberg.com": 0.75,
    "economist.com": 0.80,
    "wsj.com": 0.75,
    "nytimes.com": 0.70,
    "theguardian.com": 0.70,

    # Tech News
    "techcrunch.com": 0.65,
    "wired.com": 0.70,
    "arstechnica.com": 0.75,
    "theverge.com": 0.60,
    "hackernews.com": 0.50,

    # Low trust domains
    "medium.com": 0.45,
    "reddit.com": 0.35,
    "quora.com": 0.30,
    "blogspot.com": 0.25,
    "wordpress.com": 0.25,
    "tumblr.com": 0.20,
    "facebook.com": 0.20,
    "twitter.com": 0.20,
    "x.com": 0.20,
    "youtube.com": 0.30,
}

# Educational TLDs
EDUCATIONAL_TLDS = {
    ".edu",
    ".ac.uk", ".ac.jp", ".ac.kr", ".ac.cn",
    ".ac.in", ".ac.au", ".ac.nz", ".ac.za",
    ".edu.cn", ".edu.hk", ".edu.tw",
}

# Government TLDs
GOVERNMENT_TLDS = {
    ".gov", ".gov.uk", ".gov.au", ".gov.cn",
    ".gov.sg", ".gov.hk", ".gov.jp",
    ".go.jp", ".go.kr",
    ".mil",
}


# ============================================================================
# Data classes
# ============================================================================

@dataclass
class DomainReputation:
    """Domain reputation assessment"""
    domain: str
    is_known: bool = False
    known_score: float = 0.5
    is_educational: bool = False
    is_government: bool = False
    has_ssl: bool = False
    reputation_score: float = 0.5
    factors: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "domain": self.domain,
            "is_known": self.is_known,
            "known_score": self.known_score,
            "is_educational": self.is_educational,
            "is_government": self.is_government,
            "has_ssl": self.has_ssl,
            "reputation_score": self.reputation_score,
            "factors": self.factors,
        }


@dataclass
class FreshnessScore:
    """Content freshness assessment"""
    pub_date_str: Optional[str] = None
    pub_date: Optional[datetime] = None
    mod_date_str: Optional[str] = None
    mod_date: Optional[datetime] = None
    days_since_pub: Optional[int] = None
    freshness_score: float = 0.5
    category: str = "unknown"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pub_date": self.pub_date.isoformat() if self.pub_date else None,
            "mod_date": self.mod_date.isoformat() if self.mod_date else None,
            "days_since_pub": self.days_since_pub,
            "freshness_score": self.freshness_score,
            "category": self.category,
        }


@dataclass
class SourceScore:
    """Combined source quality score"""
    url: str
    domain_score: float = 0.5
    freshness_score: float = 0.5
    authority_score: float = 0.5
    combined_score: float = 0.5
    domain_rep: Optional[DomainReputation] = None
    freshness: Optional[FreshnessScore] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "domain_score": self.domain_score,
            "freshness_score": self.freshness_score,
            "authority_score": self.authority_score,
            "combined_score": self.combined_score,
            "domain_rep": self.domain_rep.to_dict() if self.domain_rep else None,
            "freshness": self.freshness.to_dict() if self.freshness else None,
            "metadata": self.metadata,
        }


# ============================================================================
# Domain Scorer
# ============================================================================

class DomainScorer:
    """Scores domain reputation based on multiple factors"""

    def score_domain(self, url: str) -> DomainReputation:
        """Score the reputation of a domain from a URL

        Args:
            url: Full URL to analyze

        Returns:
            DomainReputation with score and factors
        """
        domain = self._extract_domain(url)
        factors: Dict[str, float] = {}
        score = 0.5  # Neutral starting point

        # Check known domains
        is_known = False
        known_score = 0.5
        for known_domain, known_rep in KNOWN_DOMAINS.items():
            if domain == known_domain or domain.endswith("." + known_domain):
                is_known = True
                known_score = known_rep
                score = known_rep
                factors["known_domain"] = known_rep - 0.5
                break

        if not is_known:
            factors["known_domain"] = 0.0

        # Check educational domains
        is_educational = self._is_educational(domain)
        if is_educational and not is_known:
            score += 0.2
            factors["educational"] = 0.2

        # Check government domains
        is_government = self._is_government(domain)
        if is_government and not is_known and not is_educational:
            score += 0.25
            factors["government"] = 0.25

        # SSL check
        has_ssl = url.startswith("https://")
        if has_ssl:
            score += 0.05
            factors["ssl"] = 0.05

        # Clamp
        score = max(0.0, min(1.0, score))

        return DomainReputation(
            domain=domain,
            is_known=is_known,
            known_score=known_score,
            is_educational=is_educational,
            is_government=is_government,
            has_ssl=has_ssl,
            reputation_score=round(score, 3),
            factors=factors,
        )

    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract normalized domain from URL"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            # Strip www prefix
            if domain.startswith("www."):
                domain = domain[4:]
            # Strip port
            if ":" in domain:
                domain = domain.split(":")[0]
            return domain
        except Exception:
            return url.lower()

    @staticmethod
    def _is_educational(domain: str) -> bool:
        """Check if domain is educational"""
        for tld in EDUCATIONAL_TLDS:
            if domain.endswith(tld):
                return True
        return False

    @staticmethod
    def _is_government(domain: str) -> bool:
        """Check if domain is government"""
        for tld in GOVERNMENT_TLDS:
            if domain.endswith(tld):
                return True
        return False


# ============================================================================
# Freshness Scorer
# ============================================================================

class FreshnessScorer:
    """Scores content freshness based on publication date"""

    def score_freshness(
        self,
        pub_date_str: Optional[str] = None,
        mod_date_str: Optional[str] = None,
    ) -> FreshnessScore:
        """Score content freshness

        Args:
            pub_date_str: Publication date string (ISO or common formats)
            mod_date_str: Last modified date string

        Returns:
            FreshnessScore with freshness evaluation
        """
        pub_date = self._parse_date(pub_date_str) if pub_date_str else None
        mod_date = self._parse_date(mod_date_str) if mod_date_str else None

        # Use the most recent date available
        effective_date = None
        if pub_date and mod_date:
            effective_date = max(pub_date, mod_date)
        elif pub_date:
            effective_date = pub_date
        elif mod_date:
            effective_date = mod_date

        if effective_date is None:
            return FreshnessScore(
                pub_date_str=pub_date_str,
                mod_date_str=mod_date_str,
                freshness_score=0.5,
                category="unknown",
            )

        now = datetime.now()
        days_since = (now - effective_date).days

        if days_since < 30:
            score = 1.0
            category = "very_recent"
        elif days_since < 90:
            score = 0.9
            category = "recent"
        elif days_since < 180:
            score = 0.7
            category = "current"
        elif days_since < 365:
            score = 0.5
            category = "acceptable"
        elif days_since < 730:
            score = 0.3
            category = "dated"
        else:
            score = 0.1
            category = "outdated"

        return FreshnessScore(
            pub_date_str=pub_date_str,
            pub_date=pub_date,
            mod_date_str=mod_date_str,
            mod_date=mod_date,
            days_since_pub=days_since,
            freshness_score=score,
            category=category,
        )

    @staticmethod
    def _parse_date(date_str: str) -> Optional[datetime]:
        """Parse date string in various formats

        Args:
            date_str: Date string to parse

        Returns:
            Parsed datetime or None
        """
        if not date_str:
            return None

        # Try common date formats
        formats = [
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y/%m/%d",
            "%d %B %Y",
            "%d %b %Y",
            "%B %d, %Y",
            "%b %d, %Y",
            "%Y",
            "%Y-%m",
            "%m/%d/%Y",
            "%d-%m-%Y",
            "%d.%m.%Y",
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue

        # Try extracting just a year
        try:
            match = re.search(r"(\d{4})", date_str)
            if match:
                return datetime(int(match.group(1)), 1, 1)
        except Exception:
            pass

        return None


# ============================================================================
# Source Scorer (combined)
# ============================================================================

class SourceScorer:
    """Combines domain reputation and content freshness for overall source scoring"""

    def __init__(
        self,
        domain_weight: float = 0.4,
        freshness_weight: float = 0.3,
        authority_weight: float = 0.3,
    ):
        """Initialize source scorer

        Args:
            domain_weight: Weight for domain score (default 0.4)
            freshness_weight: Weight for content freshness (default 0.3)
            authority_weight: Weight for author authority (default 0.3)
        """
        total = domain_weight + freshness_weight + authority_weight
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total}")
        self.domain_weight = domain_weight
        self.freshness_weight = freshness_weight
        self.authority_weight = authority_weight
        self.domain_scorer = DomainScorer()
        self.freshness_scorer = FreshnessScorer()

    def score(
        self,
        url: str,
        pub_date: Optional[str] = None,
        author_info: Optional[Dict[str, Any]] = None,
    ) -> SourceScore:
        """Score a source based on domain, freshness, and authority

        Args:
            url: Source URL
            pub_date: Publication date string
            author_info: Optional author metadata (name, credentials, etc.)

        Returns:
            SourceScore with combined assessment
        """
        # Domain scoring
        domain_rep = self.domain_scorer.score_domain(url)

        # Freshness scoring
        freshness = self.freshness_scorer.score_freshness(pub_date)

        # Authority scoring
        authority_score = self._score_authority(author_info)

        # Combined score
        combined = (
            domain_rep.reputation_score * self.domain_weight
            + freshness.freshness_score * self.freshness_weight
            + authority_score * self.authority_weight
        )

        return SourceScore(
            url=url,
            domain_score=domain_rep.reputation_score,
            freshness_score=freshness.freshness_score,
            authority_score=authority_score,
            combined_score=round(combined, 3),
            domain_rep=domain_rep,
            freshness=freshness,
        )

    def score_batch(
        self,
        sources: List[Dict[str, Any]],
    ) -> List[SourceScore]:
        """Score multiple sources

        Args:
            sources: List of dicts with url, pub_date, author_info keys

        Returns:
            List of SourceScore
        """
        results = []
        for src in sources:
            score = self.score(
                url=src.get("url", ""),
                pub_date=src.get("pub_date"),
                author_info=src.get("author_info"),
            )
            results.append(score)
        return results

    @staticmethod
    def _score_authority(author_info: Optional[Dict[str, Any]] = None) -> float:
        """Score author authority based on available info

        Args:
            author_info: Dict with author metadata

        Returns:
            Authority score 0.0-1.0
        """
        if not author_info:
            return 0.5  # Neutral when no info

        score = 0.5

        # Known credentials boost
        credential_keywords = [
            "ph.d", "phd", "professor", "dr.", "m.d.", "md",
            "researcher", "scientist", "engineer",
        ]
        credentials = str(author_info.get("credentials", "")).lower()
        for kw in credential_keywords:
            if kw in credentials:
                score += 0.1
                break

        # Publication count
        pub_count = author_info.get("publication_count", 0)
        if isinstance(pub_count, (int, float)) and pub_count > 0:
            if pub_count > 50:
                score += 0.2
            elif pub_count > 10:
                score += 0.1
            elif pub_count > 0:
                score += 0.05

        return max(0.0, min(1.0, score))


# ============================================================================
# Convenience functions
# ============================================================================

def score_source(
    url: str,
    pub_date: Optional[str] = None,
    author_info: Optional[Dict[str, Any]] = None,
) -> SourceScore:
    """Convenience function to score a single source

    Args:
        url: Source URL
        pub_date: Publication date string
        author_info: Optional author metadata

    Returns:
        SourceScore
    """
    scorer = SourceScorer()
    return scorer.score(url, pub_date, author_info)


def score_sources(
    sources: List[Dict[str, Any]],
) -> List[SourceScore]:
    """Convenience function to score multiple sources

    Args:
        sources: List of dicts with url, pub_date, author_info

    Returns:
        List of SourceScore
    """
    scorer = SourceScorer()
    return scorer.score_batch(sources)


__all__ = [
    "DomainReputation",
    "FreshnessScore",
    "SourceScore",
    "DomainScorer",
    "FreshnessScorer",
    "SourceScorer",
    "score_source",
    "score_sources",
]
