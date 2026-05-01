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

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "score": self.score,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
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
