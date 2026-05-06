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
Author Authority Scoring Module

Scores author credibility based on author reputation, institutional
background, and citation metrics.
"""

import re
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ============================================================================
# Known institutions database
# ============================================================================

KNOWN_INSTITUTIONS: Dict[str, float] = {
    # Top research universities
    "MIT": 0.95,
    "Massachusetts Institute of Technology": 0.95,
    "Stanford University": 0.95,
    "Harvard University": 0.95,
    "University of Oxford": 0.93,
    "University of Cambridge": 0.93,
    "Caltech": 0.93,
    "California Institute of Technology": 0.93,
    "UC Berkeley": 0.90,
    "University of California, Berkeley": 0.90,
    "ETH Zurich": 0.90,
    "Imperial College London": 0.88,
    "Carnegie Mellon University": 0.88,
    "CMU": 0.88,
    "Tsinghua University": 0.85,
    "Peking University": 0.85,
    "University of Tokyo": 0.85,

    # Research labs
    "Google Research": 0.85,
    "Google DeepMind": 0.90,
    "DeepMind": 0.90,
    "OpenAI": 0.85,
    "Microsoft Research": 0.85,
    "Meta AI": 0.85,
    "Facebook AI Research": 0.85,
    "FAIR": 0.85,
    "IBM Research": 0.80,
    "Bell Labs": 0.85,
    "CERN": 0.90,
    "NASA": 0.90,
    "Los Alamos National Laboratory": 0.88,

    # Other institutions
    "Max Planck Institute": 0.88,
    "CNRS": 0.85,
    "Chinese Academy of Sciences": 0.85,
    "Russian Academy of Sciences": 0.80,
    "Indian Institute of Technology": 0.75,
    "IIT": 0.75,
    "University of Toronto": 0.83,
    "National University of Singapore": 0.80,
    "NUS": 0.80,
    "University of Melbourne": 0.78,
    "Seoul National University": 0.78,

    # Government bodies
    "WHO": 0.90,
    "World Health Organization": 0.90,
    "NIH": 0.90,
    "National Institutes of Health": 0.90,
    "CDC": 0.88,
    "European Commission": 0.85,
    "United Nations": 0.85,
    "IEEE": 0.85,
    "ACM": 0.83,
    "NIST": 0.90,
    "FDA": 0.85,

    # Companies (lower trust by default)
    "Amazon": 0.55,
    "Apple": 0.55,
    "Facebook": 0.50,
    "Meta": 0.50,
    "Twitter": 0.40,
}

# Known credentials keywords with score boosts
CREDENTIAL_BOOSTS: Dict[str, float] = {
    "ph.d": 0.15,
    "phd": 0.15,
    "professor": 0.15,
    "research fellow": 0.12,
    "senior researcher": 0.12,
    "distinguished": 0.10,
    "fellow": 0.08,
    "m.d.": 0.10,
    "md": 0.08,
    "pharm.d": 0.08,
    "sc.d": 0.15,
}


# ============================================================================
# Data classes
# ============================================================================

@dataclass
class AuthorReputation:
    """Author reputation assessment"""
    name: str = ""
    has_credentials: bool = False
    credential_score: float = 0.0
    institution: Optional[str] = None
    institution_score: float = 0.0
    is_known_institution: bool = False
    citation_count: int = 0
    citation_score: float = 0.0
    overall_score: float = 0.5
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "has_credentials": self.has_credentials,
            "credential_score": self.credential_score,
            "institution": self.institution,
            "institution_score": self.institution_score,
            "is_known_institution": self.is_known_institution,
            "citation_count": self.citation_count,
            "citation_score": self.citation_score,
            "overall_score": self.overall_score,
            "details": self.details,
        }

    @property
    def tier(self) -> str:
        """Get reputation tier"""
        if self.overall_score >= 0.8:
            return "expert"
        elif self.overall_score >= 0.6:
            return "credible"
        elif self.overall_score >= 0.4:
            return "moderate"
        return "unknown"


# ============================================================================
# Authority Scorer
# ============================================================================

class AuthorityScorer:
    """Scores author authority based on multiple factors

    Authority Score = Credential × 0.25 + Institution × 0.30
                    + Citation × 0.25 + Name Recognition × 0.20
    """

    def __init__(
        self,
        credential_weight: float = 0.25,
        institution_weight: float = 0.30,
        citation_weight: float = 0.25,
        recognition_weight: float = 0.20,
    ):
        """Initialize authority scorer

        Args:
            credential_weight: Weight for credentials (default 0.25)
            institution_weight: Weight for institution (default 0.30)
            citation_weight: Weight for citations (default 0.25)
            recognition_weight: Weight for name recognition (default 0.20)
        """
        total = sum([
            credential_weight,
            institution_weight,
            citation_weight,
            recognition_weight,
        ])
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total}")
        self.credential_weight = credential_weight
        self.institution_weight = institution_weight
        self.citation_weight = citation_weight
        self.recognition_weight = recognition_weight

    def score(
        self,
        author_name: str = "",
        author_info: Optional[Dict[str, Any]] = None,
    ) -> AuthorReputation:
        """Score author authority

        Args:
            author_name: Author's full name
            author_info: Dict with credentials, institution, citation_count, etc.

        Returns:
            AuthorReputation with overall score
        """
        info = author_info or {}

        # Credential scoring
        credential_score = self._score_credentials(
            author_name,
            info.get("credentials", ""),
        )

        # Institution scoring
        institution = info.get("institution") or info.get("affiliation")
        institution_score, is_known = self._score_institution(institution)

        # Citation scoring
        citation_count = info.get("citation_count", 0)
        citation_score = self._score_citations(citation_count)

        # Name recognition
        recognition_score = self._score_name_recognition(author_name)

        # Combined score
        overall = (
            credential_score * self.credential_weight
            + institution_score * self.institution_weight
            + citation_score * self.citation_weight
            + recognition_score * self.recognition_weight
        )

        return AuthorReputation(
            name=author_name,
            has_credentials=bool(info.get("credentials")),
            credential_score=credential_score,
            institution=institution,
            institution_score=institution_score,
            is_known_institution=is_known,
            citation_count=citation_count if isinstance(citation_count, int) else 0,
            citation_score=citation_score,
            overall_score=round(max(0.0, min(1.0, overall)), 3),
            details={
                "credential_weight": self.credential_weight,
                "institution_weight": self.institution_weight,
                "citation_weight": self.citation_weight,
                "recognition_weight": self.recognition_weight,
            },
        )

    def score_batch(
        self,
        authors: List[Dict[str, Any]],
    ) -> List[AuthorReputation]:
        """Score multiple authors

        Args:
            authors: List of author dicts with name and info

        Returns:
            List of AuthorReputation
        """
        results = []
        for author in authors:
            result = self.score(
                author_name=author.get("name", ""),
                author_info=author.get("info"),
            )
            results.append(result)
        return results

    @staticmethod
    def _score_credentials(author_name: str, credentials: str) -> float:
        """Score based on author credentials

        Args:
            author_name: Author name
            credentials: Credentials string

        Returns:
            Credential score 0.0-1.0
        """
        if not credentials:
            return 0.3  # Unknown credentials

        cred_lower = credentials.lower()
        score = 0.3

        for keyword, boost in CREDENTIAL_BOOSTS.items():
            if keyword in cred_lower:
                score += boost
                break  # Only count one credential type

        # Title indicators in name
        if author_name:
            name_lower = author_name.lower()
            if name_lower.startswith("dr ") or name_lower.startswith("prof "):
                score += 0.05

        return min(1.0, score)

    @staticmethod
    def _score_institution(affiliation: Optional[str]) -> tuple:
        """Score based on institution affiliation

        Args:
            affiliation: Institution or organization name

        Returns:
            Tuple of (institution_score, is_known)
        """
        if not affiliation:
            return 0.3, False

        aff_lower = affiliation.lower()

        # Check known institutions (exact and substring match)
        for known, score in KNOWN_INSTITUTIONS.items():
            if known.lower() == aff_lower or known.lower() in aff_lower:
                return score, True

        # Check for academic indicators
        if any(
            kw in aff_lower
            for kw in ["university", "institute", "college", "school", "academy"]
        ):
            return 0.65, False

        # Check for research lab indicators
        if any(kw in aff_lower for kw in ["research", "laboratory", "lab", "center"]):
            return 0.55, False

        return 0.35, False

    @staticmethod
    def _score_citations(citation_count: int) -> float:
        """Score based on citation count

        Args:
            citation_count: Number of citations

        Returns:
            Citation score 0.0-1.0
        """
        if not isinstance(citation_count, (int, float)) or citation_count <= 0:
            return 0.3  # Unknown

        if citation_count >= 10000:
            return 1.0
        elif citation_count >= 1000:
            return 0.9
        elif citation_count >= 500:
            return 0.8
        elif citation_count >= 100:
            return 0.7
        elif citation_count >= 50:
            return 0.6
        elif citation_count >= 10:
            return 0.5
        elif citation_count >= 1:
            return 0.4

        return 0.3

    @staticmethod
    def _score_name_recognition(name: str) -> float:
        """Score based on name recognition (known figures)

        Args:
            name: Author name

        Returns:
            Recognition score 0.0-1.0
        """
        if not name:
            return 0.3

        name_lower = name.lower()

        # Well-known authors in AI/CS
        well_known = [
            "geoffrey hinton", "yann lecun", "yoshua bengio", "andrew ng",
            "fei-fei li", "ian goodfellow", "juergen schmidhuber",
            "demis hassabis", "ilya sutskever", "andrej karpathy",
            "sebastian thrun", "daphne koller", "michael jordan",
            "peter norvig", "stuart russell", "zico kolter",
            "percy liang", "christopher manning", "dan jurafsky",
            "richard sutton", "david silver", "pieter abbeel",
            "sergey levine", "chelsea finn", "anima anandkumar",
            "timnit gebru", "joy buolamwini", "kate crawford",
            # Mathematics
            "terence tao", "grigori perelman", "andrew wiles",
            # Biology
            "jennifer doudna", "emmanuelle charpentier",
        ]

        if name_lower in well_known:
            return 1.0

        # Check partial match (first name or last name match)
        for known in well_known:
            parts = known.split()
            if len(parts) >= 2:
                # Check if last name matches
                if parts[-1] in name_lower.split():
                    return 0.5

        return 0.3  # Unknown author


# ============================================================================
# Convenience functions
# ============================================================================

def score_author(
    author_name: str = "",
    author_info: Optional[Dict[str, Any]] = None,
) -> AuthorReputation:
    """Convenience function to score author authority

    Args:
        author_name: Author's full name
        author_info: Dict with credentials, institution, citation_count

    Returns:
        AuthorReputation
    """
    scorer = AuthorityScorer()
    return scorer.score(author_name, author_info)


def score_authors(
    authors: List[Dict[str, Any]],
) -> List[AuthorReputation]:
    """Convenience function to score multiple authors

    Args:
        authors: List of author dicts

    Returns:
        List of AuthorReputation
    """
    scorer = AuthorityScorer()
    return scorer.score_batch(authors)


__all__ = [
    "AuthorReputation",
    "AuthorityScorer",
    "score_author",
    "score_authors",
]
