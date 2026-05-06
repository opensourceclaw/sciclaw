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
AI-Driven Report Generator - Generates formatted research reports
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import json
import re
import html
import logging

from deepclaw.research.synthesizer_v2 import (
    SynthesisResult,
    SynthesisSection,
    Finding,
)
from deepclaw.research.smart_sectioning import (
    SmartSectioner,
    SectionCandidate,
)

logger = logging.getLogger(__name__)


@dataclass
class ReportConfig:
    """Configuration for report generation"""
    format: str = "markdown"  # markdown, html, json, pdf
    include_toc: bool = True
    include_summary: bool = True
    include_sources: bool = True
    citation_style: str = "markdown"  # markdown, apa, mla, chicago
    language: str = "en"  # en, zh
    theme: str = "default"  # default, academic, modern
    max_sections: int = 20
    max_sources: int = 50
    citation_tracker: Optional[Any] = None  # CitationTracker from deepclaw.validation


class ReportGenerator:
    """Generates formatted research reports"""

    def __init__(self, config: Optional[ReportConfig] = None):
        """Initialize report generator
        
        Args:
            config: Report configuration
        """
        self.config = config or ReportConfig()
        self.sectioner = SmartSectioner()

    def generate(self, result: SynthesisResult) -> str:
        """Generate report from synthesis result
        
        Args:
            result: SynthesisResult from synthesizer
            
        Returns:
            Formatted report string
        """
        if not result.success:
            return self._generate_error_report(result)
        
        format_handlers = {
            "markdown": self._generate_markdown,
            "html": self._generate_html,
            "json": self._generate_json,
            "pdf": self._generate_markdown,  # PDF via markdown
        }
        
        handler = format_handlers.get(self.config.format, self._generate_markdown)
        return handler(result)

    def _generate_markdown(self, result: SynthesisResult) -> str:
        """Generate Markdown report
        
        Args:
            result: SynthesisResult
            
        Returns:
            Markdown string
        """
        lines = []
        
        # Title
        lines.append(f"# {result.topic}")
        lines.append("")
        
        # Metadata
        lines.append(f"**Generated:** {result.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"**Version:** {result.version}")
        lines.append(f"**Sections:** {len(result.sections)}")
        lines.append("")
        lines.append("---")
        lines.append("")
        
        # Executive Summary
        if self.config.include_summary and result.summary:
            lines.append("## Executive Summary")
            lines.append("")
            lines.append(result.summary)
            lines.append("")
            lines.append("---")
            lines.append("")
        
        # Table of Contents
        if self.config.include_toc and result.sections:
            lines.append("## Table of Contents")
            lines.append("")
            for i, section in enumerate(result.sections, 1):
                anchor = self._slugify(section.title)
                conf_indicator = self._confidence_indicator(section.confidence)
                lines.append(f"{i}. [{section.title}](#{anchor}) {conf_indicator}")
            lines.append("")
            lines.append("---")
            lines.append("")
        
        # Sections
        for section in result.sections:
            anchor = self._slugify(section.title)
            lines.append(f"## {section.title} {{#{anchor}}}")
            lines.append("")
            
            # Key points
            if section.key_points:
                lines.append("**Key Points:**")
                for point in section.key_points:
                    lines.append(f"- {point}")
                lines.append("")
            
            # Content
            lines.append(section.content)
            lines.append("")
            
            # Sources for this section
            if self.config.include_sources and section.sources:
                lines.append("### Sources")
                lines.append("")
                for i, source in enumerate(section.sources, 1):
                    citation = self._format_citation_with_score(source)
                    lines.append(f"{i}. {citation}")
                lines.append("")

            # Confidence
            conf_emoji = self._confidence_indicator(section.confidence)
            lines.append(f"**Confidence:** {conf_emoji} {section.confidence:.0%}")
            lines.append("")
            lines.append("---")
            lines.append("")
        
        # All Sources / References
        if self.config.include_sources:
            if self.config.citation_tracker and hasattr(self.config.citation_tracker, 'get_all_citations'):
                # Use citation tracker for references
                citations = self.config.citation_tracker.get_all_citations()
                if citations:
                    lines.append("## References")
                    lines.append("")
                    seen_urls = set()
                    for i, cit in enumerate(citations, 1):
                        if cit.url in seen_urls:
                            continue
                        seen_urls.add(cit.url)
                        ref = self._format_citation_from_tracker(cit)
                        lines.append(f"{i}. {ref}")
                    lines.append("")
            elif result.all_sources:
                lines.append("## References")
                lines.append("")
                seen_urls = set()
                for i, source in enumerate(result.all_sources, 1):
                    if source.url in seen_urls:
                        continue
                    seen_urls.add(source.url)
                    citation = self._format_citation(source)
                    lines.append(f"{i}. {citation}")
                lines.append("")
        
        # Footer
        lines.append(f"*Report generated by ResearchClaw v{result.version}*")
        
        return "\n".join(lines)

    def _generate_html(self, result: SynthesisResult) -> str:
        """Generate HTML report
        
        Args:
            result: SynthesisResult
            
        Returns:
            HTML string
        """
        html_parts = [
            "<!DOCTYPE html>",
            "<html lang='en'>",
            "<head>",
            "  <meta charset='UTF-8'>",
            "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
            f"  <title>{html.escape(result.topic)}</title>",
            "  <style>",
            self._get_html_styles(),
            "  </style>",
            "</head>",
            "<body>",
            "  <div class='container'>",
        ]
        
        # Title
        html_parts.append(f"  <h1>{html.escape(result.topic)}</h1>")
        html_parts.append(f"  <p class='metadata'>Generated: {result.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>")
        
        # Summary
        if self.config.include_summary and result.summary:
            html_parts.append("  <section class='summary'>")
            html_parts.append("    <h2>Executive Summary</h2>")
            html_parts.append(f"    <p>{html.escape(result.summary)}</p>")
            html_parts.append("  </section>")
        
        # TOC
        if self.config.include_toc and result.sections:
            html_parts.append("  <nav class='toc'>")
            html_parts.append("    <h2>Table of Contents</h2>")
            html_parts.append("    <ul>")
            for i, section in enumerate(result.sections, 1):
                anchor = self._slugify(section.title)
                html_parts.append(f'      <li><a href="#{anchor}">{section.title}</a></li>')
            html_parts.append("    </ul>")
            html_parts.append("  </nav>")
        
        # Sections
        for section in result.sections:
            anchor = self._slugify(section.title)
            html_parts.append(f"  <section id='{anchor}'>")
            html_parts.append(f"    <h2>{html.escape(section.title)}</h2>")
            
            # Key points
            if section.key_points:
                html_parts.append("    <div class='key-points'>")
                html_parts.append("      <strong>Key Points:</strong>")
                html_parts.append("      <ul>")
                for point in section.key_points:
                    html_parts.append(f"        <li>{html.escape(point)}</li>")
                html_parts.append("      </ul>")
                html_parts.append("    </div>")
            
            # Content
            content_html = self._markdown_to_html(html.escape(section.content))
            html_parts.append(f"    <div class='content'>{content_html}</div>")
            
            # Sources
            if self.config.include_sources and section.sources:
                html_parts.append("    <div class='sources'>")
                html_parts.append("      <h3>Sources</h3>")
                html_parts.append("      <ol>")
                for source in section.sources:
                    html_parts.append(f"        <li>{self._format_citation_html(source)}</li>")
                html_parts.append("      </ol>")
                html_parts.append("    </div>")
            
            # Confidence
            conf_class = "high" if section.confidence >= 0.7 else "medium" if section.confidence >= 0.4 else "low"
            html_parts.append(f"    <p class='confidence'>Confidence: <span class='badge {conf_class}'>{section.confidence:.0%}</span></p>")
            
            html_parts.append("  </section>")
        
        # References
        if self.config.include_sources and result.all_sources:
            html_parts.append("  <section class='references'>")
            html_parts.append("    <h2>References</h2>")
            html_parts.append("    <ol>")
            seen_urls = set()
            for source in result.all_sources:
                if source.url in seen_urls:
                    continue
                seen_urls.add(source.url)
                html_parts.append(f"      <li>{self._format_citation_html(source)}</li>")
            html_parts.append("    </ol>")
            html_parts.append("  </section>")
        
        # Footer
        html_parts.append(f"  <footer>Report generated by ResearchClaw v{result.version}</footer>")
        html_parts.append("  </div>")
        html_parts.extend(["</body>", "</html>"])
        
        return "\n".join(html_parts)

    def _generate_json(self, result: SynthesisResult) -> str:
        """Generate JSON report
        
        Args:
            result: SynthesisResult
            
        Returns:
            JSON string
        """
        data = {
            "topic": result.topic,
            "summary": result.summary,
            "created_at": result.created_at.isoformat(),
            "version": result.version,
            "metadata": result.metadata,
            "success": result.success,
            "error_message": result.error_message,
            "sections": [
                {
                    "title": s.title,
                    "content": s.content,
                    "confidence": s.confidence,
                    "theme": s.theme,
                    "key_points": s.key_points,
                    "sources": [
                        {
                            "title": src.title,
                            "url": src.url,
                            "author": src.author,
                            "date": src.date,
                        }
                        for src in s.sources
                    ],
                }
                for s in result.sections
            ],
            "sources": [
                {
                    "title": src.title,
                    "url": src.url,
                    "author": src.author,
                    "date": src.date,
                    "source": src.source,
                }
                for src in result.all_sources
            ],
        }
        
        return json.dumps(data, indent=2, ensure_ascii=False)

    def _generate_error_report(self, result: SynthesisResult) -> str:
        """Generate error report
        
        Args:
            result: Failed synthesis result
            
        Returns:
            Error report string
        """
        lines = [
            f"# Error: {result.topic}",
            "",
            "## Status",
            "",
            f"**Success:** ❌ Failed",
            f"**Error:** {result.error_message}",
            "",
            "---",
            "",
            "*Please check the input data and try again.*",
        ]
        return "\n".join(lines)

    def _format_citation_with_score(self, source: Any) -> str:
        """Format citation with quality score

        Args:
            source: Source object (Finding or similar)

        Returns:
            Citation string with quality indicator
        """
        citation = self._format_citation(source)
        if hasattr(source, 'quality_score') and source.quality_score:
            qs = source.quality_score
            if isinstance(qs, (int, float)):
                if qs >= 0.8:
                    indicator = " [High Quality]"
                elif qs >= 0.6:
                    indicator = " [Good]"
                elif qs >= 0.4:
                    indicator = " [Average]"
                else:
                    indicator = " [Low Quality]"
                return citation + indicator
        return citation

    def _format_citation_from_tracker(self, citation: Any) -> str:
        """Format citation from CitationTracker entry

        Args:
            citation: Citation object from CitationTracker

        Returns:
            Formatted reference string with quality info
        """
        title = citation.title or citation.url
        url = citation.url
        parts = [f"[{title}]({url})"]

        if citation.author:
            parts.append(f" by {citation.author}")

        if citation.quality_score:
            qs = citation.quality_score
            if qs >= 0.8:
                parts.append(" [High Quality]")
            elif qs >= 0.6:
                parts.append(" [Good]")
            elif qs >= 0.4:
                parts.append(" [Average]")
            else:
                parts.append(" [Low Quality]")

        if citation.domain:
            parts.append(f" ({citation.domain})")

        return "".join(parts)

    def save(self, result: SynthesisResult, path: str) -> None:
        """Save report to file
        
        Args:
            result: SynthesisResult
            path: Output file path
        """
        path_obj = Path(path)
        path_obj.parent.mkdir(parents=True, exist_ok=True)
        
        content = self.generate(result)
        path_obj.write_text(content, encoding="utf-8")
        
        logger.info(f"Report saved to {path}")

    def _format_citation(self, source: Finding) -> str:
        """Format source citation
        
        Args:
            source: Source to cite
            
        Returns:
            Formatted citation
        """
        if self.config.citation_style == "markdown":
            if source.url:
                return f"[{source.title or source.source}]({source.url})"
            return source.title or source.source
        
        elif self.config.citation_style == "apa":
            author = source.author or "Unknown"
            date = source.date or "n.d."
            title = source.title or "Untitled"
            return f"{author} ({date}). {title}. {source.url or source.source}"
        
        elif self.config.citation_style == "mla":
            author = source.author or "Unknown"
            date = source.date or "n.d."
            title = source.title or "Untitled"
            return f'{author}. "{title}." {source.source or "Web"}. {date}.'
        
        return source.title or source.source

    def _format_citation_html(self, source: Finding) -> str:
        """Format citation for HTML
        
        Args:
            source: Source to cite
            
        Returns:
            HTML-formatted citation
        """
        parts = []
        
        if source.title:
            if source.url:
                parts.append(f"<a href='{html.escape(source.url)}'>{html.escape(source.title)}</a>")
            else:
                parts.append(html.escape(source.title))
        
        if source.author:
            parts.append(f" by {html.escape(source.author)}")
        
        if source.date:
            parts.append(f" ({html.escape(source.date)})")
        
        return "".join(parts) or html.escape(source.source)

    @staticmethod
    def _slugify(text: str) -> str:
        """Convert text to URL-friendly slug"""
        text = text.lower()
        text = re.sub(r"[^\w\s-]", "", text)
        text = re.sub(r"[\s_-]+", "-", text)
        text = re.sub(r"^-+|-+$", "", text)
        return text

    @staticmethod
    def _confidence_indicator(confidence: float) -> str:
        """Get confidence indicator"""
        if confidence >= 0.8:
            return "✅"
        elif confidence >= 0.6:
            return "👍"
        elif confidence >= 0.4:
            return "🤔"
        return "⚠️"

    @staticmethod
    def _markdown_to_html(text: str) -> str:
        """Simple markdown to HTML conversion"""
        # Headers
        text = re.sub(r"^#### (.+)$", r"<h4>\1</h4>", text, flags=re.MULTILINE)
        text = re.sub(r"^### (.+)$", r"<h3>\1</h3>", text, flags=re.MULTILINE)
        text = re.sub(r"^## (.+)$", r"<h2>\1</h2>", text, flags=re.MULTILINE)
        text = re.sub(r"^# (.+)$", r"<h1>\1</h1>", text, flags=re.MULTILINE)
        
        # Bold
        text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
        
        # Italic
        text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
        
        # Links
        text = re.sub(r"\[(.+?)\]\((.+?)\)", r"<a href='\2'>\1</a>", text)
        
        # Line breaks
        text = text.replace("\n", "<br>")
        
        return f"<p>{text}</p>"

    @staticmethod
    def _get_html_styles() -> str:
        """Get CSS styles for HTML report"""
        return """
        :root {
            --primary: #2563eb;
            --secondary: #1e40af;
            --bg: #ffffff;
            --text: #1f2937;
            --muted: #6b7280;
            --border: #e5e7eb;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--text);
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: var(--bg);
        }
        
        h1 { color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 10px; }
        h2 { color: var(--secondary); margin-top: 30px; border-bottom: 1px solid var(--border); }
        h3 { color: #1e3a8a; }
        
        .metadata { color: var(--muted); font-size: 0.9em; }
        
        .summary {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .toc {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .toc ul { list-style: none; padding-left: 20px; }
        .toc li { margin: 5px 0; }
        
        .key-points {
            background: #eff6ff;
            padding: 10px 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .sources {
            font-size: 0.9em;
            color: var(--muted);
            margin-top: 15px;
        }
        
        .confidence { font-size: 0.85em; color: var(--muted); }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.85em;
        }
        
        .badge.high { background: #d1fae5; color: #065f46; }
        .badge.medium { background: #fef3c7; color: #92400e; }
        .badge.low { background: #fee2e2; color: #991b1b; }
        
        .references { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); }
        
        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
            color: var(--muted);
            font-size: 0.8em;
            text-align: center;
        }
        
        a { color: var(--primary); }
        """


def generate_report(
    result: SynthesisResult,
    format: str = "markdown",
    **options
) -> str:
    """Convenience function to generate report
    
    Args:
        result: SynthesisResult
        format: Output format
        **options: Additional options
        
    Returns:
        Formatted report string
    """
    config = ReportConfig(format=format, **options)
    generator = ReportGenerator(config)
    return generator.generate(result)


__all__ = [
    "ReportConfig",
    "ReportGenerator",
    "generate_report",
]
