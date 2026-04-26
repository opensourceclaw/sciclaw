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
Tests for Report Generator
"""

import pytest
import json
from datetime import datetime
from researchclaw.research.report_generator import (
    ReportConfig,
    ReportGenerator,
    generate_report,
)
from researchclaw.research.synthesizer_v2 import (
    SynthesisResult,
    SynthesisSection,
    Finding,
)


class TestReportConfig:
    """Test ReportConfig class"""

    def test_creation_defaults(self):
        """Test default configuration"""
        config = ReportConfig()
        assert config.format == "markdown"
        assert config.include_toc is True
        assert config.include_summary is True
        assert config.citation_style == "markdown"

    def test_creation_custom(self):
        """Test custom configuration"""
        config = ReportConfig(
            format="html",
            include_toc=False,
            citation_style="apa",
            language="zh",
        )
        assert config.format == "html"
        assert config.include_toc is False
        assert config.citation_style == "apa"
        assert config.language == "zh"


class TestReportGenerator:
    """Test ReportGenerator class"""

    def test_creation(self):
        """Test creating report generator"""
        generator = ReportGenerator()
        assert generator is not None

    def test_generate_empty_result(self):
        """Test generating report from empty result"""
        generator = ReportGenerator()
        
        result = SynthesisResult(
            topic="Test",
            summary="",
            success=True,
        )
        
        report = generator.generate(result)
        
        assert "# Test" in report

    def test_generate_markdown(self):
        """Test Markdown generation"""
        generator = ReportGenerator(ReportConfig(format="markdown"))
        
        result = SynthesisResult(
            topic="AI Research",
            summary="This is a summary about AI.",
            sections=[
                SynthesisSection(
                    title="Introduction",
                    content="AI is transforming the world.",
                    confidence=0.8,
                    key_points=["Key point 1"],
                )
            ],
            all_sources=[
                Finding(
                    content="Source content",
                    source="Source 1",
                    url="https://example.com",
                    title="Example",
                )
            ],
            success=True,
        )
        
        report = generator.generate(result)
        
        assert "# AI Research" in report
        assert "## Executive Summary" in report
        assert "## Introduction" in report
        assert "## Table of Contents" in report

    def test_generate_html(self):
        """Test HTML generation"""
        generator = ReportGenerator(ReportConfig(format="html"))
        
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            success=True,
        )
        
        report = generator.generate(result)
        
        assert "<!DOCTYPE html>" in report
        assert "<h1>Test</h1>" in report

    def test_generate_json(self):
        """Test JSON generation"""
        generator = ReportGenerator(ReportConfig(format="json"))
        
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            sections=[
                SynthesisSection(title="Section 1", content="Content 1", confidence=0.8)
            ],
            success=True,
        )
        
        report = generator.generate(result)
        
        data = json.loads(report)
        assert data["topic"] == "Test"
        assert data["success"] is True

    def test_generate_error_report(self):
        """Test error report generation"""
        generator = ReportGenerator()
        
        result = SynthesisResult(
            topic="Test",
            summary="",
            success=False,
            error_message="Something went wrong",
        )
        
        report = generator.generate(result)
        
        assert "Error" in report
        assert "Something went wrong" in report

    def test_generate_without_toc(self):
        """Test generation without TOC"""
        generator = ReportGenerator(ReportConfig(include_toc=False))
        
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            sections=[
                SynthesisSection(title="Section 1", content="Content", confidence=0.5)
            ],
            success=True,
        )
        
        report = generator.generate(result)
        
        assert "Table of Contents" not in report

    def test_generate_without_summary(self):
        """Test generation without summary"""
        generator = ReportGenerator(ReportConfig(include_summary=False))
        
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            sections=[
                SynthesisSection(title="Section 1", content="Content", confidence=0.5)
            ],
            success=True,
        )
        
        report = generator.generate(result)
        
        assert "Executive Summary" not in report

    def test_citation_markdown(self):
        """Test Markdown citation formatting"""
        generator = ReportGenerator(ReportConfig(citation_style="markdown"))
        
        source = Finding(
            content="Source content",
            title="Test Article",
            source="Test Source",
            url="https://example.com",
            author="John Doe",
            date="2026-04-26",
        )
        
        citation = generator._format_citation(source)
        
        assert "Test Article" in citation
        assert "https://example.com" in citation

    def test_citation_apa(self):
        """Test APA citation formatting"""
        generator = ReportGenerator(ReportConfig(citation_style="apa"))
        
        source = Finding(
            content="Source content",
            title="Test Article",
            source="Test Source",
            url="https://example.com",
            author="John Doe",
            date="2026",
        )
        
        citation = generator._format_citation(source)
        
        assert "John Doe (2026)" in citation

    def test_slugify(self):
        """Test slug generation"""
        slug = ReportGenerator._slugify("Hello World! Test 123")
        assert slug == "hello-world-test-123"

    def test_confidence_indicator(self):
        """Test confidence indicators"""
        assert "✅" in ReportGenerator._confidence_indicator(0.9)
        assert "👍" in ReportGenerator._confidence_indicator(0.7)
        assert "🤔" in ReportGenerator._confidence_indicator(0.5)
        assert "⚠️" in ReportGenerator._confidence_indicator(0.2)

    def test_markdown_to_html(self):
        """Test markdown to HTML conversion"""
        md = "**Bold** and *italic* and [link](https://example.com)"
        html = ReportGenerator._markdown_to_html(md)
        
        assert "<strong>Bold</strong>" in html
        assert "<em>italic</em>" in html
        assert "<a href=" in html


class TestGenerateReportFunction:
    """Test generate_report convenience function"""

    def test_generate_report_markdown(self):
        """Test convenience function with markdown"""
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            success=True,
        )
        
        report = generate_report(result, format="markdown")
        
        assert "# Test" in report

    def test_generate_report_html(self):
        """Test convenience function with HTML"""
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            success=True,
        )
        
        report = generate_report(result, format="html")
        
        assert "<!DOCTYPE html>" in report


class TestReportWithSources:
    """Test reports with source citations"""

    def test_report_with_multiple_sources(self):
        """Test report with multiple sources"""
        generator = ReportGenerator(ReportConfig(include_sources=True))
        
        result = SynthesisResult(
            topic="Test Topic",
            summary="Summary",
            sections=[
                SynthesisSection(
                    title="Section 1",
                    content="Content",
                    confidence=0.8,
                    sources=[
                        Finding(
                            content="Content 1",
                            title="Source 1",
                            url="https://example.com/1",
                            source="Example",
                        ),
                        Finding(
                            content="Content 2",
                            title="Source 2",
                            url="https://example.com/2",
                            source="Example",
                        ),
                    ],
                )
            ],
            all_sources=[
                Finding(content="Content 1", title="Source 1", url="https://example.com/1", source="Example"),
                Finding(content="Content 2", title="Source 2", url="https://example.com/2", source="Example"),
            ],
            success=True,
        )
        
        report = generator.generate(result)
        
        assert "## References" in report
        assert "Source 1" in report
        assert "Source 2" in report

    def test_report_deduplicates_sources(self):
        """Test that duplicate sources are removed"""
        generator = ReportGenerator(ReportConfig(include_sources=True))
        
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            all_sources=[
                Finding(content="Content", title="Source", url="https://example.com", source="Example"),
                Finding(content="Content", title="Source", url="https://example.com", source="Example"),
            ],
            success=True,
        )
        
        report = generator.generate(result)
        
        # Should appear only once
        assert report.count("https://example.com") == 1
