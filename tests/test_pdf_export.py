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
Tests for PDF Export
"""

import pytest
from pathlib import Path
from researchclaw.tools.report_formatter import Source, ResearchReport
from researchclaw.tools.pdf_export import (
    PDFStyleSettings,
    PDFHeaderSettings,
    PDFFooterSettings,
    DEFAULT_STYLE,
    APA_STYLE,
    MLA_STYLE,
    convert_markdown_to_html,
    generate_pdf_css,
    generate_full_html,
)


class TestPDFStyleSettings:
    """Test PDF style settings"""

    def test_default_style(self):
        """Test default style settings"""
        assert DEFAULT_STYLE.font_size_body == 11
        assert DEFAULT_STYLE.page_size == "A4"
        assert DEFAULT_STYLE.include_toc is True

    def test_apa_style(self):
        """Test APA style settings"""
        assert APA_STYLE.include_toc is False
        assert APA_STYLE.font_size_body == 11

    def test_mla_style(self):
        """Test MLA style settings"""
        assert MLA_STYLE.include_toc is False
        assert MLA_STYLE.font_size_body == 12


class TestMarkdownToHTML:
    """Test markdown to HTML conversion"""

    def test_headers(self):
        """Test header conversion"""
        md = "# Header 1\n## Header 2\n### Header 3"
        html = convert_markdown_to_html(md)
        assert "<h1>Header 1</h1>" in html
        assert "<h2>Header 2</h2>" in html
        assert "<h3>Header 3</h3>" in html

    def test_bold_italic(self):
        """Test bold/italic conversion"""
        md = "This is **bold** and *italic*"
        html = convert_markdown_to_html(md)
        assert "<strong>bold</strong>" in html
        assert "<em>italic</em>" in html


class TestGeneratePDFCSS:
    """Test CSS generation"""

    def test_css_generation(self):
        """Test CSS is generated"""
        css = generate_pdf_css(DEFAULT_STYLE)
        assert "body" in css
        assert "font-family" in css

    def test_custom_style(self):
        """Test custom style CSS"""
        style = PDFStyleSettings(
            font_size_body=12,
            primary_color="#FF0000",
            page_size="Letter",
        )
        css = generate_pdf_css(style)
        assert "12pt" in css
        assert "#FF0000" in css


class TestGenerateFullHTML:
    """Test full HTML generation"""

    @pytest.fixture
    def sample_report(self):
        """Create a sample report"""
        report = ResearchReport(topic="Test Report")
        report.summary = "This is a test summary."
        report.add_section("Introduction", "Intro content here.")
        report.add_section("Methods", "Methods content here.")
        report.add_source(Source(
            url="https://example.com",
            title="Source 1",
            author="John Doe",
            date="2026",
        ))
        return report

    def test_generate_html_with_toc(self, sample_report):
        """Test HTML generation with TOC"""
        html = generate_full_html(sample_report, DEFAULT_STYLE, include_toc=True)
        assert "<h1>Test Report</h1>" in html
        assert "Table of Contents" in html
        assert "Introduction" in html

    def test_generate_html_without_toc(self, sample_report):
        """Test HTML generation without TOC"""
        html = generate_full_html(sample_report, APA_STYLE, include_toc=False)
        assert "<h1>Test Report</h1>" in html
        assert "Table of Contents" not in html

    def test_generate_html_with_citations(self, sample_report):
        """Test HTML with formatted citations"""
        style = PDFStyleSettings(source_format="numbered")
        html = generate_full_html(sample_report, style)
        assert "References" in html
        assert "[1]" in html


class TestPDFStyleSettingsClasses:
    """Test PDF header/footer settings"""

    def test_header_defaults(self):
        """Test header default settings"""
        header = PDFHeaderSettings()
        assert header.include_title is True
        assert header.font_size == 12

    def test_footer_defaults(self):
        """Test footer default settings"""
        footer = PDFFooterSettings()
        assert footer.include_page_numbers is True
        assert footer.font_size == 10
