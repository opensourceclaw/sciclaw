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
Research Synthesizer - Enhanced LLM-driven synthesis
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
import json
import html
import logging

logger = logging.getLogger(__name__)


@dataclass
class Finding:
    """A single research finding"""
    content: str
    source: str
    url: str = ""
    title: str = ""
    author: str = ""
    date: str = ""
    relevance_score: float = 1.0
    quality_score: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "source": self.source,
            "url": self.url,
            "title": self.title,
            "author": self.author,
            "date": self.date,
            "relevance_score": self.relevance_score,
            "quality_score": self.quality_score,
            "metadata": self.metadata,
        }


@dataclass
class SynthesisRequest:
    """Request for research synthesis"""
    topic: str
    findings: List[Finding]
    max_sections: int = 10
    include_sources: bool = True
    citation_style: str = "markdown"  # markdown, apa, mla, chicago
    include_summary: bool = True
    include_toc: bool = True
    language: str = "en"  # en, zh, etc.


@dataclass
class SynthesisSection:
    """A synthesized section"""
    title: str
    content: str
    sources: List[Finding] = field(default_factory=list)
    confidence: float = 0.0
    theme: str = ""
    key_points: List[str] = field(default_factory=list)


@dataclass
class SynthesisResult:
    """Result of research synthesis"""
    topic: str
    summary: str
    sections: List[SynthesisSection] = field(default_factory=list)
    all_sources: List[Finding] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    version: str = "0.4.0"
    metadata: Dict[str, Any] = field(default_factory=dict)
    success: bool = True
    error_message: str = ""


