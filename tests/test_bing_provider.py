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
Tests for Bing Provider
"""

import pytest
from deepclaw.search.providers.bing import BingSearchProvider, MicrosoftSearchProvider
from deepclaw.search.providers import SearchProviderRegistry


class TestBingSearchProvider:
    """Test BingSearchProvider"""

    def test_creation_without_key(self):
        """Test provider creation without API key"""
        provider = BingSearchProvider()
        assert provider.name == "bing"
        assert provider.requires_api_key is True
        assert provider.validate_config() is False

    def test_creation_with_key(self):
        """Test provider creation with API key"""
        provider = BingSearchProvider(api_key="test_key_123")
        assert provider.api_key == "test_key_123"
        assert provider.validate_config() is True

    def test_search_without_key_returns_mock(self):
        """Test search without API key returns mock results"""
        provider = BingSearchProvider()
        results = provider.search("test query", limit=3)
        assert len(results) > 0
        assert all(r.source == "Bing" for r in results)

    def test_search_with_key(self):
        """Test search with API key (will fail with invalid key but not crash)"""
        provider = BingSearchProvider(api_key="invalid_key")
        results = provider.search("test", limit=2)
        # Should return mock results when API call fails
        assert len(results) > 0

    def test_provider_registered(self):
        """Test provider is registered"""
        assert SearchProviderRegistry.get("bing") == BingSearchProvider
        assert SearchProviderRegistry.get("microsoft") == MicrosoftSearchProvider

    def test_endpoint_configurable(self):
        """Test endpoint is configurable"""
        custom_endpoint = "https://custom.bing.com/search"
        provider = BingSearchProvider(endpoint=custom_endpoint)
        assert provider.endpoint == custom_endpoint


class TestMicrosoftSearchProvider:
    """Test MicrosoftSearchProvider alias"""

    def test_name(self):
        """Test Microsoft alias name"""
        provider = MicrosoftSearchProvider(api_key="test")
        assert provider.name == "microsoft"
