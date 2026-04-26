# Copyright 2026 Peter Cheng
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
Data classes for summarization module
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime


class SummarizationLength(str, Enum):
    """Summarization length options"""
    SHORT = "short"       # 1-2 sentences
    MEDIUM = "medium"     # 1 paragraph
    LONG = "long"         # Multiple paragraphs


class SummarizationStyle(str, Enum):
    """Summarization style options"""
    CONCISE = "concise"       # Bullet points, minimal words
    DETAILED = "detailed"     # Full sentences, comprehensive
    TECHNICAL = "technical"   # Technical terminology, precise
    CASUAL = "casual"         # Conversational tone


@dataclass
class SummaryResult:
    """Result of content summarization"""
    summary: str
    original_length: int
    summary_length: int
    length_type: SummarizationLength
    style: SummarizationStyle
    model: str
    duration_ms: float
    success: bool = True
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def compression_ratio(self) -> float:
        """Calculate compression ratio"""
        if self.original_length == 0:
            return 0.0
        return 1.0 - (self.summary_length / self.original_length)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "summary": self.summary,
            "original_length": self.original_length,
            "summary_length": self.summary_length,
            "length_type": self.length_type.value,
            "style": self.style.value,
            "model": self.model,
            "duration_ms": self.duration_ms,
            "success": self.success,
            "error": self.error,
            "compression_ratio": self.compression_ratio,
            "metadata": self.metadata,
        }


@dataclass
class KeyPoint:
    """A key point extracted from content"""
    text: str
    importance: float  # 0.0 to 1.0
    category: Optional[str] = None
    supporting_evidence: List[str] = field(default_factory=list)
    source_section: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "importance": self.importance,
            "category": self.category,
            "supporting_evidence": self.supporting_evidence,
            "source_section": self.source_section,
        }


@dataclass
class KeyPointsResult:
    """Result of key point extraction"""
    key_points: List[KeyPoint]
    count: int
    model: str
    duration_ms: float
    success: bool = True
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "key_points": [kp.to_dict() for kp in self.key_points],
            "count": self.count,
            "model": self.model,
            "duration_ms": self.duration_ms,
            "success": self.success,
            "error": self.error,
            "metadata": self.metadata,
        }


@dataclass
class ExtractedFact:
    """A fact extracted from content"""
    statement: str
    subject: str
    predicate: str
    value: Any
    confidence: float  # 0.0 to 1.0
    source: Optional[str] = None
    context: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "statement": self.statement,
            "subject": self.subject,
            "predicate": self.predicate,
            "value": str(self.value),
            "confidence": self.confidence,
            "source": self.source,
            "context": self.context,
        }


@dataclass
class FactsResult:
    """Result of fact extraction"""
    facts: List[ExtractedFact]
    count: int
    model: str
    duration_ms: float
    success: bool = True
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "facts": [fact.to_dict() for fact in self.facts],
            "count": self.count,
            "model": self.model,
            "duration_ms": self.duration_ms,
            "success": self.success,
            "error": self.error,
            "metadata": self.metadata,
        }


__all__ = [
    "SummarizationLength",
    "SummarizationStyle",
    "SummaryResult",
    "KeyPoint",
    "KeyPointsResult",
    "ExtractedFact",
    "FactsResult",
]
