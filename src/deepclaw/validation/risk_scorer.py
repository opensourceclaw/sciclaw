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
Risk Scoring Module

Evaluates the risk level of claims and sources using a multi-factor model.

Risk Score = Source Score × 0.3 + Claim Type Score × 0.3 + Verification Score × 0.4

Risk levels: LOW, MEDIUM, HIGH, CRITICAL
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

from .claim_extractor import Claim, ClaimType

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk severity levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ============================================================================
# Claim type risk mapping
# ============================================================================

# Higher risk = less verifiable claim types
CLAIM_TYPE_RISK: Dict[ClaimType, float] = {
    ClaimType.FACTUAL: 0.1,     # Easily verifiable
    ClaimType.NUMERIC: 0.2,     # Verifiable with data
    ClaimType.QUOTATION: 0.15,  # Has explicit source
    ClaimType.COMPARISON: 0.3,  # Context-dependent
    ClaimType.CAUSATION: 0.5,   # Hard to verify
    ClaimType.OPINION: 0.7,     # Subjective
}

# Risk thresholds
RISK_THRESHOLDS = {
    RiskLevel.LOW: 0.25,
    RiskLevel.MEDIUM: 0.45,
    RiskLevel.HIGH: 0.65,
    RiskLevel.CRITICAL: 0.85,
}


@dataclass
class ClaimRisk:
    """Risk assessment for a single claim"""
    claim: Claim
    source_score: float = 0.5
    claim_type_score: float = 0.3
    verification_score: float = 0.5
    risk_score: float = 0.5
    risk_level: RiskLevel = RiskLevel.MEDIUM
    warnings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "claim": self.claim.to_dict(),
            "source_score": self.source_score,
            "claim_type_score": self.claim_type_score,
            "verification_score": self.verification_score,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level.value,
            "warnings": self.warnings,
            "recommendations": self.recommendations,
        }


@dataclass
class SourceRisk:
    """Risk assessment for a source"""
    url: str
    title: str = ""
    domain_risk: float = 0.5
    claims: List[ClaimRisk] = field(default_factory=list)
    overall_risk_score: float = 0.5
    overall_risk_level: RiskLevel = RiskLevel.MEDIUM
    high_risk_claims: int = 0
    critical_claims: int = 0
    summary: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "title": self.title,
            "domain_risk": self.domain_risk,
            "overall_risk_score": self.overall_risk_score,
            "overall_risk_level": self.overall_risk_level.value,
            "high_risk_claims": self.high_risk_claims,
            "critical_claims": self.critical_claims,
            "total_claims": len(self.claims),
            "summary": self.summary,
            "claims": [c.to_dict() for c in self.claims],
        }


# ============================================================================
# Risk Scorer
# ============================================================================

