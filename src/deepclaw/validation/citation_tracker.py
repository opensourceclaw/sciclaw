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
Citation Tracking Module

Tracks all sources used during research with quality scoring,
access timestamps, and serialization support.
"""

import json
import uuid
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from dataclasses import dataclass, field
from datetime import datetime
from collections import Counter

logger = logging.getLogger(__name__)


# ============================================================================
# Citation data class
# ============================================================================

@dataclass
class Citation:
    """A tracked citation with full metadata

    Tracks a source used during research, including when it was accessed,
    quality assessment, and the relevant content snippet.
    """
    url: str
    title: str = ""
    source_id: str = ""
    domain: str = ""
    published_date: Optional[datetime] = None
    accessed_date: datetime = field(default_factory=datetime.now)
    quality_score: float = 0.5
    relevant_snippet: str = ""
    author: Optional[str] = None
    site_name: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Generate source_id and extract domain if not provided"""
        if not self.source_id:
            self.source_id = str(uuid.uuid4())[:8]
        if not self.domain and self.url:
            self.domain = self._extract_domain(self.url)

    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            return domain
        except Exception:
            return ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization

        Returns:
            Dict representation
        """
        return {
            "source_id": self.source_id,
            "url": self.url,
            "title": self.title,
            "domain": self.domain,
            "published_date": self.published_date.isoformat() if self.published_date else None,
            "accessed_date": self.accessed_date.isoformat(),
            "quality_score": self.quality_score,
            "relevant_snippet": self.relevant_snippet,
            "author": self.author,
            "site_name": self.site_name,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Citation":
        """Create Citation from dictionary

        Args:
            data: Dictionary with citation fields

        Returns:
            Citation instance
        """
        pub_date = None
        if data.get("published_date"):
            try:
                pub_date = datetime.fromisoformat(data["published_date"])
            except (ValueError, TypeError):
                pass

        accessed_date = datetime.now()
        if data.get("accessed_date"):
            try:
                accessed_date = datetime.fromisoformat(data["accessed_date"])
            except (ValueError, TypeError):
                pass

        return cls(
            url=data.get("url", ""),
            title=data.get("title", ""),
            source_id=data.get("source_id", ""),
            domain=data.get("domain", ""),
            published_date=pub_date,
            accessed_date=accessed_date,
            quality_score=data.get("quality_score", 0.5),
            relevant_snippet=data.get("relevant_snippet", ""),
            author=data.get("author"),
            site_name=data.get("site_name"),
            metadata=data.get("metadata", {}),
        )


# ============================================================================
# Citation Tracker
# ============================================================================

class CitationTracker:
    """Tracks all citations used during a research session

    Provides methods to add, query, and export citations with
    automatic deduplication and statistics.
    """

    def __init__(self):
        """Initialize citation tracker"""
        self._citations: List[Citation] = []
        self._url_index: Dict[str, int] = {}  # normalized_url -> index

    def add_citation(
        self,
        url: str,
        title: str = "",
        quality_score: float = 0.5,
        relevant_snippet: str = "",
        published_date: Optional[datetime] = None,
        author: Optional[str] = None,
        site_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Citation:
        """Add a citation to the tracker (deduplicates by URL)

        Args:
            url: Source URL
            title: Source title
            quality_score: Quality score 0.0-1.0
            relevant_snippet: Relevant content snippet
            published_date: Publication date
            author: Author name
            site_name: Site name
            metadata: Additional metadata

        Returns:
            Citation (new or existing)
        """
        # Check for existing citation (URL dedup)
        normalized_url = url.strip().lower()
        if normalized_url in self._url_index:
            existing_idx = self._url_index[normalized_url]
            existing = self._citations[existing_idx]
            # Update quality score if new one is provided and higher
            if quality_score and quality_score > existing.quality_score:
                existing.quality_score = quality_score
            # Update snippet if new one is longer
            if relevant_snippet and len(relevant_snippet) > len(existing.relevant_snippet):
                existing.relevant_snippet = relevant_snippet
            logger.debug(f"Citation already tracked: {url}")
            return existing

        citation = Citation(
            url=url,
            title=title,
            published_date=published_date,
            accessed_date=datetime.now(),
            quality_score=quality_score,
            relevant_snippet=relevant_snippet,
            author=author,
            site_name=site_name,
            metadata=metadata or {},
        )

        self._citations.append(citation)
        self._url_index[normalized_url] = len(self._citations) - 1
        logger.debug(f"Added citation [{citation.source_id}]: {title or url}")
        return citation

    def get_citation(self, source_id: str) -> Optional[Citation]:
        """Get citation by source ID

        Args:
            source_id: Source identifier

        Returns:
            Citation or None if not found
        """
        for citation in self._citations:
            if citation.source_id == source_id:
                return citation
        return None

    def get_citation_by_url(self, url: str) -> Optional[Citation]:
        """Get citation by URL

        Args:
            url: Source URL

        Returns:
            Citation or None
        """
        normalized = url.strip().lower()
        idx = self._url_index.get(normalized)
        if idx is not None:
            return self._citations[idx]
        return None

    def get_all_citations(self) -> List[Citation]:
        """Get all tracked citations

        Returns:
            List of all Citation objects
        """
        return list(self._citations)

    def get_citations_by_domain(self, domain: str) -> List[Citation]:
        """Get citations from a specific domain

        Args:
            domain: Domain name to filter by

        Returns:
            List of matching Citation objects
        """
        domain_lower = domain.lower()
        return [c for c in self._citations if c.domain and domain_lower in c.domain]

    def get_citations_by_quality(self, min_score: float = 0.7) -> List[Citation]:
        """Get citations above a quality threshold

        Args:
            min_score: Minimum quality score (0.0-1.0)

        Returns:
            List of high-quality Citation objects
        """
        return [c for c in self._citations if c.quality_score >= min_score]

    def get_statistics(self) -> Dict[str, Any]:
        """Get tracking statistics

        Returns:
            Dict with total count, domain distribution, avg quality, etc.
        """
        if not self._citations:
            return {
                "total_citations": 0,
                "unique_domains": 0,
                "average_quality": 0.0,
                "top_domains": {},
                "date_range": None,
            }

        domains = Counter(c.domain for c in self._citations if c.domain)
        qualities = [c.quality_score for c in self._citations]
        dates = [c.published_date for c in self._citations if c.published_date]

        return {
            "total_citations": len(self._citations),
            "unique_domains": len(domains),
            "average_quality": round(sum(qualities) / len(qualities), 3) if qualities else 0.0,
            "top_domains": dict(domains.most_common(5)),
            "date_range": {
                "earliest": min(dates).isoformat() if dates else None,
                "latest": max(dates).isoformat() if dates else None,
            },
        }

    def remove_citation(self, source_id: str) -> bool:
        """Remove a citation by source ID

        Args:
            source_id: Source identifier to remove

        Returns:
            True if removed, False if not found
        """
        for i, citation in enumerate(self._citations):
            if citation.source_id == source_id:
                self._url_index.pop(citation.url.strip().lower(), None)
                self._citations.pop(i)
                # Rebuild index
                self._url_index = {
                    c.url.strip().lower(): idx
                    for idx, c in enumerate(self._citations)
                }
                return True
        return False

    def get_citation_count(self) -> int:
        """Get total citation count

        Returns:
            Number of tracked citations
        """
        return len(self._citations)

    def clear(self) -> None:
        """Clear all tracked citations"""
        self._citations.clear()
        self._url_index.clear()

    def to_json(self) -> str:
        """Serialize all citations to JSON

        Returns:
            JSON string
        """
        data = {
            "citations": [c.to_dict() for c in self._citations],
            "statistics": self.get_statistics(),
        }
        return json.dumps(data, indent=2, ensure_ascii=False)

    @classmethod
    def from_json(cls, json_str: str) -> "CitationTracker":
        """Deserialize citations from JSON

        Args:
            json_str: JSON string from to_json()

        Returns:
            CitationTracker instance
        """
        data = json.loads(json_str)
        tracker = cls()
        for cit_data in data.get("citations", []):
            citation = Citation.from_dict(cit_data)
            tracker._citations.append(citation)
            tracker._url_index[citation.url.strip().lower()] = len(tracker._citations) - 1
        return tracker


__all__ = [
    "Citation",
    "CitationTracker",
]
