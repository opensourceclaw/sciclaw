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
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Bing Search Provider
"""

from typing import List, Optional
import requests
from deepclaw.search.providers.base import (
    SearchProvider,
    SearchResult,
    register_provider,
)


@register_provider("bing")
class BingSearchProvider(SearchProvider):
    """Bing search provider"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint: str = "https://api.bing.microsoft.com/v7.0/search",
        timeout: int = 30,
        **config
    ):
        """Initialize Bing provider

        Args:
            api_key: Bing API key
            endpoint: Bing search endpoint
            timeout: Request timeout in seconds
            **config: Additional configuration
        """
        super().__init__(api_key, **config)
        self.endpoint = endpoint
        self.timeout = timeout
        self._session = requests.Session()

    @property
    def name(self) -> str:
        """Provider name"""
        return "bing"

    @property
    def requires_api_key(self) -> bool:
        """Bing requires API key"""
        return True

    def validate_config(self) -> bool:
        """Validate API key is present"""
        return self.api_key is not None and len(self.api_key) > 0

    def search(self, query: str, limit: int = 10, **kwargs) -> List[SearchResult]:
        """Execute search using Bing API

        Args:
            query: Search query
            limit: Maximum results
            **kwargs: Additional parameters (mkt, safesearch, etc.)

        Returns:
            List[SearchResult]: Search results
        """
        if not self.validate_config():
            return self._mock_search(query, limit, error="API key required")

        results = []
        market = kwargs.get("mkt", "en-US")
        safesearch = kwargs.get("safesearch", "Moderate")

        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,
        }
        params = {
            "q": query,
            "count": min(limit, 50),
            "mkt": market,
            "safesearch": safesearch,
            "responseFilter": "WebPages",
        }

        try:
            response = self._session.get(
                self.endpoint,
                headers=headers,
                params=params,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()

            web_pages = data.get("webPages", {}).get("value", [])
            for i, page in enumerate(web_pages[:limit]):
                results.append(SearchResult(
                    title=page.get("name", ""),
                    url=page.get("url", ""),
                    snippet=page.get("snippet", ""),
                    score=1.0 - (i * 0.1),
                    source="Bing",
                    published_date=page.get("dateLastCrawled"),
                    metadata={
                        "display_url": page.get("displayUrl"),
                        "language": page.get("language"),
                    },
                ))

        except requests.exceptions.RequestException as e:
            print(f"Bing search error: {e}")
            return self._mock_search(query, limit, error=str(e))
        except Exception as e:
            print(f"Bing search error: {e}")
            return self._mock_search(query, limit, error=str(e))

        return results

    def _mock_search(self, query: str, limit: int, error: str = None) -> List[SearchResult]:
        """Mock search for testing/fallback

        Args:
            query: Search query
            limit: Result limit
            error: Error message if applicable

        Returns:
            List[SearchResult]: Mock results
        """
        results = []
        note = f" (API key required: {error})" if error else ""

        for i in range(min(limit, 5)):
            results.append(SearchResult(
                title=f"Bing Result {i+1}: {query}{note}",
                url=f"https://www.bing.com/search?q={query}&result={i+1}",
                snippet=f"This is a Bing result for: {query}. Configure API key to enable live results.",
                score=1.0 - (i * 0.2),
                source="Bing",
            ))
        return results


# Alias for microsoft
@register_provider("microsoft")
class MicrosoftSearchProvider(BingSearchProvider):
    """Microsoft Search (uses Bing API)"""

    @property
    def name(self) -> str:
        return "microsoft"


__all__ = ["BingSearchProvider", "MicrosoftSearchProvider"]
