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
Research Synthesizer - Synthesizes research findings into reports
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json
import html


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
    version: str = "0.2.0"
    metadata: Dict[str, Any] = field(default_factory=dict)

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
            "metadata": self.metadata,
        }

    def to_json(self, indent: int = 2) -> str:
        """Export report as JSON"""
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    def get_executive_summary(self) -> str:
        """Generate executive summary from all sections"""
        if not self.sections:
            return "No research data available."
        
        summary_parts = [f"## Executive Summary\n\n**Topic:** {self.topic}\n"]
        summary_parts.append(f"**Date:** {self.created_at.strftime('%Y-%m-%d')}\n")
        summary_parts.append(f"**Sections:** {len(self.sections)}\n")
        
        avg_confidence = sum(s.confidence for s in self.sections) / len(self.sections)
        summary_parts.append(f"**Average Confidence:** {avg_confidence:.2f}\n\n")
        
        summary_parts.append("### Key Findings\n")
        for i, section in enumerate(self.sections[:5], 1):
            content_preview = section.content[:200].replace('\n', ' ')
            summary_parts.append(f"{i}. **{section.title}**: {content_preview}...\n")
        
        return "".join(summary_parts)

    def get_table_of_contents(self) -> str:
        """Generate table of contents"""
        if not self.sections:
            return ""
        
        toc_lines = ["## Table of Contents\n"]
        for i, section in enumerate(self.sections, 1):
            anchor = section.title.lower().replace(' ', '-').replace('.', '')
            conf_indicator = self._confidence_indicator(section.confidence)
            toc_lines.append(f"{i}. [{section.title}](#{anchor}) {conf_indicator}\n")
        
        return "".join(toc_lines)

    @staticmethod
    def _confidence_indicator(confidence: float) -> str:
        """Get confidence indicator emoji"""
        if confidence >= 0.8:
            return "✅"
        elif confidence >= 0.6:
            return "👍"
        elif confidence >= 0.4:
            return "🤔"
        else:
            return "⚠️"

    def format_markdown(self, include_toc: bool = True, include_summary: bool = True) -> str:
        """Format report as enhanced Markdown
        
        Args:
            include_toc: Include table of contents
            include_summary: Include executive summary
            
        Returns:
            str: Formatted Markdown report
        """
        lines = [
            f"# Research Report: {self.topic}",
            "",
            f"**Generated:** {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Version:** {self.version}",
            "",
            "---",
            "",
        ]
        
        if include_summary:
            lines.append(self.get_executive_summary())
            lines.append("")
            lines.append("---")
            lines.append("")
        
        if include_toc:
            lines.append(self.get_table_of_contents())
            lines.append("")
            lines.append("---")
            lines.append("")
        
        for section in self.sections:
            anchor = section.title.lower().replace(' ', '-').replace('.', '')
            lines.append(f"## {section.title} {{#{anchor}}}")
            lines.append("")
            lines.append(section.content)
            lines.append("")
            
            if section.sources:
                lines.append("### Sources")
                lines.append("")
                for i, source in enumerate(section.sources, 1):
                    lines.append(f"{i}. {source}")
                lines.append("")
            
            conf_emoji = self._confidence_indicator(section.confidence)
            lines.append(f"**Confidence:** {conf_emoji} {section.confidence:.2f}")
            lines.append("")
            lines.append("---")
            lines.append("")
        
        lines.append(f"*Report generated by ResearchClaw v{self.version}*")
        
        return "\n".join(lines)

    def format_html(self) -> str:
        """Format report as HTML"""
        html_output = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(f"Research: {self.topic}")}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
               max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }}
        h1 {{ color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }}
        h2 {{ color: #1e40af; margin-top: 30px; }}
        h3 {{ color: #1e3a8a; }}
        .metadata {{ color: #6b7280; font-size: 0.9em; }}
        .confidence {{ display: inline-block; padding: 2px 8px; border-radius: 4px; }}
        .confidence-high {{ background: #d1fae5; color: #065f46; }}
        .confidence-medium {{ background: #fef3c7; color: #92400e; }}
        .confidence-low {{ background: #fee2e2; color: #991b1b; }}
        .sources {{ font-size: 0.9em; color: #6b7280; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;
                  color: #9ca3af; font-size: 0.8em; }}
    </style>
</head>
<body>
    <h1>{html.escape(f"Research Report: {self.topic}")}</h1>
    <div class="metadata">
        <p><strong>Generated:</strong> {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p><strong>Version:</strong> {self.version}</p>
    </div>
"""
        
        # Executive Summary
        html_output += "<h2>Executive Summary</h2>\n"
        summary = self.get_executive_summary().replace('## Executive Summary\n\n', '')
        summary = summary.replace('### Key Findings\n', '<h3>Key Findings</h3>').replace('\n', '<br>')
        html_output += f"<p>{summary}</p>\n"
        
        # Sections
        for section in self.sections:
            html_output += f"<h2>{html.escape(section.title)}</h2>\n"
            content = html.escape(section.content).replace('\n\n', '</p><p>')
            html_output += f"<p>{content}</p>\n"
            
            if section.sources:
                html_output += "<h3>Sources</h3>\n<ul class='sources'>\n"
                for source in section.sources:
                    html_output += f"<li><a href='{html.escape(source)}'>{html.escape(source)}</a></li>\n"
                html_output += "</ul>\n"
            
            conf_class = "high" if section.confidence >= 0.7 else "medium" if section.confidence >= 0.4 else "low"
            html_output += f"<p>Confidence: <span class='confidence confidence-{conf_class}'>{section.confidence:.2f}</span></p>\n"
        
        html_output += f"<div class='footer'>Report generated by ResearchClaw v{self.version}</div>\n</body></html>"
        
        return html_output


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
        """Group findings by theme"""
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
        """Create a research section"""
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
