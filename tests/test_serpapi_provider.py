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
Tests for SerpAPI Provider
"""

import pytest
from researchclaw.search.providers.serpapi import (
    SerpAPISearchProvider,
    SerpAPIGoogleProvider,
    SUPPORTED_ENGINES,
)
from researchclaw.search.providers import SearchProviderRegistry


class TestSerpAPISearchProvider:
    """Test SerpAPISearchProvider"""

    def test_creation_without_key(self):
        """Test provider creation without API key"""
        provider = SerpAPISearchProvider()
        assert provider.name == "serpapi_google"
        assert provider.requires_api_key is True
        assert provider.validate_config() is False

    def test_creation_with_key(self):
        """Test provider creation with API key"""
        provider = SerpAPISearchProvider(api_key="test_key_123", engine="bing")
        assert provider.api_key == "test_key_123"
        assert provider.engine == "bing"
        assert provider.validate_config() is True

    def test_invalid_engine(self):
        """Test invalid engine validation"""
        provider = SerpAPISearchProvider(api_key="test_key", engine="invalid")
        assert provider.validate_config() is False

    def test_search_without_key_returns_mock(self):
        """Test search without API key returns mock results"""
        provider = SerpAPISearchProvider()
        results = provider.search("test query", limit=3)
        assert len(results) > 0
        assert "SerpAPI" in results[0].source

    def test_search_with_invalid_key(self):
        """Test search with invalid API key returns mock"""
        provider = SerpAPISearchProvider(api_key="invalid")
        results = provider.search("test", limit=2)
        assert len(results) > 0

    def test_provider_registered(self):
        """Test provider is registered"""
        assert SearchProviderRegistry.get("serpapi") == SerpAPISearchProvider

    def test_specific_providers_registered(self):
        """Test specific engine providers are registered"""
        assert SearchProviderRegistry.get("serpapi_google") == SerpAPIGoogleProvider

    def test_supported_engines(self):
        """Test supported engines list"""
        assert "google" in SUPPORTED_ENGINES
        assert "bing" in SUPPORTED_ENGINES
        assert "duckduckgo" in SUPPORTED_ENGINES


class TestSerpAPIGoogleProvider:
    """Test SerpAPIGoogleProvider"""

    def test_name(self):
        """Test Google provider name"""
        provider = SerpAPIGoogleProvider(api_key="test")
        assert provider.name == "serpapi_google"

    def test_default_engine(self):
        """Test default engine is google"""
        provider = SerpAPIGoogleProvider(api_key="test")
        assert provider.engine == "google"
