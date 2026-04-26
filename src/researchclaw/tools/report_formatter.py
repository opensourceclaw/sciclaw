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
Report Formatting Module

Generates structured research reports in multiple formats.
"""

import json
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class Source:
    """A research source"""
    url: str
    title: str
    snippet: str = ""
    content: str = ""
    author: Optional[str] = None
    date: Optional[str] = None
    site_name: Optional[str] = None
    quality_score: int = 3

    def to_citation(self, style: str = "markdown") -> str:
        """Generate citation in specified style

        Args:
            style: Citation style (markdown, apa, mla)

        Returns:
            Formatted citation string
        """
        if style == "apa":
            author = self.author or "Unknown"
            date = self.date or "n.d."
            return f"{author} ({date}). {self.title}. {self.site_name or self.url}"
        elif style == "mla":
            author = self.author or "Unknown"
            date = self.date or "n.d."
            return f'{author}. "{self.title}." {self.site_name or "Web"}. {date}.'
        else:  # markdown
            author_part = f" by {self.author}" if self.author else ""
            date_part = f" ({self.date})" if self.date else ""
            return f"[{self.title}{author_part}{date_part}]({self.url})"


@dataclass
class ReportSection:
    """A section of the report"""
    title: str
    content: str
    level: int = 2  # Heading level
    sources: List[Source] = field(default_factory=list)


@dataclass
class ResearchReport:
    """A complete research report"""
    topic: str
    summary: str = ""
    sections: List[ReportSection] = field(default_factory=list)
    sources: List[Source] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_section(self, title: str, content: str, level: int = 2) -> ReportSection:
        """Add a section to the report

        Args:
            title: Section title
            content: Section content
            level: Heading level

        Returns:
            Created section
        """
        section = ReportSection(title=title, content=content, level=level)
        self.sections.append(section)
        return section

    def add_source(self, source: Source) -> None:
        """Add a source to the report"""
        self.sources.append(source)

    def to_markdown(self, include_toc: bool = True) -> str:
        """Convert report to Markdown format

        Args:
            include_toc: Include table of contents

        Returns:
            Markdown string
        """
        lines = []

        # Title
        lines.append(f"# {self.topic}\n")

        # Metadata
        lines.append(f"**Generated**: {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        if self.metadata.get("query"):
            lines.append(f"**Query**: {self.metadata['query']}")
        lines.append("")

        # Summary
        if self.summary:
            lines.append("## Summary\n")
            lines.append(self.summary)
            lines.append("")

        # Table of contents
        if include_toc and self.sections:
            lines.append("## Table of Contents\n")
            for i, section in enumerate(self.sections, 1):
                indent = "  " * (section.level - 2)
                lines.append(f"{indent}{i}. [{section.title}](#{self._slugify(section.title)})")
            lines.append("")

        # Sections
        for section in self.sections:
            slug = self._slugify(section.title)
            lines.append(f"{'#' * section.level} {section.title} {{#{slug}}}\n")
            lines.append(section.content)
            lines.append("")

        # Sources
        if self.sources:
            lines.append("## Sources\n")
            for i, source in enumerate(self.sources, 1):
                lines.append(f"{i}. {source.to_citation()}")
            lines.append("")

        return "\n".join(lines)

    def to_html(self, include_toc: bool = True) -> str:
        """Convert report to HTML format

        Args:
            include_toc: Include table of contents

        Returns:
            HTML string
        """
        html_parts = [
            "<!DOCTYPE html>",
            "<html lang='en'>",
            "<head>",
            "  <meta charset='UTF-8'>",
            "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
            f"  <title>{self.topic}</title>",
            "  <style>",
            "    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
            "           max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }",
            "    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }",
            "    h2 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }",
            "    .metadata { color: #666; font-size: 0.9em; }",
            "    .source { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }",
            "    .toc { background: #f9f9f9; padding: 15px; border-radius: 5px; }",
            "    .toc ul { list-style: none; padding-left: 20px; }",
            "  </style>",
            "</head>",
            "<body>",
        ]

        # Title
        html_parts.append(f"  <h1>{self.topic}</h1>")
        html_parts.append(f"  <p class='metadata'>Generated: {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>")

        # Summary
        if self.summary:
            html_parts.append("  <h2>Summary</h2>")
            html_parts.append(f"  <p>{self.summary}</p>")

        # Table of contents
        if include_toc and self.sections:
            html_parts.append("  <div class='toc'>")
            html_parts.append("    <h2>Table of Contents</h2>")
            html_parts.append("    <ul>")
            for section in self.sections:
                slug = self._slugify(section.title)
                html_parts.append(f'      <li><a href="#{slug}">{section.title}</a></li>')
            html_parts.append("    </ul>")
            html_parts.append("  </div>")

        # Sections
        for section in self.sections:
            slug = self._slugify(section.title)
            html_parts.append(f"  <h{section.level} id='{slug}'>{section.title}</h{section.level}>")
            # Convert markdown-like content to HTML
            content_html = self._markdown_to_html(section.content)
            html_parts.append(f"  {content_html}")

        # Sources
        if self.sources:
            html_parts.append("  <h2>Sources</h2>")
            for i, source in enumerate(self.sources, 1):
                html_parts.append(f"  <div class='source'>")
                html_parts.append(f"    <strong>{i}. {source.title}</strong>")
                if source.author:
                    html_parts.append(f"    <br>Author: {source.author}")
                if source.date:
                    html_parts.append(f"    <br>Date: {source.date}")
                html_parts.append(f"    <br>URL: <a href='{source.url}'>{source.url}</a>")
                html_parts.append("  </div>")

        html_parts.extend(["</body>", "</html>"])
        return "\n".join(html_parts)

    def to_json(self) -> str:
        """Convert report to JSON format

        Returns:
            JSON string
        """
        data = {
            "topic": self.topic,
            "summary": self.summary,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata,
            "sections": [
                {
                    "title": s.title,
                    "content": s.content,
                    "level": s.level,
                }
                for s in self.sections
            ],
            "sources": [
                {
                    "url": src.url,
                    "title": src.title,
                    "snippet": src.snippet,
                    "author": src.author,
                    "date": src.date,
                    "site_name": src.site_name,
                    "quality_score": src.quality_score,
                }
                for src in self.sources
            ],
        }
        return json.dumps(data, indent=2, ensure_ascii=False)

    def save(self, path: str, format: str = "markdown") -> None:
        """Save report to file

        Args:
            path: Output file path
            format: Output format (markdown, html, json)
        """
        path_obj = Path(path)
        path_obj.parent.mkdir(parents=True, exist_ok=True)

        if format == "markdown":
            content = self.to_markdown()
        elif format == "html":
            content = self.to_html()
        elif format == "json":
            content = self.to_json()
        else:
            raise ValueError(f"Unsupported format: {format}")

        path_obj.write_text(content, encoding="utf-8")

    @staticmethod
    def _slugify(text: str) -> str:
        """Convert text to URL-friendly slug"""
        text = text.lower()
        text = re.sub(r"[^\w\s-]", "", text)
        text = re.sub(r"[\s_-]+", "-", text)
        text = re.sub(r"^-+|-+$", "", text)
        return text

    @staticmethod
    def _markdown_to_html(text: str) -> str:
        """Simple markdown to HTML conversion"""
        # Headers
        text = re.sub(r"^### (.+)$", r"<h3>\1</h3>", text, flags=re.MULTILINE)
        text = re.sub(r"^## (.+)$", r"<h2>\1</h2>", text, flags=re.MULTILINE)
        text = re.sub(r"^# (.+)$", r"<h1>\1</h1>", text, flags=re.MULTILINE)
        # Bold
        text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
        # Italic
        text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
        # Links
        text = re.sub(r"\[(.+?)\]\((.+?)\)", r"<a href='\2'>\1</a>", text)
        # Paragraphs
        text = re.sub(r"\n\n", "</p><p>", text)
        return f"<p>{text}</p>"


def create_report(
    topic: str,
    summary: str = "",
    sections: Optional[List[Dict[str, str]]] = None,
    sources: Optional[List[Dict[str, Any]]] = None,
) -> ResearchReport:
    """Create a research report from data

    Args:
        topic: Report topic
        summary: Executive summary
        sections: List of section dicts with title/content
        sources: List of source dicts

    Returns:
        ResearchReport instance
    """
    report = ResearchReport(topic=topic, summary=summary)

    if sections:
        for sec in sections:
            report.add_section(
                title=sec.get("title", ""),
                content=sec.get("content", ""),
                level=sec.get("level", 2),
            )

    if sources:
        for src in sources:
            report.add_source(Source(
                url=src.get("url", ""),
                title=src.get("title", ""),
                snippet=src.get("snippet", ""),
                author=src.get("author"),
                date=src.get("date"),
                site_name=src.get("site_name"),
                quality_score=src.get("quality_score", 3),
            ))

    return report


__all__ = [
    "Source",
    "ReportSection",
    "ResearchReport",
    "create_report",
]
