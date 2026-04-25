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
Research Synthesizer - Synthesizes research findings
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ResearchSection:
    """A section of synthesized research"""
    title: str
    content: str
    sources: List[str] = field(default_factory=list)
    confidence: float = 0.0


@dataclass
class ResearchReport:
    """Complete research report"""
    topic: str
    sections: List[ResearchSection] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    version: str = "0.1.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "sections": [
                {
                    "title": s.title,
                    "content": s.content,
                    "sources": s.sources,
                    "confidence": s.confidence,
                }
                for s in self.sections
            ],
            "created_at": self.created_at.isoformat(),
            "version": self.version,
        }


class ResearchSynthesizer:
    """Synthesizes research findings into reports"""

    def __init__(self):
        self.templates = self._load_templates()

    def synthesize(
        self,
        topic: str,
        findings: List[Dict[str, Any]]
    ) -> ResearchReport:
        """Synthesize findings into a report

        Args:
            topic: Research topic
            findings: List of research findings

        Returns:
            ResearchReport: Synthesized report
        """
        report = ResearchReport(topic=topic)

        # Group findings by theme
        themes = self._group_by_theme(findings)

        # Create sections for each theme
        for theme, theme_findings in themes.items():
            section = self._create_section(theme, theme_findings)
            report.sections.append(section)

        return report

    def _group_by_theme(
        self,
        findings: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings by theme

        Args:
            findings: Research findings

        Returns:
            Dict[str, List]: Findings grouped by theme
        """
        themes: Dict[str, List[Dict[str, Any]]] = {}

        for finding in findings:
            theme = finding.get("theme", "general")
            if theme not in themes:
                themes[theme] = []
            themes[theme].append(finding)

        return themes

    def _create_section(
        self,
        theme: str,
        findings: List[Dict[str, Any]]
    ) -> ResearchSection:
        """Create a research section

        Args:
            theme: Section theme
            findings: Findings for this theme

        Returns:
            ResearchSection: Created section
        """
        content_parts = []
        sources = []

        for finding in findings:
            content_parts.append(finding.get("content", ""))
            if "source" in finding:
                sources.append(finding["source"])

        content = "\n\n".join(content_parts)
        confidence = sum(f.get("confidence", 0.5) for f in findings) / len(findings) if findings else 0.5

        return ResearchSection(
            title=theme.title(),
            content=content,
            sources=sources,
            confidence=confidence,
        )

    def _load_templates(self) -> Dict[str, str]:
        """Load report templates"""
        return {
            "default": "## {title}\n\n{content}\n\n### Sources\n{sources}",
        }


def synthesize(topic: str, findings: List[Dict[str, Any]]) -> ResearchReport:
    """Synthesize findings into a report

    Args:
        topic: Research topic
        findings: List of research findings

    Returns:
        ResearchReport: Synthesized report
    """
    synthesizer = ResearchSynthesizer()
    return synthesizer.synthesize(topic, findings)


__all__ = ["ResearchSection", "ResearchReport", "ResearchSynthesizer", "synthesize"]
