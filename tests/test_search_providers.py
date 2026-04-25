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
Tests for Search Provider Base Classes
"""

import pytest
from typing import List
from researchclaw.search.providers.base import (
    SearchResult,
    SearchProvider,
    SearchProviderRegistry,
    register_provider,
)


class MockSearchProvider(SearchProvider):
    """Mock search provider for testing"""

    @property
    def name(self) -> str:
        return "mock"

    @property
    def requires_api_key(self) -> bool:
        return False

    def search(self, query: str, limit: int = 10, **kwargs) -> List[SearchResult]:
        results = []
        for i in range(min(limit, 5)):
            results.append(SearchResult(
                title=f"Result {i+1} for {query}",
                url=f"https://example.com/{i+1}",
                snippet=f"This is result {i+1}",
                score=1.0 - (i * 0.2),
                source="mock",
            ))
        return results


class TestSearchResult:
    """Test SearchResult dataclass"""

    def test_creation(self):
        """Test SearchResult creation"""
        result = SearchResult(
            title="Test Title",
            url="https://example.com",
            snippet="Test snippet",
            score=0.9,
            source="test",
        )
        assert result.title == "Test Title"
        assert result.url == "https://example.com"
        assert result.score == 0.9
        assert result.source == "test"

    def test_to_dict(self):
        """Test to_dict method"""
        result = SearchResult(
            title="Test",
            url="https://example.com",
            snippet="Test",
        )
        d = result.to_dict()
        assert d["title"] == "Test"
        assert "timestamp" in d


class TestSearchProvider:
    """Test SearchProvider base class"""

    def test_mock_provider(self):
        """Test mock provider"""
        provider = MockSearchProvider()
        assert provider.name == "mock"
        assert provider.requires_api_key is False
        assert provider.validate_config() is True

    def test_search(self):
        """Test mock search"""
        provider = MockSearchProvider()
        results = provider.search("test query", limit=3)
        assert len(results) == 3
        assert all(isinstance(r, SearchResult) for r in results)


class TestSearchProviderRegistry:
    """Test SearchProviderRegistry"""

    def test_register(self):
        """Test provider registration"""
        SearchProviderRegistry.register("test_provider", MockSearchProvider)
        assert SearchProviderRegistry.get("test_provider") == MockSearchProvider

    def test_register_decorator(self):
        """Test register decorator"""
        @register_provider("decorator_test")
        class DecoratorTestProvider(SearchProvider):
            @property
            def name(self) -> str:
                return "decorator_test"

            @property
            def requires_api_key(self) -> bool:
                return False

            def search(self, query: str, limit: int = 10, **kwargs) -> List[SearchResult]:
                return []

        assert SearchProviderRegistry.get("decorator_test") == DecoratorTestProvider

    def test_list_providers(self):
        """Test list providers"""
        SearchProviderRegistry.register("list_test", MockSearchProvider)
        providers = SearchProviderRegistry.list_providers()
        assert "list_test" in providers

    def test_create(self):
        """Test create provider"""
        SearchProviderRegistry.register("create_test", MockSearchProvider)
        provider = SearchProviderRegistry.create("create_test")
        assert isinstance(provider, MockSearchProvider)

    def test_create_nonexistent(self):
        """Test create nonexistent provider"""
        provider = SearchProviderRegistry.create("nonexistent")
        assert provider is None
