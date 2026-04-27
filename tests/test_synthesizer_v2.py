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
Tests for Research Synthesizer v2
"""

import pytest
from researchclaw.research.synthesizer_v2 import (
    Finding,
    SynthesisRequest,
    SynthesisSection,
    SynthesisResult,
    LLMSynthesizer,
    synthesize,
)


class TestFinding:
    """Test Finding class"""

    def test_creation(self):
        """Test creating a finding"""
        finding = Finding(
            content="Test content",
            source="Test Source",
            url="https://example.com",
            title="Test Title",
            author="John Doe",
            date="2026-04-26",
        )
        assert finding.content == "Test content"
        assert finding.source == "Test Source"
        assert finding.url == "https://example.com"

    def test_to_dict(self):
        """Test converting finding to dict"""
        finding = Finding(content="Test", source="Source")
        data = finding.to_dict()
        assert data["content"] == "Test"
        assert data["source"] == "Source"


class TestSynthesisRequest:
    """Test SynthesisRequest class"""

    def test_creation(self):
        """Test creating synthesis request"""
        findings = [
            Finding(content="Finding 1", source="Source 1"),
            Finding(content="Finding 2", source="Source 2"),
        ]
        request = SynthesisRequest(
            topic="Test Topic",
            findings=findings,
            max_sections=5,
            language="zh",
        )
        assert request.topic == "Test Topic"
        assert len(request.findings) == 2
        assert request.max_sections == 5
        assert request.language == "zh"


class TestSynthesisSection:
    """Test SynthesisSection class"""

    def test_creation(self):
        """Test creating synthesis section"""
        section = SynthesisSection(
            title="Test Section",
            content="Section content",
            confidence=0.8,
            key_points=["Point 1", "Point 2"],
        )
        assert section.title == "Test Section"
        assert section.confidence == 0.8
        assert len(section.key_points) == 2


class TestSynthesisResult:
    """Test SynthesisResult class"""

    def test_creation(self):
        """Test creating synthesis result"""
        result = SynthesisResult(
            topic="Test",
            summary="Summary",
            success=True,
        )
        assert result.topic == "Test"
        assert result.success is True
        assert result.version == "0.4.0"


class TestLLMSynthesizer:
    """Test LLMSynthesizer class"""

    def test_creation_without_llm(self):
        """Test creating synthesizer without LLM - auto-creates default"""
        # When no LLM engine provided, synthesizer tries to create default
        # It may succeed or fail depending on API availability
        synthesizer = LLMSynthesizer(llm_engine=None)
        assert synthesizer is not None
        # The engine may or may not be created (depends on API availability)

    def test_synthesize_empty_findings(self):
        """Test synthesizing with empty findings"""
        synthesizer = LLMSynthesizer(llm_engine=None)
        request = SynthesisRequest(topic="Test", findings=[])
        
        result = synthesizer.synthesize(request)
        
        assert result.success is True
        assert result.topic == "Test"
        assert len(result.sections) == 0

    def test_synthesize_single_finding(self):
        """Test synthesizing with single finding"""
        synthesizer = LLMSynthesizer(llm_engine=None)
        finding = Finding(
            content="This is a test finding about AI research",
            source="Test Source",
            url="https://example.com",
        )
        request = SynthesisRequest(topic="AI Research", findings=[finding])
        
        result = synthesizer.synthesize(request)
        
        assert result.success is True
        assert len(result.sections) >= 1

    def test_extract_themes_fallback(self):
        """Test fallback theme extraction"""
        synthesizer = LLMSynthesizer(llm_engine=None)
        
        findings = [
            Finding(content=f"Content about topic {i}", source=f"Source {i}")
            for i in range(5)
        ]
        
        themes = synthesizer._extract_themes_fallback(findings)
        
        assert len(themes) > 0
        assert all("name" in t for t in themes)

    def test_generate_summary_empty(self):
        """Test summary generation with no sections"""
        synthesizer = LLMSynthesizer(llm_engine=None)
        
        summary = synthesizer._generate_summary("Test", [], "en")
        
        assert "No research data" in summary


class TestSynthesizeFunction:
    """Test synthesize convenience function"""

    def test_synthesize_with_dicts(self):
        """Test synthesize with dict inputs"""
        findings = [
            {"content": "Test finding 1", "source": "Source 1"},
            {"content": "Test finding 2", "source": "Source 2"},
        ]
        
        result = synthesize("Test Topic", findings)
        
        assert result is not None
        assert result.topic == "Test Topic"
        assert result.success is True


class TestIntegration:
    """Integration tests for synthesis pipeline"""

    def test_full_pipeline(self):
        """Test complete synthesis pipeline"""
        # Create realistic findings
        findings = [
            Finding(
                content="Artificial Intelligence (AI) is transforming various industries including healthcare, finance, and transportation.",
                source="Tech Report",
                url="https://example.com/ai-1",
                title="AI Overview",
                quality_score=0.9,
            ),
            Finding(
                content="Machine learning, a subset of AI, enables systems to learn from data without explicit programming.",
                source="ML Journal",
                url="https://example.com/ml-1",
                title="Machine Learning",
                quality_score=0.85,
            ),
            Finding(
                content="Deep learning uses neural networks with multiple layers to achieve state-of-the-art results in image recognition and NLP.",
                source="Deep Learning Review",
                url="https://example.com/dl-1",
                title="Deep Learning",
                quality_score=0.9,
            ),
        ]
        
        request = SynthesisRequest(
            topic="Artificial Intelligence Trends",
            findings=findings,
            max_sections=5,
            language="en",
        )
        
        synthesizer = LLMSynthesizer(llm_engine=None)
        result = synthesizer.synthesize(request)
        
        assert result.success is True
        assert result.topic == "Artificial Intelligence Trends"
        assert len(result.sections) > 0
        
        # Check that sections have required fields
        for section in result.sections:
            assert section.title
            assert section.content
            assert 0 <= section.confidence <= 1
