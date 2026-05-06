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
Search Module - Web search functionality with multi-provider support
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime

# Import provider system
from deepclaw.search.providers import (
    SearchResult as ProviderSearchResult,
    SearchProviderRegistry,
)

# Import real web search tool (for backward compatibility)
from deepclaw.tools.web_search import WebSearchTool as RealSearchTool


@dataclass
class SearchResult:
    """Search result representation"""
    title: str
    url: str
    snippet: str
    score: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)
    source: str = ""
    quality_score: Optional[float] = None
    quality_label: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "score": self.score,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
            "quality_score": self.quality_score,
            "quality_label": self.quality_label,
        }


class SearchEngine:
    """Search engine interface with multi-provider support"""

    def __init__(self, provider: Optional[str] = None, api_key: Optional[str] = None):
        """Initialize search engine

        Args:
            provider: Provider name (default: duckduckgo)
            api_key: API key for the provider
        """
        self.results_cache: Dict[str, List[SearchResult]] = {}
        self._provider_name = provider or "duckduckgo"
        self._api_key = api_key
        self._provider = None

    @property
    def provider(self):
        """Get the current provider"""
        if self._provider is None:
            self._provider = SearchProviderRegistry.create(
                self._provider_name,
                api_key=self._api_key
            )
        return self._provider

    def set_provider(self, name: str, api_key: Optional[str] = None) -> None:
        """Set the search provider

        Args:
            name: Provider name
            api_key: API key for the provider
        """
        self._provider_name = name
        self._api_key = api_key
        self._provider = None  # Reset to force re-creation

    def search(self, query: str, limit: int = 10) -> List[SearchResult]:
        """Search for results

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            List[SearchResult]: Search results
        """
        # Check cache
        cache_key = f"{self._provider_name}:{query}"
        if cache_key in self.results_cache:
            return self.results_cache[cache_key][:limit]

        # Try provider-based search
        try:
            if self.provider:
                provider_results = self.provider.search(query, limit=limit)
                results = [
                    SearchResult(
                        title=r.title,
                        url=r.url,
                        snippet=r.snippet,
                        score=r.score,
                        source=r.source,
                    )
                    for r in provider_results
                ]
            else:
                raise Exception("No provider available")
        except Exception:
            # Fallback to legacy tool
            results = self._legacy_search(query, limit)

        self.results_cache[cache_key] = results
        return results

    def _legacy_search(self, query: str, limit: int) -> List[SearchResult]:
        """Legacy search using real search tool

        Args:
            query: Search query
            limit: Result limit

        Returns:
            List[SearchResult]: Search results
        """
        try:
            real_tool = RealSearchTool()
            real_results = real_tool.search(query, num_results=limit)
            results = [
                SearchResult(
                    title=r.title,
                    url=r.url,
                    snippet=r.snippet,
                    score=1.0 - (i * 0.1),
                    source="legacy",
                )
                for i, r in enumerate(real_results)
            ]
        except Exception:
            # Fallback to mock
            results = self._mock_search(query, limit)

        return results

    def _mock_search(self, query: str, limit: int) -> List[SearchResult]:
        """Mock search implementation

        Args:
            query: Search query
            limit: Result limit

        Returns:
            List[SearchResult]: Mock results
        """
        results = []
        for i in range(min(limit, 5)):
            results.append(SearchResult(
                title=f"Result {i+1} for {query}",
                url=f"https://example.com/{i+1}",
                snippet=f"This is a sample result for the query: {query}",
                score=1.0 - (i * 0.2),
                source="mock",
            ))
        return results

    def clear_cache(self) -> None:
        """Clear the results cache"""
        self.results_cache.clear()

    def annotate_quality(self, results: List[SearchResult]) -> List[SearchResult]:
        """Annotate search results with source quality scores

        Uses the SourceScorer from the validation package to add
        quality scores and labels to each search result.

        Args:
            results: Search results to annotate

        Returns:
            Same list with quality scores populated
        """
        try:
            from deepclaw.validation.source_scorer import SourceScorer
            scorer = SourceScorer()
            for result in results:
                if result.url:
                    source_score = scorer.score(url=result.url)
                    result.quality_score = source_score.combined_score
                    result.quality_label = self._quality_label(
                        source_score.combined_score
                    )
        except ImportError:
            pass
        return results

    @staticmethod
    def _quality_label(score: float) -> str:
        """Get human-readable quality label

        Args:
            score: Quality score 0.0-1.0

        Returns:
            Quality label string
        """
        if score >= 0.8:
            return "High Quality"
        elif score >= 0.6:
            return "Good"
        elif score >= 0.4:
            return "Average"
        else:
            return "Low Quality"

    @staticmethod
    def format_with_quality(results: List[SearchResult]) -> str:
        """Format search results with quality scores for display

        Args:
            results: Search results to format

        Returns:
            Formatted string with quality indicators
        """
        lines = []
        for i, result in enumerate(results, 1):
            quality_parts = []
            if result.quality_score is not None:
                qs = result.quality_score
                if qs >= 0.8:
                    indicator = "[High]"
                elif qs >= 0.6:
                    indicator = "[Good]"
                elif qs >= 0.4:
                    indicator = "[Avg]"
                else:
                    indicator = "[Low]"

                domain = ""
                try:
                    from urllib.parse import urlparse
                    domain = urlparse(result.url).netloc.replace("www.", "")
                except Exception:
                    pass
                quality_parts.append(f" {indicator}")

            lines.append(
                f"{i}. **{result.title}**\n"
                f"   URL: {result.url}\n"
                f"   {result.snippet}\n"
                f"   Score: {result.score:.2f}"
                f"{' ' + ' '.join(quality_parts) if quality_parts else ''}\n"
            )
        return "\n".join(lines)

    @staticmethod
    def list_providers() -> List[str]:
        """List available providers

        Returns:
            List[str]: List of provider names
        """
        return SearchProviderRegistry.list_providers()


def search(query: str, limit: int = 10) -> List[SearchResult]:
    """Search for results (legacy function)

    Args:
        query: Search query
        limit: Maximum results

    Returns:
        List[SearchResult]: Search results
    """
    engine = SearchEngine()
    return engine.search(query, limit)


__all__ = ["SearchResult", "SearchEngine", "search"]
