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
Validation Package - Source scoring, citation tracking, claim extraction,
risk scoring, and fact-checking
"""

from .source_scorer import (
    DomainReputation,
    FreshnessScore,
    SourceScore,
    DomainScorer,
    FreshnessScorer,
    SourceScorer,
    score_source,
    score_sources,
)
from .citation_tracker import (
    Citation,
    CitationTracker,
)
from .citation_formatter import (
    CitationStyle,
    CitationFormatter,
    format_citation,
    format_bibliography,
)

from .source_validator import (
    SSLInfo,
    ContentIntegrity,
    ExtendedValidationResult,
    SSLChecker,
    ContentIntegrityChecker,
    ExternalSourceValidator,
    validate_source_extended,
    validate_sources_batch,
)
from .authority_scorer import (
    AuthorReputation,
    AuthorityScorer,
    score_author,
    score_authors,
)
from .claim_extractor import (
    ClaimType,
    NumericClaim,
    Claim,
    ClaimExtractor,
    extract_claims,
)
from .risk_scorer import (
    RiskLevel,
    ClaimRisk,
    SourceRisk,
    RiskScorer,
    score_claim_risk,
    score_source_risk,
)
from .factcheck_service import (
    VerificationStatus,
    VerificationResult,
    FactCheckService,
    verify_claim,
    verify_source,
)

__all__ = [
    # Source scoring
    "DomainReputation",
    "FreshnessScore",
    "SourceScore",
    "DomainScorer",
    "FreshnessScorer",
    "SourceScorer",
    "score_source",
    "score_sources",
    # Source validation
    "SSLInfo",
    "ContentIntegrity",
    "ExtendedValidationResult",
    "SSLChecker",
    "ContentIntegrityChecker",
    "ExternalSourceValidator",
    "validate_source_extended",
    "validate_sources_batch",
    # Citation tracking
    "Citation",
    "CitationTracker",
    # Citation formatting
    "CitationStyle",
    "CitationFormatter",
    "format_citation",
    "format_bibliography",
    # Authority scoring
    "AuthorReputation",
    "AuthorityScorer",
    "score_author",
    "score_authors",
    # Claim extraction
    "ClaimType",
    "NumericClaim",
    "Claim",
    "ClaimExtractor",
    "extract_claims",
    # Risk scoring
    "RiskLevel",
    "ClaimRisk",
    "SourceRisk",
    "RiskScorer",
    "score_claim_risk",
    "score_source_risk",
    # Fact-checking
    "VerificationStatus",
    "VerificationResult",
    "FactCheckService",
    "verify_claim",
    "verify_source",
]