class LLMSynthesizer:
    """LLM-powered research synthesizer"""

    def __init__(
        self,
        llm_engine=None,
        max_retries: int = 3,
        timeout: int = 120,
    ):
        """Initialize synthesizer
        
        Args:
            llm_engine: LLM engine instance (optional, will create if not provided)
            max_retries: Max retries for LLM calls
            timeout: Timeout for LLM calls
        """
        self.llm_engine = llm_engine
        self.max_retries = max_retries
        self.timeout = timeout
        
        # Try to import and create LLM engine if not provided
        if self.llm_engine is None:
            try:
                from researchclaw.llm.engine import LLMEngine
                self.llm_engine = LLMEngine(provider="deepseek")
                logger.info("Created default LLM engine for synthesis")
            except Exception as e:
                logger.warning(f"Could not create LLM engine: {e}")

    def synthesize(self, request: SynthesisRequest) -> SynthesisResult:
        """Synthesize research findings into a report
        
        Args:
            request: Synthesis request
            
        Returns:
            SynthesisResult: Synthesized report
        """
        try:
            # Step 1: Theme extraction using LLM
            themes = self._extract_themes(request.topic, request.findings)
            
            # Step 2: Generate sections for each theme
            sections = []
            for theme in themes[:request.max_sections]:
                section = self._synthesize_section(
                    request.topic, theme, request.findings, request.language
                )
                if section:
                    sections.append(section)
            
            # Step 3: Generate summary
            summary = self._generate_summary(request.topic, sections, request.language)
            
            # Step 4: Collect all sources
            all_sources = list(request.findings)
            
            return SynthesisResult(
                topic=request.topic,
                summary=summary,
                sections=sections,
                all_sources=all_sources,
                success=True,
            )
            
        except Exception as e:
            logger.error(f"Synthesis error: {e}")
            return SynthesisResult(
                topic=request.topic,
                summary="",
                success=False,
                error_message=str(e),
            )

    def _extract_themes(
        self,
        topic: str,
        findings: List[Finding]
    ) -> List[Dict[str, Any]]:
        """Extract themes from findings using LLM
        
        Args:
            topic: Research topic
            findings: List of findings
            
        Returns:
            List of theme dictionaries
        """
        if not self.llm_engine:
            # Fallback to simple theme extraction
            return self._extract_themes_fallback(findings)
        
        # Prepare findings summary for LLM
        findings_text = "\n\n".join([
            f"- {f.content[:500]}" for f in findings[:20]  # Limit to 20 findings
        ])
        
        prompt = f"""Analyze the following research findings about "{topic}" and identify the main themes or topics.

Research Findings:
{findings_text}

Respond with a JSON array of themes, each with:
- "name": theme name
- "description": brief description
- "related_findings": indices of related findings (0-based)

Return ONLY valid JSON, no other text."""

        try:
            response = self.llm_engine.chat_simple(
                prompt=prompt,
                system_prompt="You are a research assistant that analyzes and categorizes information into themes. Always respond with valid JSON."
            )
            
            # Parse JSON response
            themes = json.loads(response)
            return themes if isinstance(themes, list) else []
            
        except Exception as e:
            logger.warning(f"LLM theme extraction failed: {e}")
            return self._extract_themes_fallback(findings)

    def _extract_themes_fallback(self, findings: List[Finding]) -> List[Dict[str, Any]]:
        """Fallback theme extraction without LLM
        
        Args:
            findings: List of findings
            
        Returns:
            List of themes
        """
        # Simple keyword-based grouping
        themes_dict: Dict[str, List[int]] = {}
        
        for i, finding in enumerate(findings):
            # Use first few words as simple theme
            words = finding.content.split()[:3]
            theme_key = " ".join(words).lower()
            
            if len(theme_key) < 10:
                theme_key = f"theme_{i // 3}"
            
            if theme_key not in themes_dict:
                themes_dict[theme_key] = []
            themes_dict[theme_key].append(i)
        
        return [
            {
                "name": name.replace("_", " ").title(),
                "description": f"Related findings about {name}",
                "related_findings": indices,
            }
            for name, indices in list(themes_dict.items())[:10]
        ]

    def _synthesize_section(
        self,
        topic: str,
        theme: Dict[str, Any],
        all_findings: List[Finding],
        language: str = "en"
    ) -> Optional[SynthesisSection]:
        """Synthesize content for a section
        
        Args:
            topic: Research topic
            theme: Theme information
            all_findings: All research findings
            language: Output language
            
        Returns:
            SynthesisSection or None
        """
        # Get related findings
        related_indices = theme.get("related_findings", [])
        related_findings = [all_findings[i] for i in related_indices if i < len(all_findings)]
        
        if not related_findings:
            return None
        
        if not self.llm_engine:
            # Fallback: simple concatenation
            content = "\n\n".join([f.content for f in related_findings])
            return SynthesisSection(
                title=theme.get("name", "General"),
                content=content,
                sources=related_findings,
                confidence=0.5,
                theme=theme.get("name", ""),
            )
        
        # Prepare content for LLM
        findings_content = "\n\n".join([
            f"[{i+1}] {f.content[:300]}" for i, f in enumerate(related_findings)
        ])
        
        prompt = f"""Based on the following research findings about "{theme.get('name', topic)}", 
write a coherent synthesis paragraph (200-400 words):

{findings_content}

Write in {'Chinese' if language == 'zh' else 'English'}.
Include key insights and avoid just listing information.
Respond with ONLY the synthesized content, no markdown formatting."""

        try:
            content = self.llm_engine.chat_simple(prompt=prompt)
            
            # Extract key points
            key_points = self._extract_key_points(content)
            
            return SynthesisSection(
                title=theme.get("name", "General"),
                content=content,
                sources=related_findings,
                confidence=0.7,
                theme=theme.get("name", ""),
                key_points=key_points,
            )
            
        except Exception as e:
            logger.warning(f"Section synthesis failed: {e}")
            # Fallback
            content = "\n\n".join([f.content for f in related_findings])
            return SynthesisSection(
                title=theme.get("name", "General"),
                content=content,
                sources=related_findings,
                confidence=0.4,
                theme=theme.get("name", ""),
            )

    def _extract_key_points(self, content: str) -> List[str]:
        """Extract key points from content
        
        Args:
            content: Text content
            
        Returns:
            List of key points
        """
        if not self.llm_engine:
            # Simple extraction
            sentences = content.split(". ")
            return [s.strip() + "." for s in sentences[:5] if len(s) > 20]
        
        prompt = f"""Extract 3-5 key points from the following text:

{content[:1000]}

Respond with a JSON array of strings (key points).
Return ONLY valid JSON."""

        try:
            response = self.llm_engine.chat_simple(prompt=prompt)
            points = json.loads(response)
            return points if isinstance(points, list) else []
        except:
            return []

    def _generate_summary(
        self,
        topic: str,
        sections: List[SynthesisSection],
        language: str = "en"
    ) -> str:
        """Generate executive summary
        
        Args:
            topic: Research topic
            sections: Synthesized sections
            language: Output language
            
        Returns:
            Summary text
        """
        if not sections:
            return "No research data available."
        
        if not self.llm_engine:
            # Simple summary
            return f"Research on '{topic}' covering {len(sections)} main themes: " + \
                ", ".join([s.title for s in sections[:5]])
        
        sections_summary = "\n".join([
            f"- {s.title}: {s.content[:200]}..." for s in sections[:5]
        ])
        
        prompt = f"""Create a brief executive summary (100-200 words) for a research report on "{topic}".

Topics covered:
{sections_summary}

Write in {'Chinese' if language == 'zh' else 'English'}.
Focus on the main findings and conclusions.
Respond with ONLY the summary, no markdown."""

        try:
            return self.llm_engine.chat_simple(prompt=prompt)
        except Exception as e:
            return f"Research on '{topic}' covering {len(sections)} main themes."


def synthesize(
    topic: str,
    findings: List[Dict[str, Any]],
    **options
) -> SynthesisResult:
    """Convenience function for synthesis
    
    Args:
        topic: Research topic
        findings: List of finding dicts
        **options: Additional options
        
    Returns:
        SynthesisResult
    """
    # Convert dicts to Finding objects
    finding_objects = [
        Finding(
            content=f.get("content", ""),
            source=f.get("source", ""),
            url=f.get("url", ""),
            title=f.get("title", ""),
            author=f.get("author", ""),
            date=f.get("date", ""),
            relevance_score=f.get("relevance_score", 1.0),
            quality_score=f.get("quality_score", 1.0),
        )
        for f in findings
    ]
    
    request = SynthesisRequest(
        topic=topic,
        findings=finding_objects,
        max_sections=options.get("max_sections", 10),
        language=options.get("language", "en"),
    )
    
    synthesizer = LLMSynthesizer()
    return synthesizer.synthesize(request)


__all__ = [
    "Finding",
    "SynthesisRequest", 
    "SynthesisSection",
    "SynthesisResult",
    "LLMSynthesizer",
    "synthesize",
]
