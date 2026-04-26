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
Smart Sectioning - Automatic chapter detection and theme recognition
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class SectionCandidate:
    """A potential section detected in content"""
    title: str
    content: str
    start_position: int = 0
    end_position: int = 0
    confidence: float = 0.0
    theme: str = ""
    keywords: List[str] = field(default_factory=list)
    parent_section: Optional[str] = None


@dataclass
class SectionAnalysis:
    """Analysis result for smart sectioning"""
    sections: List[SectionCandidate]
    themes: List[str] = field(default_factory=list)
    structure_score: float = 0.0
    suggested_order: List[str] = field(default_factory=list)


class SmartSectioner:
    """Automatic section detection and theme recognition"""

    # Common research section patterns
    SECTION_PATTERNS = {
        "introduction": ["introduction", "background", "overview", "context"],
        "methods": ["method", "approach", "methodology", "research design", "procedure"],
        "results": ["result", "finding", "observation", "data", "analysis"],
        "discussion": ["discussion", "interpretation", "implication", "limitations"],
        "conclusion": ["conclusion", "summary", "takeaway", "final"],
        "references": ["reference", "bibliography", "citation", "source"],
    }

    def __init__(self, llm_engine=None):
        """Initialize smart sectioner
        
        Args:
            llm_engine: LLM engine for advanced analysis
        """
        self.llm_engine = llm_engine

    def detect_sections(
        self,
        content: str,
        min_section_length: int = 100
    ) -> SectionAnalysis:
        """Detect sections in content
        
        Args:
            content: Raw content text
            min_section_length: Minimum section length
            
        Returns:
            SectionAnalysis with detected sections
        """
        sections = []
        
        # Try LLM-based detection first
        if self.llm_engine:
            try:
                return self._detect_sections_llm(content, min_section_length)
            except Exception as e:
                logger.warning(f"LLM section detection failed: {e}")
        
        # Fallback to pattern-based detection
        return self._detect_sections_pattern(content, min_section_length)

    def _detect_sections_llm(
        self,
        content: str,
        min_section_length: int
    ) -> SectionAnalysis:
        """Detect sections using LLM
        
        Args:
            content: Raw content
            min_section_length: Minimum section length
            
        Returns:
            SectionAnalysis
        """
        import json
        
        # Split content if too long
        chunks = self._split_content(content, max_chars=4000)
        
        prompt = f"""Analyze the following text and identify the main sections/subsections.

Text:
{content[:3000]}

Respond with a JSON array of sections, each with:
- "title": section title
- "content": main content of this section (abbreviated if long)
- "confidence": how confident you are this is a real section (0-1)
- "keywords": key terms in this section
- "theme": main theme/category

Return ONLY valid JSON."""

        response = self.llm_engine.chat_simple(
            prompt=prompt,
            system_prompt="You are a document structure analyzer. Always respond with valid JSON."
        )
        
        sections_data = json.loads(response)
        
        sections = [
            SectionCandidate(
                title=s.get("title", "Untitled"),
                content=s.get("content", ""),
                confidence=s.get("confidence", 0.5),
                keywords=s.get("keywords", []),
                theme=s.get("theme", ""),
            )
            for s in sections_data
        ]
        
        # Extract unique themes
        themes = list(set(s.theme for s in sections if s.theme))
        
        return SectionAnalysis(
            sections=sections,
            themes=themes,
            structure_score=sum(s.confidence for s in sections) / max(len(sections), 1),
            suggested_order=[s.title for s in sections],
        )

    def _detect_sections_pattern(
        self,
        content: str,
        min_section_length: int
    ) -> SectionAnalysis:
        """Detect sections using pattern matching
        
        Args:
            content: Raw content
            min_section_length: Minimum section length
            
        Returns:
            SectionAnalysis
        """
        import re
        
        sections = []
        lines = content.split("\n")
        
        current_section = None
        current_content = []
        current_pos = 0
        
        # Header patterns
        header_pattern = re.compile(r"^(#{1,6})\s+(.+)$|^([A-Z][^\.]{5,50})\.\s*$", re.MULTILINE)
        
        for i, line in enumerate(lines):
            # Check for markdown headers
            header_match = header_pattern.match(line)
            
            if header_match:
                # Save previous section
                if current_section and current_content:
                    content_text = "\n".join(current_content)
                    if len(content_text) >= min_section_length:
                        current_section.content = content_text
                        current_section.end_position = current_pos
                        sections.append(current_section)
                
                # Start new section
                title = header_match.group(2) or header_match.group(3)
                current_section = SectionCandidate(
                    title=title.strip(),
                    content="",
                    start_position=current_pos,
                    confidence=0.7,
                )
                current_content = []
            
            current_pos += len(line) + 1
            if current_section:
                current_content.append(line)
        
        # Save last section
        if current_section and current_content:
            current_section.content = "\n".join(current_content)
            current_section.end_position = current_pos
            sections.append(current_section)
        
        # If no sections detected, create single section
        if not sections:
            sections.append(SectionCandidate(
                title="Overview",
                content=content,
                confidence=0.5,
            ))
        
        # Identify themes
        themes = self._identify_themes(sections)
        
        return SectionAnalysis(
            sections=sections,
            themes=themes,
            structure_score=0.6,
            suggested_order=[s.title for s in sections],
        )

    def _identify_themes(self, sections: List[SectionCandidate]) -> List[str]:
        """Identify themes from sections
        
        Args:
            sections: List of sections
            
        Returns:
            List of theme names
        """
        theme_counts: Dict[str, int] = {}
        
        for section in sections:
            # Check against known patterns
            title_lower = section.title.lower()
            
            for theme, keywords in self.SECTION_PATTERNS.items():
                if any(kw in title_lower for kw in keywords):
                    theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        # Return themes sorted by frequency
        sorted_themes = sorted(theme_counts.items(), key=lambda x: -x[1])
        return [t[0] for t in sorted_themes]

    def group_by_theme(
        self,
        sections: List[SectionCandidate]
    ) -> Dict[str, List[SectionCandidate]]:
        """Group sections by theme
        
        Args:
            sections: List of sections
            
        Returns:
            Dict mapping theme to sections
        """
        theme_groups: Dict[str, List[SectionCandidate]] = {}
        
        for section in sections:
            # Determine theme
            theme = section.theme or self._classify_section_theme(section)
            
            if theme not in theme_groups:
                theme_groups[theme] = []
            theme_groups[theme].append(section)
        
        return theme_groups

    def _classify_section_theme(self, section: SectionCandidate) -> str:
        """Classify section into a theme
        
        Args:
            section: Section to classify
            
        Returns:
            Theme name
        """
        title_lower = section.title.lower()
        content_lower = section.content.lower()[:500]
        
        # Check patterns
        for theme, keywords in self.SECTION_PATTERNS.items():
            if any(kw in title_lower for kw in keywords):
                return theme
            if any(kw in content_lower for kw in keywords):
                return theme
        
        return "general"

    def optimize_order(
        self,
        sections: List[SectionCandidate]
    ) -> List[SectionCandidate]:
        """Optimize section ordering
        
        Args:
            sections: Sections to order
            
        Returns:
            Ordered list of sections
        """
        # Standard research paper order
        preferred_order = [
            "introduction", "background", "overview",
            "methods", "methodology", "approach",
            "results", "findings", "analysis",
            "discussion", "interpretation",
            "conclusion", "summary",
        ]
        
        def get_order_score(section: SectionCandidate) -> int:
            theme = self._classify_section_theme(section)
            try:
                return preferred_order.index(theme)
            except ValueError:
                return len(preferred_order)
        
        return sorted(sections, key=get_order_score)

    def _split_content(self, content: str, max_chars: int = 4000) -> List[str]:
        """Split content into chunks
        
        Args:
            content: Content to split
            max_chars: Max chars per chunk
            
        Returns:
            List of content chunks
        """
        if len(content) <= max_chars:
            return [content]
        
        chunks = []
        paragraphs = content.split("\n\n")
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) > max_chars:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para
            else:
                current_chunk += "\n\n" + para
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks[:10]  # Limit chunks

    def calculate_accuracy(
        self,
        detected: List[SectionCandidate],
        ground_truth: List[str]
    ) -> float:
        """Calculate section detection accuracy
        
        Args:
            detected: Detected section titles
            ground_truth: Expected section titles
            
        Returns:
            Accuracy score (0-1)
        """
        if not ground_truth:
            return 0.0
        
        # Normalize titles for comparison
        def normalize(title: str) -> str:
            return title.lower().strip()
        
        detected_normalized = {normalize(t) for t in detected}
        truth_normalized = {normalize(t) for t in ground_truth}
        
        # Calculate precision and recall
        true_positives = len(detected_normalized & truth_normalized)
        precision = true_positives / len(detected_normalized) if detected_normalized else 0
        recall = true_positives / len(truth_normalized) if truth_normalized else 0
        
        # F1 score
        if precision + recall == 0:
            return 0.0
        
        f1 = 2 * (precision * recall) / (precision + recall)
        return f1


__all__ = [
    "SectionCandidate",
    "SectionAnalysis", 
    "SmartSectioner",
]
