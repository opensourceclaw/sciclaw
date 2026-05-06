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
Tests for CitationTracker module
"""

import pytest
import json
from datetime import datetime, timedelta

from deepclaw.validation.citation_tracker import (
    Citation,
    CitationTracker,
)


class TestCitation:
    """Tests for Citation data class"""

    def test_creation_defaults(self):
        cit = Citation(url="https://example.com", title="Example")
        assert cit.url == "https://example.com"
        assert cit.title == "Example"
        assert cit.source_id != ""
        assert cit.domain == "example.com"
        assert isinstance(cit.accessed_date, datetime)
        assert cit.quality_score == 0.5

    def test_auto_domain_extraction(self):
        cit = Citation(url="https://www.blog.example.com/article")
        assert cit.domain == "blog.example.com"

    def test_custom_source_id(self):
        cit = Citation(url="https://example.com", source_id="custom-id")
        assert cit.source_id == "custom-id"

    def test_to_dict(self):
        cit = Citation(
            url="https://example.com",
            title="Test Article",
            author="John Doe",
            quality_score=0.8,
        )
        d = cit.to_dict()
        assert d["url"] == "https://example.com"
        assert d["title"] == "Test Article"
        assert d["author"] == "John Doe"
        assert d["quality_score"] == 0.8
        assert "accessed_date" in d
        assert "source_id" in d

    def test_from_dict(self):
        data = {
            "url": "https://example.com",
            "title": "Test",
            "source_id": "abc123",
            "domain": "example.com",
            "published_date": "2026-01-01T00:00:00",
            "accessed_date": "2026-05-01T00:00:00",
            "quality_score": 0.7,
            "relevant_snippet": "Important content",
            "author": "Author Name",
            "site_name": "Example Site",
        }
        cit = Citation.from_dict(data)
        assert cit.url == "https://example.com"
        assert cit.title == "Test"
        assert cit.source_id == "abc123"
        assert cit.quality_score == 0.7
        assert cit.relevant_snippet == "Important content"
        assert cit.author == "Author Name"
        assert cit.published_date is not None

    def test_from_dict_missing_dates(self):
        data = {
            "url": "https://example.com",
            "title": "No Dates",
        }
        cit = Citation.from_dict(data)
        assert cit.url == "https://example.com"
        assert cit.source_id != ""

    def test_empty_url_domain(self):
        cit = Citation(url="")
        assert cit.domain == ""

    def test_relevant_snippet(self):
        cit = Citation(
            url="https://example.com",
            relevant_snippet="This is an important finding.",
        )
        assert cit.relevant_snippet == "This is an important finding."


class TestCitationTracker:
    """Tests for CitationTracker"""

    @pytest.fixture
    def tracker(self):
        return CitationTracker()

    def test_add_citation(self, tracker):
        cit = tracker.add_citation(
            url="https://example.com/article",
            title="Test Article",
            quality_score=0.8,
        )
        assert cit.title == "Test Article"
        assert tracker.get_citation_count() == 1

    def test_add_duplicate_url(self, tracker):
        cit1 = tracker.add_citation(
            url="https://example.com",
            title="First",
            quality_score=0.5,
        )
        cit2 = tracker.add_citation(
            url="https://example.com",
            title="Second",
            quality_score=0.9,
        )
        assert tracker.get_citation_count() == 1
        assert cit1.source_id == cit2.source_id
        # Quality score should be updated to higher value
        assert cit1.quality_score == 0.9

    def test_add_duplicate_snippet_update(self, tracker):
        cit1 = tracker.add_citation(
            url="https://example.com",
            relevant_snippet="Short",
        )
        cit2 = tracker.add_citation(
            url="https://example.com",
            relevant_snippet="This is a much longer snippet.",
        )
        assert cit1.relevant_snippet == "This is a much longer snippet."

    def test_get_citation(self, tracker):
        tracker.add_citation(url="https://example.com", title="Test")
        all_cits = tracker.get_all_citations()
        source_id = all_cits[0].source_id
        found = tracker.get_citation(source_id)
        assert found is not None
        assert found.title == "Test"

    def test_get_citation_not_found(self, tracker):
        assert tracker.get_citation("nonexistent") is None

    def test_get_citation_by_url(self, tracker):
        tracker.add_citation(url="https://example.com/page", title="Page")
        found = tracker.get_citation_by_url("https://example.com/page")
        assert found is not None
        assert found.title == "Page"

    def test_get_citation_by_url_not_found(self, tracker):
        assert tracker.get_citation_by_url("https://nonexistent.com") is None

    def test_get_all_citations(self, tracker):
        tracker.add_citation(url="https://a.com", title="A")
        tracker.add_citation(url="https://b.com", title="B")
        tracker.add_citation(url="https://c.com", title="C")
        assert len(tracker.get_all_citations()) == 3

    def test_get_citations_by_domain(self, tracker):
        tracker.add_citation(url="https://docs.python.org/3/tutorial")
        tracker.add_citation(url="https://docs.python.org/3/reference")
        tracker.add_citation(url="https://github.com/repo")
        py_docs = tracker.get_citations_by_domain("python.org")
        assert len(py_docs) == 2
        gh_docs = tracker.get_citations_by_domain("github.com")
        assert len(gh_docs) == 1

    def test_get_citations_by_quality(self, tracker):
        tracker.add_citation(url="https://high.com", quality_score=0.9)
        tracker.add_citation(url="https://medium.com", quality_score=0.6)
        tracker.add_citation(url="https://low.com", quality_score=0.3)
        high = tracker.get_citations_by_quality(0.7)
        assert len(high) == 1
        assert high[0].url == "https://high.com"

    def test_get_statistics(self, tracker):
        tracker.add_citation(
            url="https://a.example.com",
            quality_score=0.8,
            published_date=datetime(2026, 1, 1),
        )
        tracker.add_citation(
            url="https://b.example.com",
            quality_score=0.6,
            published_date=datetime(2025, 6, 1),
        )
        stats = tracker.get_statistics()
        assert stats["total_citations"] == 2
        assert stats["unique_domains"] == 2
        assert 0.6 <= stats["average_quality"] <= 0.8
        assert stats["date_range"]["earliest"] is not None
        assert stats["date_range"]["latest"] is not None

    def test_get_statistics_empty(self, tracker):
        stats = tracker.get_statistics()
        assert stats["total_citations"] == 0
        assert stats["average_quality"] == 0.0

    def test_remove_citation(self, tracker):
        tracker.add_citation(url="https://example.com", title="Test")
        all_cits = tracker.get_all_citations()
        source_id = all_cits[0].source_id
        assert tracker.remove_citation(source_id)
        assert tracker.get_citation_count() == 0

    def test_remove_nonexistent(self, tracker):
        assert not tracker.remove_citation("nonexistent")

    def test_remove_updates_url_index(self, tracker):
        tracker.add_citation(url="https://example.com", title="Test")
        all_cits = tracker.get_all_citations()
        tracker.remove_citation(all_cits[0].source_id)
        assert tracker.get_citation_by_url("https://example.com") is None

    def test_remove_reindex(self, tracker):
        tracker.add_citation(url="https://a.com", title="A")
        tracker.add_citation(url="https://b.com", title="B")
        tracker.add_citation(url="https://c.com", title="C")
        all_cits = tracker.get_all_citations()
        tracker.remove_citation(all_cits[0].source_id)
        assert tracker.get_citation_count() == 2
        # Verify remaining citations are still accessible
        assert tracker.get_citation_by_url("https://b.com") is not None
        assert tracker.get_citation_by_url("https://c.com") is not None

    def test_clear(self, tracker):
        tracker.add_citation(url="https://a.com")
        tracker.add_citation(url="https://b.com")
        tracker.clear()
        assert tracker.get_citation_count() == 0
        assert len(tracker.get_all_citations()) == 0

    def test_to_json(self, tracker):
        tracker.add_citation(url="https://example.com", title="Test")
        json_str = tracker.to_json()
        assert isinstance(json_str, str)
        data = json.loads(json_str)
        assert "citations" in data
        assert "statistics" in data
        assert len(data["citations"]) == 1

    def test_from_json(self, tracker):
        tracker.add_citation(
            url="https://example.com",
            title="Original",
            quality_score=0.9,
        )
        json_str = tracker.to_json()
        restored = CitationTracker.from_json(json_str)
        assert restored.get_citation_count() == 1
        restored_cit = restored.get_all_citations()[0]
        assert restored_cit.url == "https://example.com"
        assert restored_cit.title == "Original"
        assert restored_cit.quality_score == 0.9

    def test_from_json_empty(self):
        tracker = CitationTracker.from_json('{"citations":[],"statistics":{}}')
        assert tracker.get_citation_count() == 0

    def test_get_citation_count(self, tracker):
        assert tracker.get_citation_count() == 0
        tracker.add_citation(url="https://a.com")
        assert tracker.get_citation_count() == 1

    def test_accessed_date_set(self, tracker):
        before = datetime.now()
        cit = tracker.add_citation(url="https://example.com")
        after = datetime.now()
        assert before <= cit.accessed_date <= after

    def test_case_insensitive_url_dedup(self, tracker):
        tracker.add_citation(url="https://EXAMPLE.com/Page")
        tracker.add_citation(url="https://example.com/page")
        assert tracker.get_citation_count() == 1

    def test_metadata_storage(self, tracker):
        metadata = {"key": "value", "score": 42}
        cit = tracker.add_citation(
            url="https://example.com",
            metadata=metadata,
        )
        assert cit.metadata == metadata
