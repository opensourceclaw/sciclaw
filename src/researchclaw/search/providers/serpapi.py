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
SerpAPI Search Provider
"""

from typing import List, Optional, Dict, Any
import requests
from researchclaw.search.providers.base import (
    SearchProvider,
    SearchResult,
    register_provider,
)


# Supported search engines via SerpAPI
SUPPORTED_ENGINES = ["google", "bing", "duckduckgo", "yahoo", "yandex", "baidu"]


@register_provider("serpapi")
class SerpAPISearchProvider(SearchProvider):
    """SerpAPI search provider - unified API for multiple search engines"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        engine: str = "google",
        endpoint: str = "https://serpapi.com/search",
        timeout: int = 30,
        **config
    ):
        """Initialize SerpAPI provider

        Args:
            api_key: SerpAPI API key
            engine: Search engine (google, bing, duckduckgo, etc.)
            endpoint: SerpAPI endpoint
            timeout: Request timeout in seconds
            **config: Additional configuration
        """
        super().__init__(api_key, **config)
        self.engine = engine.lower()
        self.endpoint = endpoint
        self.timeout = timeout
        self._session = requests.Session()

    @property
    def name(self) -> str:
        """Provider name"""
        return f"serpapi_{self.engine}"

    @property
    def requires_api_key(self) -> bool:
        """SerpAPI requires API key"""
        return True

    def validate_config(self) -> bool:
        """Validate API key and engine"""
        if not self.api_key:
            return False
        if self.engine not in SUPPORTED_ENGINES:
            return False
        return True

    def search(self, query: str, limit: int = 10, **kwargs) -> List[SearchResult]:
        """Execute search using SerpAPI

        Args:
            query: Search query
            limit: Maximum results
            **kwargs: Additional parameters (num, start, etc.)

        Returns:
            List[SearchResult]: Search results
        """
        if not self.validate_config():
            return self._mock_search(query, limit)

        results = []
        num = kwargs.get("num", min(limit, 10))
        start = kwargs.get("start", 0)
        gl = kwargs.get("gl", "us")
        hl = kwargs.get("hl", "en")

        params = {
            "api_key": self.api_key,
            "engine": self.engine,
            "q": query,
            "num": num,
            "start": start,
            "gl": gl,
            "hl": hl,
        }

        # Add engine-specific params
        if self.engine == "google":
            params["tbm"] = kwargs.get("tbm", "nws")  # news, images, etc.

        try:
            response = self._session.get(
                self.endpoint,
                params=params,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()

            # Parse organic results
            organic = data.get("organic_results", [])
            for i, item in enumerate(organic[:limit]):
                results.append(SearchResult(
                    title=item.get("title", ""),
                    url=item.get("link", ""),
                    snippet=item.get("snippet", ""),
                    score=1.0 - (i * 0.1),
                    source=f"SerpAPI_{self.engine.title()}",
                    published_date=item.get("date"),
                    metadata={
                        "position": item.get("position"),
                        "displayed_link": item.get("displayed_link"),
                    },
                ))

            # Also get news results if available
            if self.engine == "google" and len(results) < limit:
                news_results = data.get("news_results", [])
                for item in news_results[:limit - len(results)]:
                    results.append(SearchResult(
                        title=item.get("title", ""),
                        url=item.get("link", ""),
                        snippet=item.get("snippet", ""),
                        score=0.9,
                        source="SerpAPI_News",
                        published_date=item.get("date"),
                    ))

        except requests.exceptions.RequestException as e:
            print(f"SerpAPI search error: {e}")
            return self._mock_search(query, limit)
        except Exception as e:
            print(f"SerpAPI search error: {e}")
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
                title=f"SerpAPI ({self.engine.title()}) Result {i+1}: {query}",
                url=f"https://serpapi.com/search?q={query}&engine={self.engine}",
                snippet=f"This is a SerpAPI ({self.engine}) result for: {query}. Configure API key to enable.",
                score=1.0 - (i * 0.2),
                source=f"SerpAPI_{self.engine.title()}",
            ))
        return results

    @staticmethod
    def list_supported_engines() -> List[str]:
        """List supported search engines

        Returns:
            List[str]: Supported engine names
        """
        return SUPPORTED_ENGINES.copy()


# Convenience providers for specific engines
@register_provider("serpapi_google")
class SerpAPIGoogleProvider(SerpAPISearchProvider):
    """SerpAPI Google provider"""

    def __init__(self, api_key: Optional[str] = None, **config):
        super().__init__(api_key, engine="google", **config)

    @property
    def name(self) -> str:
        return "serpapi_google"


@register_provider("serpapi_bing")
class SerpAPIBingProvider(SerpAPISearchProvider):
    """SerpAPI Bing provider"""

    def __init__(self, api_key: Optional[str] = None, **config):
        super().__init__(api_key, engine="bing", **config)

    @property
    def name(self) -> str:
        return "serpapi_bing"


@register_provider("serpapi_duckduckgo")
class SerpAPIDuckDuckGoProvider(SerpAPISearchProvider):
    """SerpAPI DuckDuckGo provider"""

    def __init__(self, api_key: Optional[str] = None, **config):
        super().__init__(api_key, engine="duckduckgo", **config)

    @property
    def name(self) -> str:
        return "serpapi_duckduckgo"


__all__ = [
    "SerpAPISearchProvider",
    "SerpAPIGoogleProvider",
    "SerpAPIBingProvider",
    "SerpAPIDuckDuckGoProvider",
    "SUPPORTED_ENGINES",
]
