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
Search Providers - Base classes and registry for search engine implementations
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class SearchResult:
    """Search result data class"""
    title: str
    url: str
    snippet: str
    score: float = 0.0
    source: str = ""
    published_date: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "score": self.score,
            "source": self.source,
            "published_date": self.published_date,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
        }


class SearchProvider(ABC):
    """Base class for all search providers"""

    def __init__(self, api_key: Optional[str] = None, **config):
        """Initialize search provider

        Args:
            api_key: API key for the search service
            **config: Additional provider-specific configuration
        """
        self.api_key = api_key
        self.config = config

    @abstractmethod
    def search(self, query: str, limit: int = 10, **kwargs) -> List[SearchResult]:
        """Execute search and return results

        Args:
            query: Search query string
            limit: Maximum number of results
            **kwargs: Additional provider-specific parameters

        Returns:
            List[SearchResult]: List of search results
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name

        Returns:
            str: Provider name
        """
        pass

    @property
    @abstractmethod
    def requires_api_key(self) -> bool:
        """Whether this provider requires an API key

        Returns:
            bool: True if API key is required
        """
        pass

    def validate_config(self) -> bool:
        """Validate provider configuration

        Returns:
            bool: True if configuration is valid
        """
        if self.requires_api_key and not self.api_key:
            return False
        return True


class SearchProviderRegistry:
    """Registry for search providers"""

    _providers: Dict[str, type] = {}

    @classmethod
    def register(cls, name: str, provider_class: type) -> None:
        """Register a search provider

        Args:
            name: Provider name
            provider_class: Provider class
        """
        cls._providers[name.lower()] = provider_class

    @classmethod
    def get(cls, name: str) -> Optional[type]:
        """Get provider class by name

        Args:
            name: Provider name

        Returns:
            Optional[type]: Provider class or None
        """
        return cls._providers.get(name.lower())

    @classmethod
    def list_providers(cls) -> List[str]:
        """List all registered provider names

        Returns:
            List[str]: List of provider names
        """
        return list(cls._providers.keys())

    @classmethod
    def create(cls, name: str, **kwargs) -> Optional[SearchProvider]:
        """Create a provider instance

        Args:
            name: Provider name
            **kwargs: Provider configuration

        Returns:
            Optional[SearchProvider]: Provider instance or None
        """
        provider_class = cls.get(name)
        if provider_class:
            return provider_class(**kwargs)
        return None


def register_provider(name: str):
    """Decorator to register a search provider

    Args:
        name: Provider name

    Returns:
        Decorator function
    """
    def decorator(cls: type) -> type:
        SearchProviderRegistry.register(name, cls)
        return cls
    return decorator


__all__ = [
    "SearchResult",
    "SearchProvider",
    "SearchProviderRegistry",
    "register_provider",
]
