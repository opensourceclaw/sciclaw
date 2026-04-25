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
Tests for DuckDuckGo Provider
"""

import pytest
from researchclaw.search.providers.duckduckgo import DuckDuckGoSearchProvider, DDGSearchProvider
from researchclaw.search.providers import SearchProviderRegistry


class TestDuckDuckGoSearchProvider:
    """Test DuckDuckGoSearchProvider"""

    @pytest.fixture
    def provider(self):
        return DuckDuckGoSearchProvider(region="en")

    def test_creation(self, provider):
        """Test provider creation"""
        assert provider.name == "duckduckgo"
        assert provider.requires_api_key is False
        assert provider.region == "en"

    def test_validate_config(self, provider):
        """Test config validation"""
        assert provider.validate_config() is True

    def test_search_returns_results(self, provider):
        """Test search returns results"""
        results = provider.search("test query", limit=3)
        assert len(results) > 0

    def test_search_with_limit(self, provider):
        """Test search respects limit"""
        results = provider.search("test", limit=2)
        assert len(results) <= 2

    def test_mock_fallback(self):
        """Test mock fallback when DDGS unavailable"""
        # This will use mock if DDGS is not available
        provider = DuckDuckGoSearchProvider()
        results = provider.search("test query", limit=3)
        # Should return some results (either real or mock)
        assert len(results) > 0

    def test_provider_registered(self):
        """Test provider is registered"""
        assert SearchProviderRegistry.get("duckduckgo") == DuckDuckGoSearchProvider
        assert SearchProviderRegistry.get("ddg") == DDGSearchProvider


class TestDDGSearchProvider:
    """Test DDGSearchProvider alias"""

    def test_name(self):
        """Test DDG alias name"""
        provider = DDGSearchProvider()
        assert provider.name == "ddg"
