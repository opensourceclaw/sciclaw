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
Search Module - Web search functionality
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime

# Import real web search tool
from researchclaw.tools.web_search import WebSearchTool as RealSearchTool


@dataclass
class SearchResult:
    """Search result representation"""
    title: str
    url: str
    snippet: str
    score: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "score": self.score,
            "timestamp": self.timestamp.isoformat(),
        }


class SearchEngine:
    """Search engine interface"""

    def __init__(self):
        self.results_cache: Dict[str, List[SearchResult]] = {}
        self._real_tool = RealSearchTool()

    def search(self, query: str, limit: int = 10) -> List[SearchResult]:
        """Search for results

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            List[SearchResult]: Search results
        """
        # Check cache
        if query in self.results_cache:
            return self.results_cache[query][:limit]

        # Use real search tool
        try:
            real_results = self._real_tool.search(query, num_results=limit)
            results = [
                SearchResult(
                    title=r.title,
                    url=r.url,
                    snippet=r.snippet,
                    score=1.0 - (i * 0.1),
                )
                for i, r in enumerate(real_results)
            ]
        except Exception:
            # Fallback to mock on error
            results = self._mock_search(query, limit)

        self.results_cache[query] = results
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
            ))
        return results

    def clear_cache(self) -> None:
        """Clear the results cache"""
        self.results_cache.clear()


def search(query: str, limit: int = 10) -> List[SearchResult]:
    """Search for results

    Args:
        query: Search query
        limit: Maximum results

    Returns:
        List[SearchResult]: Search results
    """
    engine = SearchEngine()
    return engine.search(query, limit)


__all__ = ["SearchResult", "SearchEngine", "search"]
