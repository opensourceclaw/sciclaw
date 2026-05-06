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
Fact-Check Service Module

Abstract service layer for fact-checking claims against external and
internal verification sources. Supports caching to avoid redundant checks.
"""

import logging
import hashlib
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from .claim_extractor import Claim, ClaimType

logger = logging.getLogger(__name__)


class VerificationStatus(Enum):
    """Verification result status"""
    VERIFIED = "verified"
    FALSE = "false"
    PARTIALLY_TRUE = "partially_true"
    UNVERIFIABLE = "unverifiable"
    PENDING = "pending"


@dataclass
class VerificationResult:
    """Result of fact-checking a claim"""
    claim: Claim
    status: VerificationStatus = VerificationStatus.PENDING
    confidence: float = 0.5
    source_count: int = 0
    supporting_sources: int = 0
    contradicting_sources: int = 0
    checked_at: datetime = field(default_factory=datetime.now)
    notes: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_verified(self) -> bool:
        return self.status == VerificationStatus.VERIFIED

    @property
    def agreement_ratio(self) -> float:
        total = self.supporting_sources + self.contradicting_sources
        if total == 0:
            return 0.0
        return self.supporting_sources / total

    def to_dict(self) -> Dict[str, Any]:
        return {
            "claim_text": self.claim.text,
            "claim_type": self.claim.claim_type.value,
            "status": self.status.value,
            "confidence": self.confidence,
            "source_count": self.source_count,
            "supporting_sources": self.supporting_sources,
            "contradicting_sources": self.contradicting_sources,
            "agreement_ratio": self.agreement_ratio,
            "checked_at": self.checked_at.isoformat(),
            "notes": self.notes,
            "metadata": self.metadata,
        }


# ============================================================================
# Fact-Check Service
# ============================================================================

class FactCheckService:
    """Abstract fact-checking service with caching

    Provides a unified interface for verifying claims against
    multiple source types (internal pattern matching, external APIs).

    The default implementation uses rule-based heuristics for
    claim verification without external API dependencies.
    Subclass to add external API integrations.
    """

    def __init__(self, cache_ttl_minutes: int = 30):
        """Initialize fact-check service

        Args:
            cache_ttl_minutes: Cache time-to-live in minutes
        """
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
        self._cache: Dict[str, VerificationResult] = {}

    def verify_claim(
        self,
        claim: Claim,
        reference_sources: Optional[List[Dict[str, Any]]] = None,
    ) -> VerificationResult:
        """Verify a single claim

        Args:
            claim: Claim to verify
            reference_sources: Optional list of reference sources to cross-check

        Returns:
            VerificationResult
        """
        # Check cache
        cache_key = self._cache_key(claim)
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            if datetime.now() - cached.checked_at < self.cache_ttl:
                return cached

        # Perform verification
        result = self._verify(claim, reference_sources or [])

        # Store in cache
        self._cache[cache_key] = result

        return result

    def verify_claims(
        self,
        claims: List[Claim],
        reference_sources: Optional[List[Dict[str, Any]]] = None,
    ) -> List[VerificationResult]:
        """Verify multiple claims

        Args:
            claims: List of claims to verify
            reference_sources: Optional reference sources

        Returns:
            List of VerificationResult
        """
        results = []
        for claim in claims:
            results.append(
                self.verify_claim(claim, reference_sources)
            )
        return results

    def verify_source(
        self,
        url: str,
        claims: List[Claim],
    ) -> Dict[str, Any]:
        """Verify all claims from a source

        Args:
            url: Source URL
            claims: Claims extracted from the source

        Returns:
            Dict with verification summary
        """
        results = self.verify_claims(claims)

        verified_count = sum(1 for r in results if r.is_verified)
        false_count = sum(1 for r in results if r.status == VerificationStatus.FALSE)
        unverifiable = sum(
            1 for r in results if r.status == VerificationStatus.UNVERIFIABLE
        )

        return {
            "url": url,
            "total_claims": len(claims),
            "verified": verified_count,
            "false": false_count,
            "partially_true": sum(
                1 for r in results
                if r.status == VerificationStatus.PARTIALLY_TRUE
            ),
            "unverifiable": unverifiable,
            "verification_rate": (
                verified_count / len(claims) if claims else 0.0
            ),
            "results": [r.to_dict() for r in results],
        }

    def clear_cache(self) -> None:
        """Clear verification cache"""
        self._cache.clear()
        logger.debug("Fact-check cache cleared")

    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics

        Returns:
            Dict with cache entry count
        """
        return {"cached_entries": len(self._cache)}

    # ====================================================================
    # Internal verification logic
    # ====================================================================

    def _verify(
        self,
        claim: Claim,
        reference_sources: List[Dict[str, Any]],
    ) -> VerificationResult:
        """Internal verification logic (rule-based)

        Args:
            claim: Claim to verify
            reference_sources: Reference sources for cross-checking

        Returns:
            VerificationResult
        """
        source_count = 0
        supporting = 0
        contradicting = 0

        # Check reference sources for supporting/contradicting evidence
        for ref in reference_sources:
            ref_text = ref.get("text", "")
            if not ref_text:
                continue

            source_count += 1

            # Simple keyword overlap as verification signal
            if self._text_overlap(claim.text, ref_text) > 0.3:
                supporting += 1
            elif claim.claim_type == ClaimType.NUMERIC:
                # For numeric claims, check if similar numbers appear
                if self._has_similar_numbers(claim.text, ref_text):
                    supporting += 1
                else:
                    contradicting += 1

        # Heuristic verification
        status, confidence = self._evaluate(claim, supporting, contradicting)

        return VerificationResult(
            claim=claim,
            status=status,
            confidence=confidence,
            source_count=source_count,
            supporting_sources=supporting,
            contradicting_sources=contradicting,
            notes=self._generate_notes(claim, status, supporting, contradicting),
        )

    def _evaluate(
        self,
        claim: Claim,
        supporting: int,
        contradicting: int,
    ) -> tuple:
        """Evaluate verification status from supporting/contradicting counts

        Args:
            claim: The claim
            supporting: Number of supporting sources
            contradicting: Number of contradicting sources

        Returns:
            Tuple of (VerificationStatus, confidence)
        """
        total = supporting + contradicting

        if total == 0:
            if claim.claim_type == ClaimType.OPINION:
                return VerificationStatus.UNVERIFIABLE, 0.3
            return VerificationStatus.PENDING, 0.3

        agreement = supporting / total

        if agreement >= 0.8 and supporting >= 2:
            return VerificationStatus.VERIFIED, min(0.95, 0.6 + agreement * 0.3)
        elif agreement >= 0.6:
            return VerificationStatus.PARTIALLY_TRUE, 0.5 + agreement * 0.2
        elif contradicting >= supporting:
            return VerificationStatus.FALSE, max(0.4, 1.0 - agreement)

        return VerificationStatus.PENDING, 0.3

    @staticmethod
    def _cache_key(claim: Claim) -> str:
        """Generate cache key for a claim

        Args:
            claim: The claim

        Returns:
            Cache key string
        """
        raw = f"{claim.text}:{claim.claim_type.value}:{claim.position}"
        return hashlib.md5(raw.encode()).hexdigest()

    @staticmethod
    def _text_overlap(text1: str, text2: str, ngram: int = 3) -> float:
        """Calculate text overlap using word n-grams

        Args:
            text1: First text
            text2: Second text
            ngram: N-gram size

        Returns:
            Overlap ratio 0.0-1.0
        """
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        return len(intersection) / max(len(words1), len(words2))

    @staticmethod
    def _has_similar_numbers(text1: str, text2: str) -> bool:
        """Check if two texts contain similar numbers

        Args:
            text1: First text
            text2: Second text

        Returns:
            True if similar numbers found
        """
        import re
        nums1 = set(re.findall(r"\d+(?:\.\d+)?", text1))
        nums2 = set(re.findall(r"\d+(?:\.\d+)?", text2))
        return len(nums1 & nums2) > 0

    @staticmethod
    def _generate_notes(
        claim: Claim,
        status: VerificationStatus,
        supporting: int,
        contradicting: int,
    ) -> str:
        """Generate human-readable verification notes

        Args:
            claim: The claim
            status: Verification result
            supporting: Supporting sources count
            contradicting: Contradicting sources count

        Returns:
            Notes string
        """
        if status == VerificationStatus.VERIFIED:
            return f"Verified by {supporting} supporting source(s)"
        elif status == VerificationStatus.FALSE:
            return f"Contradicted by {contradicting} source(s)"
        elif status == VerificationStatus.PARTIALLY_TRUE:
            return (
                f"Partially supported ({supporting} for, {contradicting} against)"
            )
        elif status == VerificationStatus.UNVERIFIABLE:
            if claim.claim_type == ClaimType.OPINION:
                return "Opinion claim — not verifiable"
            return "Insufficient data to verify"
        return "Verification pending"


# ============================================================================
# Convenience functions
# ============================================================================

def verify_claim(
    claim: Claim,
    reference_sources: Optional[List[Dict[str, Any]]] = None,
) -> VerificationResult:
    """Convenience function to verify a claim

    Args:
        claim: Claim to verify
        reference_sources: Optional reference sources

    Returns:
        VerificationResult
    """
    service = FactCheckService()
    return service.verify_claim(claim, reference_sources)


def verify_source(
    url: str,
    claims: List[Claim],
) -> Dict[str, Any]:
    """Convenience function to verify a source

    Args:
        url: Source URL
        claims: Extracted claims

    Returns:
        Verification summary dict
    """
    service = FactCheckService()
    return service.verify_source(url, claims)


__all__ = [
    "VerificationStatus",
    "VerificationResult",
    "FactCheckService",
    "verify_claim",
    "verify_source",
]
