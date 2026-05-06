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
Citation Formatting Module

Formats citations in APA 7th, MLA 9th, and Chicago 17th styles.
"""

import re
import logging
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


class CitationStyle(Enum):
    """Supported citation styles"""
    APA = "apa"
    MLA = "mla"
    CHICAGO = "chicago"


class CitationFormatter:
    """Formats citations in multiple academic styles

    Supports APA 7th Edition, MLA 9th Edition, and Chicago 17th Edition
    (Notes-Bibliography) formats for both bibliography and in-text citations.
    """

    def __init__(self, style: CitationStyle = CitationStyle.APA):
        """Initialize formatter

        Args:
            style: Default citation style
        """
        self.style = style

    def format(self, source: Dict[str, Any], style: Optional[CitationStyle] = None) -> str:
        """Format a single source as a bibliography entry

        Args:
            source: Dict with url, title, author, date, site_name, publisher, etc.
            style: Citation style (defaults to self.style)

        Returns:
            Formatted bibliography entry string
        """
        style = style or self.style

        handlers = {
            CitationStyle.APA: self._format_apa,
            CitationStyle.MLA: self._format_mla,
            CitationStyle.CHICAGO: self._format_chicago,
        }

        handler = handlers.get(style, self._format_apa)
        return handler(source)

    def format_bibliography(
        self,
        sources: List[Dict[str, Any]],
        style: Optional[CitationStyle] = None,
    ) -> str:
        """Format a complete bibliography

        Args:
            sources: List of source dicts
            style: Citation style

        Returns:
            Formatted bibliography as a string
        """
        style = style or self.style

        titles = {
            CitationStyle.APA: "References",
            CitationStyle.MLA: "Works Cited",
            CitationStyle.CHICAGO: "Bibliography",
        }

        lines = [f"## {titles.get(style, 'References')}", ""]

        for i, source in enumerate(sources, 1):
            citation = self.format(source, style)
            lines.append(f"{i}. {citation}")

        return "\n".join(lines)

    def format_bibliography_list(
        self,
        sources: List[Dict[str, Any]],
        style: Optional[CitationStyle] = None,
    ) -> List[str]:
        """Format bibliography as a list of strings

        Args:
            sources: List of source dicts
            style: Citation style

        Returns:
            List of formatted citation strings
        """
        style = style or self.style
        return [self.format(source, style) for source in sources]

    def format_intext(
        self,
        source: Dict[str, Any],
        style: Optional[CitationStyle] = None,
        position: str = "end",
        note_number: int = 1,
    ) -> str:
        """Generate in-text citation

        Args:
            source: Source dict with author, date fields
            style: Citation style
            position: "end" for parenthetical/footnote, "nar" for narrative
            note_number: Footnote number (Chicago only)

        Returns:
            In-text citation string
        """
        style = style or self.style

        handlers = {
            CitationStyle.APA: self._intext_apa,
            CitationStyle.MLA: self._intext_mla,
            CitationStyle.CHICAGO: self._intext_chicago,
        }

        handler = handlers.get(style, self._intext_apa)
        if style == CitationStyle.CHICAGO:
            return handler(source, position, note_number)
        return handler(source, position)

    # ========================================================================
    # APA 7th Edition
    # ========================================================================

    def _format_apa(self, source: Dict[str, Any]) -> str:
        """Format APA 7th Edition bibliography entry

        Format: Author, A. A. (Year). Title of work. Site Name. URL
        """
        author = source.get("author") or "Unknown"
        date = self._extract_year(source.get("date", ""))
        title = source.get("title") or "Untitled"
        site = source.get("site_name") or source.get("publisher") or ""

        parts = [f"{author} ({date}). {title}."]
        if site:
            parts.append(f" {site}.")
        parts.append(f" {source.get('url', '')}")

        return "".join(parts)

    def _intext_apa(self, source: Dict[str, Any], position: str = "end") -> str:
        """Generate APA in-text citation

        Args:
            source: Source dict
            position: "end" for parenthetical, "nar" for narrative

        Returns:
            APA in-text citation
        """
        author_name = self._extract_last_name(source.get("author", "")) or "Unknown"
        year = self._extract_year(source.get("date", ""))

        if position == "nar":
            return f"{author_name} ({year})"
        return f"({author_name}, {year})"

    # ========================================================================
    # MLA 9th Edition
    # ========================================================================

    def _format_mla(self, source: Dict[str, Any]) -> str:
        """Format MLA 9th Edition bibliography entry

        Format: Author. "Title." Site Name, Date, URL.
        """
        author = source.get("author") or "Unknown"
        title = source.get("title") or "Untitled"
        site = source.get("site_name") or source.get("publisher") or "Web"
        date = source.get("date") or "n.d."

        parts = [f'{author}. "{title}."']
        parts.append(f" {site},")
        parts.append(f" {date}.")
        parts.append(f" {source.get('url', '')}.")

        return "".join(parts)

    def _intext_mla(self, source: Dict[str, Any], position: str = "end") -> str:
        """Generate MLA in-text citation

        Args:
            source: Source dict
            position: "end" for parenthetical, "nar" for narrative

        Returns:
            MLA in-text citation
        """
        author_name = self._extract_last_name(source.get("author", "")) or "Unknown"

        if position == "nar":
            return author_name
        return f"({author_name})"

    # ========================================================================
    # Chicago 17th Edition
    # ========================================================================

    def _format_chicago(self, source: Dict[str, Any]) -> str:
        """Format Chicago 17th Edition bibliography entry

        Format: Author. "Title." Site Name. Last modified Date. URL.
        """
        author = source.get("author") or "Unknown"
        title = source.get("title") or "Untitled"
        site = source.get("site_name") or source.get("publisher") or "Web"
        date = source.get("date") or "n.d."

        parts = [f'{author}. "{title}."']
        parts.append(f" {site}.")
        parts.append(f" Last modified {date}.")
        parts.append(f" {source.get('url', '')}.")

        return "".join(parts)

    def _intext_chicago(
        self,
        source: Dict[str, Any],
        position: str = "end",
        note_number: int = 1,
    ) -> str:
        """Generate Chicago in-text citation

        Args:
            source: Source dict
            position: "end" for footnote, "nar" for narrative
            note_number: Footnote number

        Returns:
            Chicago in-text citation
        """
        author = source.get("author") or "Unknown"

        if position == "nar":
            return author
        return f"Note {note_number}."

    # ========================================================================
    # Shared utilities
    # ========================================================================

    @staticmethod
    def _extract_year(date_str: str) -> str:
        """Extract year from date string

        Args:
            date_str: Date string in any common format

        Returns:
            Year as string or "n.d."
        """
        if not date_str:
            return "n.d."
        match = re.search(r"(\d{4})", date_str)
        if match:
            return match.group(1)
        return "n.d."

    @staticmethod
    def _extract_last_name(author: str) -> Optional[str]:
        """Extract last name from author string

        Args:
            author: Author name string

        Returns:
            Last name or None
        """
        if not author:
            return None
        if "," in author:
            return author.split(",")[0].strip()
        parts = author.split()
        return parts[-1] if parts else None


# ============================================================================
# Convenience functions
# ============================================================================

def format_citation(
    source: Dict[str, Any],
    style: str = "apa",
) -> str:
    """Convenience function to format a single citation

    Args:
        source: Source dict
        style: Citation style string (apa, mla, chicago)

    Returns:
        Formatted citation string
    """
    style_map = {
        "apa": CitationStyle.APA,
        "mla": CitationStyle.MLA,
        "chicago": CitationStyle.CHICAGO,
    }
    cs = style_map.get(style.lower(), CitationStyle.APA)
    formatter = CitationFormatter(cs)
    return formatter.format(source, cs)


def format_bibliography(
    sources: List[Dict[str, Any]],
    style: str = "apa",
) -> str:
    """Convenience function to format a bibliography

    Args:
        sources: List of source dicts
        style: Citation style string

    Returns:
        Formatted bibliography string
    """
    style_map = {
        "apa": CitationStyle.APA,
        "mla": CitationStyle.MLA,
        "chicago": CitationStyle.CHICAGO,
    }
    cs = style_map.get(style.lower(), CitationStyle.APA)
    formatter = CitationFormatter(cs)
    return formatter.format_bibliography(sources, cs)


__all__ = [
    "CitationStyle",
    "CitationFormatter",
    "format_citation",
    "format_bibliography",
]
