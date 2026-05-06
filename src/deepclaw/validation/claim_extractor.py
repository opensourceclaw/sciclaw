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
Claim Extraction Module

Detects and classifies factual claims in text, extracts numeric data,
dates, statistics, and links claims to source citations.

Supports 6 claim types:
- FACTUAL: Verifiable facts
- NUMERIC: Numbers, statistics, measurements
- QUOTATION: Direct quotes
- COMPARISON: Comparative statements
- CAUSATION: Cause-and-effect relationships
- OPINION: Subjective viewpoints
"""

import re
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class ClaimType(Enum):
    """Types of claims that can be detected"""
    FACTUAL = "factual"
    NUMERIC = "numeric"
    QUOTATION = "quotation"
    COMPARISON = "comparison"
    CAUSATION = "causation"
    OPINION = "opinion"


@dataclass
class NumericClaim:
    """An extracted numeric value with context"""
    value: float
    unit: str = ""
    context: str = ""
    position: int = 0  # Character position in source text
    original_text: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "value": self.value,
            "unit": self.unit,
            "context": self.context,
            "position": self.position,
            "original_text": self.original_text,
        }


@dataclass
class Claim:
    """A detected claim in text"""
    text: str
    claim_type: ClaimType
    confidence: float = 0.5
    position: int = 0
    length: int = 0
    source_url: Optional[str] = None
    source_title: Optional[str] = None
    numeric_data: Optional[NumericClaim] = None
    dates: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "claim_type": self.claim_type.value,
            "confidence": self.confidence,
            "position": self.position,
            "length": self.length,
            "source_url": self.source_url,
            "source_title": self.source_title,
            "numeric_data": self.numeric_data.to_dict() if self.numeric_data else None,
            "dates": self.dates,
            "metadata": self.metadata,
        }


# ============================================================================
# Claim pattern definitions
# ============================================================================

FACTUAL_INDICATORS = [
    r"\b(?:is|are|was|were|has|have|had|will|shall)\b",
    r"\b(?:according to|as stated by|reported by|confirmed by|verified by)\b",
    r"\b(?:research shows|studies show|evidence suggests|data indicates)\b",
    r"\b(?:found that|discovered that|demonstrated that|proved that)\b",
    r"\b(?:in fact|indeed|actually|clearly|obviously|undoubtedly)\b",
]

NUMERIC_PATTERNS = [
    # Percentages
    r"(\d+(?:\.\d+)?\s*%)",
    # Numbers with units
    r"(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|trillion|thousand|hundred))",
    r"(\d+(?:\.\d+)?\s*(?:USD|EUR|GBP|JPY|CNY|dollars|euros|pounds|yuan|元|美元|欧元|英镑))",
    r"(\d+(?:\.\d+)?\s*(?:kg|g|mg|km|m|cm|mm|L|mL|°C|°F|hours|minutes|seconds|days|years))",
    # Standalone numbers
    r"(?<!\w)(\d+(?:,\d{3})+(?:\.\d+)?)(?!\w)",  # 1,234 or 1,234.56
    r"(?<!\w)(\d+(?:\.\d+)?)(?!\w)",  # plain numbers
]

QUOTATION_PATTERNS = [
    r'"[^"]{20,}"',  # Double-quoted text (min 20 chars)
    r"'[^']{20,}'",  # Single-quoted text
    r"\u201c[^\u201d]{20,}\u201d",  # Curly double quotes
    r"\u2018[^\u2019]{20,}\u2019",  # Curly single quotes
]

COMPARISON_PATTERNS = [
    r"\b(?:more|less)\s+(?:than|compared to|relative to)\b",
    r"\b(?:higher|lower|greater|smaller|larger|faster|slower)\s+than\b",
    r"\b(?:compared to|compared with|in comparison|by contrast)\b",
    r"\b(?:as\s+\w+\s+as)\b",  # "as fast as", "as big as"
    r"\b(?:increased by|decreased by|rose by|fell by|grew by|declined by)\b",
    r"\b(?:up\s+\d+%|down\s+\d+%)\b",
]

CAUSATION_PATTERNS = [
    r"\b(?:causes?|caused by|resulting in|leads? to|led to|leading to)\b",
    r"\b(?:because of|due to|owing to|as a result of)\b",
    r"\b(?:therefore|thus|hence|consequently|accordingly)\b",
    r"\b(?:if\s+\w+.*then)\b",
    r"\b(?:responsible for|contributes? to|triggers?)\b",
]

OPINION_INDICATORS = [
    r"\b(?:I think|I believe|in my opinion|I feel|it seems|it appears)\b",
    r"\b(?:probably|possibly|perhaps|maybe|likely|unlikely|potentially)\b",
    r"\b(?:might be|could be|may be|should be|would be)\b",
    r"\b(?:arguably|supposedly|allegedly|reportedly|apparently)\b",
    r"\b(?:best|worst|greatest|amazing|terrible|awful|wonderful|horrible)\b",
]

# Date patterns
DATE_PATTERNS = [
    r"\b(\d{4}-\d{2}-\d{2})\b",  # ISO: 2026-05-06
    r"\b(\d{1,2}/\d{1,2}/\d{2,4})\b",  # MM/DD/YYYY
    r"\b(\d{1,2}\.\d{1,2}\.\d{2,4})\b",  # DD.MM.YYYY
    r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b",
    r"\b(\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4})\b",
    r"\b((?:19|20)\d{2})\b",  # Year
]


# ============================================================================
# Claim Extractor
# ============================================================================

class ClaimExtractor:
    """Extracts and classifies claims from text"""

    def __init__(self):
        """Initialize claim extractor"""
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile regex patterns"""
        self._factual_re = [
            re.compile(p, re.IGNORECASE) for p in FACTUAL_INDICATORS
        ]
        self._numeric_re = [re.compile(p, re.IGNORECASE) for p in NUMERIC_PATTERNS]
        self._quotation_re = [re.compile(p) for p in QUOTATION_PATTERNS]
        self._comparison_re = [
            re.compile(p, re.IGNORECASE) for p in COMPARISON_PATTERNS
        ]
        self._causation_re = [
            re.compile(p, re.IGNORECASE) for p in CAUSATION_PATTERNS
        ]
        self._opinion_re = [re.compile(p, re.IGNORECASE) for p in OPINION_INDICATORS]
        self._date_re = [re.compile(p) for p in DATE_PATTERNS]

    def extract_claims(
        self,
        text: str,
        source_url: Optional[str] = None,
        source_title: Optional[str] = None,
    ) -> List[Claim]:
        """Extract all claims from text

        Args:
            text: Source text to analyze
            source_url: Source URL for attribution
            source_title: Source title for attribution

        Returns:
            List of detected Claim objects
        """
        if not text or not text.strip():
            return []

        claims: List[Claim] = []

        # Extract by sentence for context
        sentences = self._split_sentences(text)

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 10:
                continue

            # Classify claim type
            claim_type, confidence = self._classify_claim(sentence)

            # Extract numeric data
            numeric_data = self._extract_numeric(sentence) if claim_type in (
                ClaimType.NUMERIC, ClaimType.FACTUAL
            ) else None

            # Extract dates
            dates = self._extract_dates(sentence)

            if claim_type:
                pos = text.find(sentence)
                claims.append(Claim(
                    text=sentence,
                    claim_type=claim_type,
                    confidence=confidence,
                    position=max(0, pos),
                    length=len(sentence),
                    source_url=source_url,
                    source_title=source_title,
                    numeric_data=numeric_data,
                    dates=dates,
                ))

        return claims

    def extract_claims_batch(
        self,
        texts: List[Dict[str, str]],
    ) -> List[Claim]:
        """Extract claims from multiple sources

        Args:
            texts: List of dicts with 'text', 'url', 'title' keys

        Returns:
            List of all extracted Claim objects
        """
        all_claims = []
        for item in texts:
            claims = self.extract_claims(
                text=item.get("text", ""),
                source_url=item.get("url"),
                source_title=item.get("title"),
            )
            all_claims.extend(claims)
        return all_claims

    def get_claims_by_type(
        self,
        claims: List[Claim],
        claim_type: ClaimType,
    ) -> List[Claim]:
        """Filter claims by type

        Args:
            claims: List of claims
            claim_type: Type to filter by

        Returns:
            Filtered claims
        """
        return [c for c in claims if c.claim_type == claim_type]

    def get_claims_by_confidence(
        self,
        claims: List[Claim],
        min_confidence: float = 0.6,
    ) -> List[Claim]:
        """Filter claims by minimum confidence

        Args:
            claims: List of claims
            min_confidence: Minimum confidence threshold

        Returns:
            High-confidence claims
        """
        return [c for c in claims if c.confidence >= min_confidence]

    def get_statistics(self, claims: List[Claim]) -> Dict[str, Any]:
        """Get statistics about extracted claims

        Args:
            claims: List of claims

        Returns:
            Dict with counts by type, average confidence, etc.
        """
        if not claims:
            return {
                "total_claims": 0,
                "by_type": {},
                "average_confidence": 0.0,
            }

        by_type: Dict[str, int] = {}
        for claim in claims:
            key = claim.claim_type.value
            by_type[key] = by_type.get(key, 0) + 1

        avg_conf = sum(c.confidence for c in claims) / len(claims)

        return {
            "total_claims": len(claims),
            "by_type": by_type,
            "average_confidence": round(avg_conf, 3),
        }

    # ====================================================================
    # Internal methods
    # ====================================================================

    def _classify_claim(self, sentence: str) -> tuple:
        """Classify a sentence as a claim type

        Args:
            sentence: Sentence to classify

        Returns:
            Tuple of (ClaimType, confidence)
        """
        scores: Dict[ClaimType, float] = {}

        # Check quotation first (highest precision)
        has_quotation = bool(re.search(r'["\u201c].+["\u201d]', sentence))
        if has_quotation:
            scores[ClaimType.QUOTATION] = 0.85

        # Check numeric
        has_numbers = bool(re.search(r"\d+", sentence))
        if has_numbers:
            scores[ClaimType.NUMERIC] = 0.7

        # Check causation
        causation_count = sum(
            1 for p in self._causation_re if p.search(sentence)
        )
        if causation_count > 0:
            scores[ClaimType.CAUSATION] = min(0.9, 0.5 + causation_count * 0.15)

        # Check comparison
        comparison_count = sum(
            1 for p in self._comparison_re if p.search(sentence)
        )
        if comparison_count > 0:
            scores[ClaimType.COMPARISON] = min(0.9, 0.5 + comparison_count * 0.15)

        # Check factual
        factual_count = sum(1 for p in self._factual_re if p.search(sentence))
        if factual_count > 0:
            scores[ClaimType.FACTUAL] = min(0.85, 0.4 + factual_count * 0.1)

        # Check opinion
        opinion_count = sum(1 for p in self._opinion_re if p.search(sentence))
        if opinion_count > 0:
            scores[ClaimType.OPINION] = min(0.85, 0.4 + opinion_count * 0.1)

        if not scores:
            return ClaimType.FACTUAL, 0.3  # Default

        # Return highest scoring type
        best_type = max(scores, key=scores.get)
        return best_type, round(scores[best_type], 3)

    def _extract_numeric(self, text: str) -> Optional[NumericClaim]:
        """Extract numeric data from text

        Args:
            text: Text to extract from

        Returns:
            NumericClaim or None
        """
        for pattern in self._numeric_re:
            match = pattern.search(text)
            if match:
                value_str = match.group(1).replace(",", "").strip()
                try:
                    value = float(value_str.rstrip("%"))
                    context = self._get_context(text, match.start(), match.end())
                    return NumericClaim(
                        value=value,
                        unit=self._detect_unit(match.group(0)),
                        context=context,
                        position=match.start(),
                        original_text=match.group(0).strip(),
                    )
                except ValueError:
                    continue
        return None

    def _extract_dates(self, text: str) -> List[str]:
        """Extract date strings from text

        Args:
            text: Text to search

        Returns:
            List of date strings
        """
        dates = []
        for pattern in self._date_re:
            for match in pattern.finditer(text):
                date_str = match.group(1).strip()
                if date_str not in dates:
                    dates.append(date_str)
        return dates

    @staticmethod
    def _detect_unit(text: str) -> str:
        """Detect unit from numeric text

        Args:
            text: Numeric string

        Returns:
            Unit string
        """
        unit_map = {
            "%": "percentage",
            "dollars": "USD",
            "USD": "USD",
            "EUR": "EUR",
            "GBP": "GBP",
            "kg": "kg",
            "g": "g",
            "mg": "mg",
            "km": "km",
            "m": "m",
            "cm": "cm",
            "mm": "mm",
            "L": "L",
            "mL": "mL",
            "°C": "celsius",
            "°F": "fahrenheit",
            "hours": "hours",
            "minutes": "minutes",
            "seconds": "seconds",
            "days": "days",
            "years": "years",
            "million": "count",
            "billion": "count",
            "trillion": "count",
            "thousand": "count",
            "hundred": "count",
        }
        text_lower = text.lower()
        for key, val in unit_map.items():
            if key.lower() in text_lower:
                return val
        return ""

    @staticmethod
    def _get_context(text: str, start: int, end: int, window: int = 80) -> str:
        """Get surrounding context for a match

        Args:
            text: Full text
            start: Match start position
            end: Match end position
            window: Context window size

        Returns:
            Context string
        """
        ctx_start = max(0, start - window)
        ctx_end = min(len(text), end + window)
        return text[ctx_start:ctx_end]

    @staticmethod
    def _split_sentences(text: str) -> List[str]:
        """Split text into sentences

        Args:
            text: Input text

        Returns:
            List of sentences
        """
        # Split on sentence boundaries
        sentences = re.split(
            r'(?<=[.!?。！？\n])\s+',
            text,
        )
        return [s.strip() for s in sentences if s.strip()]


# ============================================================================
# Convenience functions
# ============================================================================

def extract_claims(
    text: str,
    source_url: Optional[str] = None,
    source_title: Optional[str] = None,
) -> List[Claim]:
    """Convenience function to extract claims from text

    Args:
        text: Source text
        source_url: Source URL
        source_title: Source title

    Returns:
        List of Claim objects
    """
    extractor = ClaimExtractor()
    return extractor.extract_claims(text, source_url, source_title)


__all__ = [
    "ClaimType",
    "NumericClaim",
    "Claim",
    "ClaimExtractor",
    "extract_claims",
]
