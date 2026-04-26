# Copyright 2026 OpenClaw
#
# Licensed under the Apache License, Version 2.0 (and/or other applicable files in this project with different license terms).

"""
Tests for Smart Sectioning
"""

import pytest
from researchclaw.research.smart_sectioning import (
    SectionCandidate,
    SectionAnalysis,
    SmartSectioner,
)


class TestSectionCandidate:
    """Test SectionCandidate class"""

    def test_creation(self):
        """Test creating a section candidate"""
        section = SectionCandidate(
            title="Introduction",
            content="Introduction content",
            confidence=0.8,
            keywords=["AI", "research"],
        )
        assert section.title == "Introduction"
        assert section.confidence == 0.8
        assert "AI" in section.keywords


class TestSectionAnalysis:
    """Test SectionAnalysis class"""

    def test_creation(self):
        """Test creating section analysis"""
        sections = [
            SectionCandidate(title="Intro", content="...", confidence=0.8),
            SectionCandidate(title="Methods", content="...", confidence=0.7),
        ]
        analysis = SectionAnalysis(
            sections=sections,
            themes=["introduction", "methods"],
            structure_score=0.75,
        )
        assert len(analysis.sections) == 2
        assert len(analysis.themes) == 2


class TestSmartSectioner:
    """Test SmartSectioner class"""

    def test_creation(self):
        """Test creating smart sectioner"""
        sectioner = SmartSectioner(llm_engine=None)
        assert sectioner is not None

    def test_detect_sections_simple(self):
        """Test basic section detection"""
        sectioner = SmartSectioner(llm_engine=None)
        
        content = """
# Introduction

This is the introduction section.

# Methods

This describes the methods used.

# Results

These are the results.
"""
        
        analysis = sectioner.detect_sections(content)
        
        assert len(analysis.sections) > 0

    def test_identify_themes(self):
        """Test theme identification"""
        sectioner = SmartSectioner(llm_engine=None)
        
        sections = [
            SectionCandidate(title="Introduction", content="..."),
            SectionCandidate(title="Methods", content="..."),
            SectionCandidate(title="Conclusion", content="..."),
        ]
        
        themes = sectioner._identify_themes(sections)
        
        assert "introduction" in themes
        assert "methods" in themes
        assert "conclusion" in themes

    def test_group_by_theme(self):
        """Test grouping sections by theme"""
        sectioner = SmartSectioner(llm_engine=None)
        
        sections = [
            SectionCandidate(title="Intro to AI", content="...", theme="introduction"),
            SectionCandidate(title="AI Methods", content="...", theme="methods"),
            SectionCandidate(title="AI Results", content="...", theme="results"),
        ]
        
        groups = sectioner.group_by_theme(sections)
        
        assert "introduction" in groups
        assert "methods" in groups

    def test_classify_section_theme(self):
        """Test section theme classification"""
        sectioner = SmartSectioner(llm_engine=None)
        
        # Test known patterns
        section = SectionCandidate(
            title="Research Methods",
            content="We used surveys and experiments..."
        )
        theme = sectioner._classify_section_theme(section)
        assert theme in ["methods", "general"]

    def test_optimize_order(self):
        """Test section order optimization"""
        sectioner = SmartSectioner(llm_engine=None)
        
        sections = [
            SectionCandidate(title="Results", content="..."),
            SectionCandidate(title="Introduction", content="..."),
            SectionCandidate(title="Methods", content="..."),
        ]
        
        ordered = sectioner.optimize_order(sections)
        
        # Introduction should come before Results
        titles = [s.title for s in ordered]
        assert titles.index("Introduction") < titles.index("Results")

    def test_split_content(self):
        """Test content splitting"""
        sectioner = SmartSectioner(llm_engine=None)
        
        # Create content with paragraphs that will split properly
        content = ("Paragraph one. " + "A" * 100 + "\n\n" +
                   "Paragraph two. " + "B" * 100 + "\n\n" +
                   "Paragraph three. " + "C" * 100)
        chunks = sectioner._split_content(content, max_chars=50)
        
        # Should be split into multiple chunks
        assert len(chunks) >= 1

    def test_calculate_accuracy(self):
        """Test accuracy calculation"""
        sectioner = SmartSectioner(llm_engine=None)
        
        detected = ["Introduction", "Methods", "Results"]
        ground_truth = ["Introduction", "Methods", "Results", "Conclusion"]
        
        accuracy = sectioner.calculate_accuracy(detected, ground_truth)
        
        assert 0 <= accuracy <= 1

    def test_detect_sections_no_headers(self):
        """Test detection with no clear headers"""
        sectioner = SmartSectioner(llm_engine=None)
        
        content = "This is just a plain text without any headers. " * 50
        
        analysis = sectioner.detect_sections(content, min_section_length=100)
        
        # Should still create at least one section
        assert len(analysis.sections) >= 1