class RiskScorer:
    """Evaluates risk levels for claims and sources

    Risk model:
    Risk Score = Source Score × 0.3 + Claim Type Score × 0.3 + Verification Score × 0.4
    """

    def __init__(
        self,
        source_weight: float = 0.3,
        claim_weight: float = 0.3,
        verification_weight: float = 0.4,
    ):
        """Initialize risk scorer

        Args:
            source_weight: Weight for source score (default 0.3)
            claim_weight: Weight for claim type risk (default 0.3)
            verification_weight: Weight for verification score (default 0.4)
        """
        total = source_weight + claim_weight + verification_weight
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total}")
        self.source_weight = source_weight
        self.claim_weight = claim_weight
        self.verification_weight = verification_weight

    def score_claim(
        self,
        claim: Claim,
        source_score: float = 0.5,
        verification_score: float = 0.5,
    ) -> ClaimRisk:
        """Score risk for a single claim

        Args:
            claim: The claim to evaluate
            source_score: Source quality score (0.0-1.0)
            verification_score: Verification completeness (0.0-1.0)

        Returns:
            ClaimRisk assessment
        """
        # Source component
        source_component = source_score

        # Claim type component
        claim_type_risk = CLAIM_TYPE_RISK.get(claim.claim_type, 0.5)
        claim_component = 1.0 - claim.confidence  # Lower confidence = higher risk

        # Verification component
        verification_component = 1.0 - verification_score

        # Combined risk score
        risk_score = (
            source_component * self.source_weight
            + (claim_type_risk * 0.4 + claim_component * 0.6) * self.claim_weight
            + verification_component * self.verification_weight
        )

        risk_score = round(max(0.0, min(1.0, risk_score)), 3)

        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)

        # Generate warnings
        warnings = self._generate_warnings(
            claim, source_score, verification_score, risk_level
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            claim, source_score, risk_level
        )

        return ClaimRisk(
            claim=claim,
            source_score=source_score,
            claim_type_score=round(1.0 - claim_type_risk, 3),
            verification_score=verification_score,
            risk_score=risk_score,
            risk_level=risk_level,
            warnings=warnings,
            recommendations=recommendations,
        )

    def score_claims(
        self,
        claims: List[Claim],
        source_scores: Optional[Dict[str, float]] = None,
        verification_scores: Optional[Dict[str, float]] = None,
    ) -> List[ClaimRisk]:
        """Score multiple claims

        Args:
            claims: List of claims to evaluate
            source_scores: Dict mapping source URL to quality score
            verification_scores: Dict mapping claim position to verification score

        Returns:
            List of ClaimRisk assessments
        """
        source_scores = source_scores or {}
        verification_scores = verification_scores or {}

        results = []
        for claim in claims:
            source_score = source_scores.get(
                claim.source_url or "", 0.5
            )
            verification_score = verification_scores.get(
                str(claim.position), 0.5
            )
            results.append(
                self.score_claim(claim, source_score, verification_score)
            )
        return results

    def score_source(
        self,
        url: str,
        title: str = "",
        claims: Optional[List[Claim]] = None,
        domain_risk: float = 0.5,
    ) -> SourceRisk:
        """Score risk for an entire source

        Args:
            url: Source URL
            title: Source title
            claims: Claims extracted from the source
            domain_risk: Domain risk score

        Returns:
            SourceRisk assessment
        """
        claims = claims or []

        if not claims:
            return SourceRisk(
                url=url,
                title=title,
                domain_risk=domain_risk,
                overall_risk_level=RiskLevel.LOW,
                summary="No claims to evaluate",
            )

        # Score each claim
        claim_risks = self.score_claims(claims)

        # Calculate overall risk
        if claim_risks:
            avg_risk = sum(c.risk_score for c in claim_risks) / len(claim_risks)
            overall_risk = avg_risk * 0.7 + domain_risk * 0.3
        else:
            overall_risk = domain_risk

        overall_risk = round(max(0.0, min(1.0, overall_risk)), 3)
        overall_level = self._determine_risk_level(overall_risk)

        high_risk = sum(
            1 for c in claim_risks
            if c.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
        )
        critical = sum(1 for c in claim_risks if c.risk_level == RiskLevel.CRITICAL)

        # Summary
        summary = (
            f"Source contains {len(claims)} claims. "
            f"Overall risk: {overall_level.value} ({overall_risk:.2f}). "
        )
        if critical > 0:
            summary += f"{critical} critical claim(s) detected!"
        elif high_risk > 0:
            summary += f"{high_risk} high-risk claim(s) found."
        else:
            summary += "No critical claims."

        return SourceRisk(
            url=url,
            title=title,
            domain_risk=domain_risk,
            claims=claim_risks,
            overall_risk_score=overall_risk,
            overall_risk_level=overall_level,
            high_risk_claims=high_risk,
            critical_claims=critical,
            summary=summary,
        )

    @staticmethod
    def format_warnings(claim_risks: List[ClaimRisk]) -> str:
        """Format warnings for display

        Args:
            claim_risks: List of claim risk assessments

        Returns:
            Formatted warning string
        """
        lines = ["## Risk Assessment", ""]

        # Count by level
        level_counts: Dict[RiskLevel, int] = {}
        for cr in claim_risks:
            level_counts[cr.risk_level] = level_counts.get(cr.risk_level, 0) + 1

        for level in [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW]:
            count = level_counts.get(level, 0)
            if count > 0:
                icon = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}[level.value]
                lines.append(f"- {icon} **{level.value}**: {count} claim(s)")

        lines.append("")

        # Detail warnings
        for i, cr in enumerate(claim_risks, 1):
            if cr.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
                lines.append(f"### ⚠️ High Risk Claim #{i}")
                lines.append(f"> {cr.claim.text}")
                if cr.warnings:
                    for w in cr.warnings:
                        lines.append(f"- ⚠️ {w}")
                if cr.recommendations:
                    for r in cr.recommendations:
                        lines.append(f"- 💡 {r}")
                lines.append("")

        return "\n".join(lines)

    @staticmethod
    def is_warning_required(risk_score: float) -> bool:
        """Check if a user-visible warning is required

        Args:
            risk_score: Risk score 0.0-1.0

        Returns:
            True if warning should be shown
        """
        return risk_score >= RISK_THRESHOLDS[RiskLevel.HIGH]

    # ====================================================================
    # Internal methods
    # ====================================================================

    @staticmethod
    def _determine_risk_level(risk_score: float) -> RiskLevel:
        """Determine risk level from score

        Args:
            risk_score: Risk score 0.0-1.0

        Returns:
            RiskLevel
        """
        if risk_score >= RISK_THRESHOLDS[RiskLevel.CRITICAL]:
            return RiskLevel.CRITICAL
        elif risk_score >= RISK_THRESHOLDS[RiskLevel.HIGH]:
            return RiskLevel.HIGH
        elif risk_score >= RISK_THRESHOLDS[RiskLevel.MEDIUM]:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    @staticmethod
    def _generate_warnings(
        claim: Claim,
        source_score: float,
        verification_score: float,
        risk_level: RiskLevel,
    ) -> List[str]:
        """Generate warnings for a claim

        Args:
            claim: The claim
            source_score: Source quality
            verification_score: Verification level
            risk_level: Risk level

        Returns:
            List of warning strings
        """
        warnings = []

        if risk_level == RiskLevel.CRITICAL:
            warnings.append("Untrusted source detected — verify independently")
        elif risk_level == RiskLevel.HIGH:
            warnings.append("Low-quality source — cross-reference recommended")

        if source_score < 0.4:
            warnings.append(f"Source reliability is low ({source_score:.2f})")

        if verification_score < 0.3:
            warnings.append("Claim has not been verified")

        if claim.claim_type == ClaimType.OPINION:
            warnings.append("Subjective claim — may not be factual")

        if claim.claim_type == ClaimType.CAUSATION:
            warnings.append("Causation claim — verify causal relationship")

        if not claim.source_url:
            warnings.append("Missing source attribution")

        return warnings

    @staticmethod
    def _generate_recommendations(
        claim: Claim,
        source_score: float,
        risk_level: RiskLevel,
    ) -> List[str]:
        """Generate recommendations for handling a claim

        Args:
            claim: The claim
            source_score: Source quality
            risk_level: Risk level

        Returns:
            List of recommendation strings
        """
        recs = []

        if risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            recs.append("Seek confirmation from at least 2 independent sources")

        if source_score < 0.4:
            recs.append("Replace with more reliable source if available")

        if claim.claim_type == ClaimType.NUMERIC:
            recs.append("Verify numbers against original source data")

        if claim.claim_type == ClaimType.CAUSATION:
            recs.append("Check for correlation vs causation fallacy")

        return recs


# ============================================================================
# Convenience functions
# ============================================================================

def score_claim_risk(
    claim: Claim,
    source_score: float = 0.5,
    verification_score: float = 0.5,
) -> ClaimRisk:
    """Convenience function to score claim risk

    Args:
        claim: Claim to evaluate
        source_score: Source quality score
        verification_score: Verification level

    Returns:
        ClaimRisk
    """
    scorer = RiskScorer()
    return scorer.score_claim(claim, source_score, verification_score)


def score_source_risk(
    url: str,
    title: str = "",
    claims: Optional[List[Claim]] = None,
    domain_risk: float = 0.5,
) -> SourceRisk:
    """Convenience function to score source risk

    Args:
        url: Source URL
        title: Source title
        claims: Extracted claims
        domain_risk: Domain risk

    Returns:
        SourceRisk
    """
    scorer = RiskScorer()
    return scorer.score_source(url, title, claims, domain_risk)


__all__ = [
    "RiskLevel",
    "ClaimRisk",
    "SourceRisk",
    "RiskScorer",
    "score_claim_risk",
    "score_source_risk",
]
