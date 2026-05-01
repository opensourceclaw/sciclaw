# Copyright 2026 Peter Cheng
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
DuckDuckGo Search Provider
"""

from typing import List, Optional
from deepclaw.search.providers.base import (
    SearchProvider,
    SearchResult,
    register_provider,
)

try:
    from ddgs import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    DDGS_AVAILABLE = False


@register_provider("duckduckgo")
class DuckDuckGoSearchProvider(SearchProvider):
    """DuckDuckGo search provider"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        region: str = "en",
        timeout: int = 30,
        **config
    ):
        """Initialize DuckDuckGo provider

        Args:
            api_key: Not required for DuckDuckGo (kept for interface)
            region: Region code (e.g., "en", "us-en", "uk")
            timeout: Request timeout in seconds
            **config: Additional configuration
        """
        super().__init__(api_key, **config)
        self.region = region
        self.timeout = timeout

    @property
    def name(self) -> str:
        """Provider name"""
        return "duckduckgo"

    @property
    def requires_api_key(self) -> bool:
        """DuckDuckGo doesn't require API key"""
        return False

    def search(self, query: str, limit: int = 10, **kwargs) -> List[SearchResult]:
        """Execute search using DuckDuckGo

        Args:
            query: Search query
            limit: Maximum results
            **kwargs: Additional parameters (region, safesearch, etc.)

        Returns:
            List[SearchResult]: Search results
        """
        if not DDGS_AVAILABLE:
            return self._mock_search(query, limit)

        results = []
        region = kwargs.get("region", self.region)
        safesearch = kwargs.get("safesearch", "Moderate")
        backend = kwargs.get("backend", "html")

        try:
            with DDGS() as ddgs:
                for r in ddgs.text(
                    query,
                    max_results=limit,
                    region=region,
                    safesearch=safesearch,
                    backend=backend,
                ):
                    results.append(SearchResult(
                        title=r.get("title", ""),
                        url=r.get("href", ""),
                        snippet=r.get("body", ""),
                        score=1.0,
                        source="DuckDuckGo",
                        published_date=r.get("date"),
                    ))
        except Exception as e:
            # Fallback to mock on error
            print(f"DuckDuckGo search error: {e}")
            return self._mock_search(query, limit)

        return results

    def _mock_search(self, query: str, limit: int) -> List[SearchResult]:
        """Mock search for testing/fallback

        Args:
            query: Search query
            limit: Result limit

        Returns:
            List[SearchResult]: Mock results
        """
        results = []
        for i in range(min(limit, 5)):
            results.append(SearchResult(
                title=f"DuckDuckGo Result {i+1}: {query}",
                url=f"https://duckduckgo.com/?q={query}&result={i+1}",
                snippet=f"This is a DuckDuckGo result for: {query}",
                score=1.0 - (i * 0.2),
                source="DuckDuckGo",
            ))
        return results


# Alias for backward compatibility
@register_provider("ddg")
class DDGSearchProvider(DuckDuckGoSearchProvider):
    """Alias for DuckDuckGo (DDG)"""

    @property
    def name(self) -> str:
        return "ddg"


__all__ = ["DuckDuckGoSearchProvider", "DDGSearchProvider"]
