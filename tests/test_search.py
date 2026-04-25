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
Tests for Search Module
"""

import pytest
from researchclaw.research.search import SearchEngine, SearchResult, search


class TestSearchResult:
    """Test SearchResult"""

    def test_creation(self):
        """Test SearchResult creation"""
        result = SearchResult(
            title="Test Title",
            url="https://example.com",
            snippet="Test snippet"
        )

        assert result.title == "Test Title"
        assert result.url == "https://example.com"
        assert result.score == 0.0

    def test_to_dict(self):
        """Test to_dict method"""
        result = SearchResult(
            title="Test",
            url="https://example.com",
            snippet="Snippet"
        )

        d = result.to_dict()
        assert d["title"] == "Test"
        assert "timestamp" in d


class TestSearchEngine:
    """Test SearchEngine"""

    @pytest.fixture
    def engine(self):
        return SearchEngine()

    def test_creation(self, engine):
        """Test SearchEngine creation"""
        assert engine is not None

    def test_search(self, engine):
        """Test search returns results"""
        results = engine.search("test query")
        assert len(results) > 0
        assert all(isinstance(r, SearchResult) for r in results)

    def test_search_with_limit(self, engine):
        """Test search with limit"""
        results = engine.search("test", limit=3)
        assert len(results) <= 3

    def test_cache(self, engine):
        """Test results are cached"""
        query = "cached query"
        results1 = engine.search(query)
        results2 = engine.search(query)

        assert results1 == results2

    def test_clear_cache(self, engine):
        """Test cache clearing"""
        engine.search("test")
        engine.clear_cache()
        assert len(engine.results_cache) == 0


class TestSearchFunction:
    """Test search function"""

    def test_search_function(self):
        """Test search function"""
        results = search("test query")
        assert len(results) > 0
