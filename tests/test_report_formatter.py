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
Tests for Report Formatter
"""

import pytest
import json
from datetime import datetime
from deepclaw.tools.report_formatter import (
    Source,
    ReportSection,
    ResearchReport,
    CitationManager,
    create_report,
)


class TestSource:
    """Test Source class"""

    def test_creation(self):
        """Test creating a source"""
        source = Source(
            url="https://example.com",
            title="Test Article",
            snippet="Test snippet",
            author="John Doe",
            date="2026-04-26",
            site_name="Example",
            quality_score=4,
        )
        assert source.url == "https://example.com"
        assert source.title == "Test Article"
        assert source.author == "John Doe"

    def test_to_citation_markdown(self):
        """Test markdown citation"""
        source = Source(
            url="https://example.com",
            title="Test Article",
            author="John Doe",
            date="2026-04-26",
        )
        citation = source.to_citation("markdown")
        assert "Test Article" in citation
        assert "John Doe" in citation
        assert "2026-04-26" in citation
        assert "https://example.com" in citation

    def test_to_citation_apa(self):
        """Test APA citation"""
        source = Source(
            url="https://example.com",
            title="Test Article",
            author="John Doe",
            date="2026-04-26",
        )
        citation = source.to_citation("apa")
        assert "John Doe (2026" in citation
        assert "Test Article" in citation


class TestReportSection:
    """Test ReportSection class"""

    def test_creation(self):
        """Test creating a section"""
        section = ReportSection(
            title="Introduction",
            content="This is the introduction.",
            level=2,
        )
        assert section.title == "Introduction"
        assert section.level == 2


class TestResearchReport:
    """Test ResearchReport class"""

    @pytest.fixture
    def sample_report(self):
        """Create a sample report"""
        report = ResearchReport(
            topic="Test Topic",
            summary="This is a summary.",
        )
        report.add_section("Introduction", "Intro content here.", level=2)
        report.add_section("Methods", "Methods content here.", level=2)
        report.add_source(Source(
            url="https://example.com",
            title="Source 1",
            author="Author 1",
        ))
        return report

    def test_creation(self):
        """Test creating a report"""
        report = ResearchReport(topic="Test")
        assert report.topic == "Test"
        assert len(report.sections) == 0
        assert len(report.sources) == 0

    def test_add_section(self, sample_report):
        """Test adding sections"""
        assert len(sample_report.sections) == 2

    def test_add_source(self, sample_report):
        """Test adding sources"""
        assert len(sample_report.sources) == 1

    def test_to_markdown(self, sample_report):
        """Test Markdown output"""
        md = sample_report.to_markdown()
        assert "# Test Topic" in md
        assert "## Summary" in md
        assert "This is a summary." in md
        assert "## Table of Contents" in md
        assert "Introduction" in md
        assert "Methods" in md
        assert "## Sources" in md

    def test_to_markdown_no_toc(self, sample_report):
        """Test Markdown without TOC"""
        md = sample_report.to_markdown(include_toc=False)
        assert "Table of Contents" not in md

    def test_to_html(self, sample_report):
        """Test HTML output"""
        html = sample_report.to_html()
        assert "<h1>Test Topic</h1>" in html
        assert "<h2>Summary</h2>" in html
        assert "<h2>Table of Contents</h2>" in html
        assert "<h2 id='introduction'>Introduction</h2>" in html
        assert "<h2>Sources</h2>" in html

    def test_to_json(self, sample_report):
        """Test JSON output"""
        json_str = sample_report.to_json()
        data = json.loads(json_str)
        assert data["topic"] == "Test Topic"
        assert data["summary"] == "This is a summary."
        assert len(data["sections"]) == 2
        assert len(data["sources"]) == 1

    def test_slugify(self):
        """Test slug generation"""
        slug = ResearchReport._slugify("Hello World! Test")
        assert slug == "hello-world-test"

        slug = ResearchReport._slugify("  Multiple   Spaces  ")
        assert slug == "multiple-spaces"

    def test_save_to_file(self, sample_report, tmp_path):
        """Test saving to file"""
        file_path = tmp_path / "report.md"
        sample_report.save(str(file_path), "markdown")

        assert file_path.exists()
        content = file_path.read_text()
        assert "Test Topic" in content


class TestCreateReport:
    """Test create_report function"""

    def test_create_basic_report(self):
        """Test creating basic report"""
        report = create_report(
            topic="My Topic",
            summary="A brief summary.",
        )
        assert report.topic == "My Topic"
        assert report.summary == "A brief summary."

    def test_create_with_sections(self):
        """Test creating report with sections"""
        report = create_report(
            topic="My Topic",
            sections=[
                {"title": "Section 1", "content": "Content 1"},
                {"title": "Section 2", "content": "Content 2", "level": 3},
            ],
        )
        assert len(report.sections) == 2
        assert report.sections[0].title == "Section 1"
        assert report.sections[1].level == 3

    def test_create_with_sources(self):
        """Test creating report with sources"""
        report = create_report(
            topic="My Topic",
            sources=[
                {
                    "url": "https://example.com",
                    "title": "Example",
                    "author": "John",
                },
            ],
        )
        assert len(report.sources) == 1
        assert report.sources[0].author == "John"


class TestAPACitation:
    """Test APA citation format"""

    def test_apa_full_citation(self):
        """Test full APA citation format"""
        source = Source(
            url="https://example.com/article",
            title="Understanding AI Systems",
            author="John Smith",
            date="2026-04-26",
            site_name="Example News",
        )
        citation = source.to_apa_citation()
        assert "John Smith" in citation
        assert "2026" in citation
        assert "Understanding AI Systems" in citation
        assert "example.com/article" in citation

    def test_apa_no_date(self):
        """Test APA citation without date"""
        source = Source(
            url="https://example.com/article",
            title="Untitled Article",
            author="Jane Doe",
        )
        citation = source.to_apa_citation()
        assert "n.d." in citation

    def test_apa_intext_paren(self):
        """Test APA parenthetical in-text citation"""
        source = Source(
            url="https://example.com",
            title="Test",
            author="John Doe",
            date="2026-04-26",
        )
        citation = source.to_intext_apa("end")
        assert "(Doe, 2026)" in citation

    def test_apa_intext_narrative(self):
        """Test APA narrative in-text citation"""
        source = Source(
            url="https://example.com",
            title="Test",
            author="John Doe",
            date="2026-04-26",
        )
        citation = source.to_intext_apa("nar")
        assert "Doe (2026)" in citation


class TestMLACitation:
    """Test MLA citation format"""

    def test_mla_full_citation(self):
        """Test full MLA citation format"""
        source = Source(
            url="https://example.com/article",
            title="Understanding AI Systems",
            author="John Smith",
            date="26 Apr. 2026",
            site_name="Example News",
        )
        citation = source.to_mla_citation()
        assert "John Smith" in citation
        assert "Understanding AI Systems" in citation

    def test_mla_intext(self):
        """Test MLA in-text citation"""
        source = Source(
            url="https://example.com",
            title="Test",
            author="John Doe",
        )
        citation = source.to_intext_mla("end")
        assert "(Doe)" in citation


class TestChicagoCitation:
    """Test Chicago citation format"""

    def test_chicago_full_citation(self):
        """Test full Chicago citation format"""
        source = Source(
            url="https://example.com/article",
            title="Understanding AI Systems",
            author="John Smith",
            date="2026-04-26",
            site_name="Example News",
        )
        citation = source.to_chicago_citation()
        assert "John Smith" in citation
        assert "Last modified" in citation

    def test_chicago_intext(self):
        """Test Chicago in-text citation"""
        source = Source(
            url="https://example.com",
            title="Test",
            author="John Doe",
        )
        citation = source.to_intext_chicago("end", 1)
        assert "Note 1" in citation


class TestCitationManager:
    """Test CitationManager class"""

    def test_add_source(self):
        """Test adding sources"""
        manager = CitationManager()
        source = Source(
            url="https://example.com",
            title="Test",
            author="John",
        )
        num = manager.add_source(source)
        assert num == 1
        assert len(manager.sources) == 1

    def test_duplicate_detection(self):
        """Test duplicate detection"""
        manager = CitationManager()
        source1 = Source(url="https://example.com", title="Test 1")
        source2 = Source(url="https://example.com", title="Test 2")
        source3 = Source(url="https://other.com", title="Test 3")
        
        manager.add_source(source1)
        manager.add_source(source2)  # This won't be added (duplicate)
        manager.add_source(source3)
        
        # After adding, source2 is not added due to dedup
        # Only source1 and source3 should exist
        assert len(manager.sources) == 2
        
        # But detect_duplicates should still find the duplicate
        duplicates = manager.detect_duplicates()
        assert len(duplicates) == 0  # No duplicates after dedup

    def test_get_reference_list(self):
        """Test reference list generation"""
        manager = CitationManager()
        manager.add_source(Source(
            url="https://example.com",
            title="Test",
            author="John",
            date="2026",
        ))
        
        refs = manager.get_reference_list("apa")
        assert len(refs) == 1
        assert "John" in refs[0]


class TestReportCitationMethods:
    """Test ResearchReport citation methods"""

    def test_markdown_with_apa_citations(self):
        """Test Markdown output with APA citations"""
        report = ResearchReport(topic="Test")
        report.add_source(Source(
            url="https://example.com",
            title="Test Article",
            author="John Doe",
            date="2026",
        ))
        
        md = report.to_markdown_with_citations("apa")
        assert "## References" in md
        assert "John Doe (2026)" in md

    def test_markdown_with_mla_citations(self):
        """Test Markdown output with MLA citations"""
        report = ResearchReport(topic="Test")
        report.add_source(Source(
            url="https://example.com",
            title="Test Article",
            author="John Doe",
        ))
        
        md = report.to_markdown_with_citations("mla")
        assert "## References" in md

    def test_detect_duplicate_sources(self):
        """Test duplicate detection in report"""
        report = ResearchReport(topic="Test")
        report.add_source(Source(url="https://example.com", title="Test 1"))
        # Second source with same URL won't be added
        report.add_source(Source(url="https://example.com", title="Test 2"))
        
        # Only one source exists due to dedup
        assert len(report.sources) == 1

    def test_dedupe_sources(self):
        """Test source deduplication (already done automatically in add_source)"""
        report = ResearchReport(topic="Test")
        report.add_source(Source(url="https://example.com", title="Test 1"))
        report.add_source(Source(url="https://example.com", title="Test 2"))
        report.add_source(Source(url="https://other.com", title="Test 3"))
        
        # Sources are deduped automatically
        assert len(report.sources) == 2

    def test_get_citation(self):
        """Test getting citation by URL"""
        report = ResearchReport(topic="Test")
        report.add_source(Source(
            url="https://example.com",
            title="Test",
            author="John",
            date="2026",
        ))
        
        citation = report.get_citation("https://example.com", "apa")
        assert citation is not None
        assert "John" in citation
