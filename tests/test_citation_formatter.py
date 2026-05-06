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
Tests for citation_formatter module
"""

import pytest

from deepclaw.validation.citation_formatter import (
    CitationStyle,
    CitationFormatter,
    format_citation,
    format_bibliography,
)


# Test source data
@pytest.fixture
def complete_source():
    return {
        "url": "https://example.com/article",
        "title": "Understanding AI Systems",
        "author": "Smith, John",
        "date": "2026-03-15",
        "site_name": "Example Research Institute",
        "publisher": "Example Press",
    }


@pytest.fixture
def minimal_source():
    return {
        "url": "https://example.com",
        "title": "Minimal Article",
    }


@pytest.fixture
def multiple_sources():
    return [
        {
            "url": "https://a.com/1",
            "title": "First Article",
            "author": "Doe, Jane",
            "date": "2026-01-01",
            "site_name": "Site A",
        },
        {
            "url": "https://b.com/2",
            "title": "Second Article",
            "author": "Smith, John",
            "date": "2025-06-15",
            "site_name": "Site B",
        },
        {
            "url": "https://c.com/3",
            "title": "Third Article",
            "author": "Lee, Kim",
            "date": "2024-12-01",
            "site_name": "Site C",
        },
    ]


class TestCitationStyle:
    """Tests for CitationStyle enum"""

    def test_values(self):
        assert CitationStyle.APA.value == "apa"
        assert CitationStyle.MLA.value == "mla"
        assert CitationStyle.CHICAGO.value == "chicago"


class TestCitationFormatter:
    """Tests for CitationFormatter"""

    # ---- APA Tests ----

    def test_format_apa(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format(complete_source, CitationStyle.APA)
        assert "Smith, John" in result
        assert "2026" in result
        assert "Understanding AI Systems" in result
        assert "https://example.com/article" in result

    def test_format_apa_minimal(self, minimal_source):
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format(minimal_source, CitationStyle.APA)
        assert "Unknown" in result
        assert "Minimal Article" in result
        assert "https://example.com" in result

    def test_intext_apa_parenthetical(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format_intext(complete_source, CitationStyle.APA, "end")
        assert result.startswith("(")
        assert "Smith" in result
        assert "2026" in result

    def test_intext_apa_narrative(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format_intext(complete_source, CitationStyle.APA, "nar")
        assert "Smith (2026)" in result

    def test_intext_apa_no_author(self, minimal_source):
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format_intext(minimal_source, CitationStyle.APA, "end")
        assert "Unknown" in result

    # ---- MLA Tests ----

    def test_format_mla(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.MLA)
        result = fmtr.format(complete_source, CitationStyle.MLA)
        assert "Smith, John." in result
        assert '"Understanding AI Systems."' in result
        assert "2026" in result or "March" in result
        assert "https://example.com/article" in result

    def test_format_mla_minimal(self, minimal_source):
        fmtr = CitationFormatter(CitationStyle.MLA)
        result = fmtr.format(minimal_source, CitationStyle.MLA)
        assert '"Minimal Article."' in result
        assert "https://example.com" in result

    def test_intext_mla_parenthetical(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.MLA)
        result = fmtr.format_intext(complete_source, CitationStyle.MLA, "end")
        assert "Smith" in result
        assert result.startswith("(")

    def test_intext_mla_narrative(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.MLA)
        result = fmtr.format_intext(complete_source, CitationStyle.MLA, "nar")
        assert result == "Smith"

    # ---- Chicago Tests ----

    def test_format_chicago(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.CHICAGO)
        result = fmtr.format(complete_source, CitationStyle.CHICAGO)
        assert "Smith, John." in result
        assert '"Understanding AI Systems."' in result
        assert "Last modified" in result
        assert "https://example.com/article" in result

    def test_format_chicago_minimal(self, minimal_source):
        fmtr = CitationFormatter(CitationStyle.CHICAGO)
        result = fmtr.format(minimal_source, CitationStyle.CHICAGO)
        assert '"Minimal Article."' in result
        assert "https://example.com" in result

    def test_intext_chicago_footnote(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.CHICAGO)
        result = fmtr.format_intext(
            complete_source, CitationStyle.CHICAGO, "end", note_number=3
        )
        assert "Note 3" in result

    def test_intext_chicago_narrative(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.CHICAGO)
        result = fmtr.format_intext(complete_source, CitationStyle.CHICAGO, "nar")
        assert "Smith, John" in result

    # ---- Bibliography Tests ----

    def test_format_bibliography(self, multiple_sources):
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format_bibliography(multiple_sources, CitationStyle.APA)
        assert "## References" in result
        assert "1. " in result
        assert "2. " in result
        assert "3. " in result

    def test_format_bibliography_mla_title(self, multiple_sources):
        fmtr = CitationFormatter(CitationStyle.MLA)
        result = fmtr.format_bibliography(multiple_sources, CitationStyle.MLA)
        assert "## Works Cited" in result

    def test_format_bibliography_chicago_title(self, multiple_sources):
        fmtr = CitationFormatter(CitationStyle.CHICAGO)
        result = fmtr.format_bibliography(multiple_sources, CitationStyle.CHICAGO)
        assert "## Bibliography" in result

    def test_format_bibliography_list(self, multiple_sources):
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format_bibliography_list(multiple_sources, CitationStyle.APA)
        assert len(result) == 3
        assert all(isinstance(r, str) for r in result)

    # ---- Default style ----

    def test_default_style(self, complete_source):
        fmtr = CitationFormatter()  # default APA
        result = fmtr.format(complete_source)
        assert "Smith, John" in result
        assert "2026" in result

    def test_format_with_default_style(self, complete_source):
        fmtr = CitationFormatter(CitationStyle.MLA)
        result = fmtr.format(complete_source)  # uses default MLA
        assert '"Understanding AI Systems."' in result

    # ---- Edge cases ----

    def test_no_date(self):
        source = {"url": "https://example.com", "title": "No Date", "author": "Test"}
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format(source, CitationStyle.APA)
        assert "n.d." in result

    def test_no_title(self):
        source = {"url": "https://example.com", "author": "Test", "date": "2026-01-01"}
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format(source, CitationStyle.APA)
        assert "Untitled" in result

    def test_empty_source(self):
        source = {"url": ""}
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format(source, CitationStyle.APA)
        assert isinstance(result, str)

    def test_publisher_fallback(self):
        source = {
            "url": "https://example.com",
            "title": "Test",
            "publisher": "Test Publisher",
        }
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format(source, CitationStyle.APA)
        assert "Test Publisher" in result

    # ---- In-text edge cases ----

    def test_intext_no_author_no_date(self):
        source = {"url": "https://example.com", "title": "Test"}
        fmtr = CitationFormatter(CitationStyle.APA)
        result = fmtr.format_intext(source, CitationStyle.APA, "end")
        assert "Unknown" in result

    def test_intext_mla_no_author(self):
        source = {"url": "https://example.com"}
        fmtr = CitationFormatter(CitationStyle.MLA)
        result = fmtr.format_intext(source, CitationStyle.MLA, "nar")
        assert result == "Unknown"


class TestConvenienceFunctions:
    """Tests for module-level convenience functions"""

    def test_format_citation(self):
        source = {
            "url": "https://example.com",
            "title": "Test",
            "author": "Doe, John",
            "date": "2026-01-01",
        }
        result = format_citation(source, "apa")
        assert "Doe, John" in result

        result = format_citation(source, "mla")
        assert '"Test."' in result

        result = format_citation(source, "chicago")
        assert "Last modified" in result

    def test_format_citation_default(self):
        source = {"url": "https://example.com", "title": "Test"}
        result = format_citation(source, "unknown_style")
        assert isinstance(result, str)

    def test_format_bibliography(self):
        sources = [
            {"url": "https://a.com", "title": "A", "date": "2026-01-01"},
            {"url": "https://b.com", "title": "B", "date": "2025-01-01"},
        ]
        result = format_bibliography(sources, "apa")
        assert "## References" in result
        assert "1. " in result
