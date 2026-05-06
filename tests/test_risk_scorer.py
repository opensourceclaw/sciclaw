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
Tests for risk_scorer module
"""

import pytest

from deepclaw.validation.claim_extractor import Claim, ClaimType
from deepclaw.validation.risk_scorer import (
    RiskLevel,
    ClaimRisk,
    SourceRisk,
    RiskScorer,
    score_claim_risk,
    score_source_risk,
)
from deepclaw.validation.factcheck_service import (
    FactCheckService,
)


class TestRiskLevel:
    """Tests for RiskLevel enum"""

    def test_values(self):
        assert RiskLevel.LOW.value == "LOW"
        assert RiskLevel.MEDIUM.value == "MEDIUM"
        assert RiskLevel.HIGH.value == "HIGH"
        assert RiskLevel.CRITICAL.value == "CRITICAL"


class TestClaimRisk:
    """Tests for ClaimRisk dataclass"""

    def test_creation(self):
        claim = Claim(text="Test claim", claim_type=ClaimType.FACTUAL)
        risk = ClaimRisk(claim=claim, risk_score=0.3, risk_level=RiskLevel.LOW)
        assert risk.claim == claim
        assert risk.risk_level == RiskLevel.LOW

    def test_to_dict(self):
        claim = Claim(text="GDP grew 3%", claim_type=ClaimType.NUMERIC)
        risk = ClaimRisk(
            claim=claim,
            risk_score=0.7,
            risk_level=RiskLevel.HIGH,
            warnings=["Test warning"],
        )
        d = risk.to_dict()
        assert d["risk_score"] == 0.7
        assert d["risk_level"] == "HIGH"
        assert len(d["warnings"]) == 1


class TestSourceRisk:
    """Tests for SourceRisk dataclass"""

    def test_creation(self):
        sr = SourceRisk(url="https://example.com", title="Example")
        assert sr.url == "https://example.com"
        assert sr.overall_risk_level == RiskLevel.MEDIUM

    def test_to_dict(self):
        sr = SourceRisk(
            url="https://example.com",
            title="Test",
            overall_risk_score=0.6,
            overall_risk_level=RiskLevel.MEDIUM,
        )
        d = sr.to_dict()
        assert d["url"] == "https://example.com"
        assert d["overall_risk_level"] == "MEDIUM"


class TestRiskScorer:
    """Tests for RiskScorer"""

    @pytest.fixture
    def scorer(self):
        return RiskScorer()

    def test_weight_validation(self):
        with pytest.raises(ValueError):
            RiskScorer(source_weight=1.0, claim_weight=1.0, verification_weight=1.0)

    def test_score_factual_claim(self, scorer):
        claim = Claim(
            text="Research shows AI improves efficiency by 40%.",
            claim_type=ClaimType.FACTUAL,
            confidence=0.8,
            source_url="https://reputable-source.com",
        )
        risk = scorer.score_claim(claim, source_score=0.8, verification_score=0.9)
        assert 0.0 <= risk.risk_score <= 1.0
        assert risk.risk_level in (RiskLevel.LOW, RiskLevel.MEDIUM)

    def test_score_opinion_claim_high_risk(self, scorer):
        claim = Claim(
            text="I believe this is the best approach.",
            claim_type=ClaimType.OPINION,
            confidence=0.5,
            source_url="https://random-blog.com",
        )
        risk = scorer.score_claim(claim, source_score=0.2, verification_score=0.1)
        assert risk.risk_score > 0.3

    def test_score_causation_claim(self, scorer):
        claim = Claim(
            text="Eating chocolate causes weight gain.",
            claim_type=ClaimType.CAUSATION,
            confidence=0.6,
        )
        risk = scorer.score_claim(claim, source_score=0.5, verification_score=0.5)
        assert "causation" in " ".join(risk.warnings).lower() or "causal" in " ".join(risk.warnings).lower()

    def test_score_claims_batch(self, scorer):
        claims = [
            Claim(text="Fact 1", claim_type=ClaimType.FACTUAL, confidence=0.9),
            Claim(text="Opinion 1", claim_type=ClaimType.OPINION, confidence=0.4),
            Claim(text="Fact 2", claim_type=ClaimType.FACTUAL, confidence=0.7),
        ]
        results = scorer.score_claims(claims)
        assert len(results) == 3
        for r in results:
            assert isinstance(r, ClaimRisk)

    def test_score_source(self, scorer):
        claims = [
            Claim(text="Verified fact", claim_type=ClaimType.FACTUAL, confidence=0.9),
            Claim(text="Some opinion", claim_type=ClaimType.OPINION, confidence=0.4),
        ]
        source_risk = scorer.score_source(
            url="https://example.com",
            title="Example",
            claims=claims,
            domain_risk=0.3,
        )
        assert source_risk.overall_risk_score > 0
        assert source_risk.overall_risk_level is not None
        assert len(source_risk.claims) == 2

    def test_score_source_empty(self, scorer):
        source_risk = scorer.score_source(url="https://example.com")
        assert source_risk.overall_risk_level == RiskLevel.LOW
        assert "No claims" in source_risk.summary

    def test_high_risk_source_detection(self, scorer):
        claims = [
            Claim(
                text="X definitely causes Y in all cases.",
                claim_type=ClaimType.CAUSATION,
                confidence=0.3,
                source_url="https://untrusted-blog.com",
            ),
        ]
        source_risk = scorer.score_source(
            url="https://untrusted-blog.com",
            claims=claims,
            domain_risk=0.8,
        )
        assert source_risk.overall_risk_score >= 0.3

    def test_format_warnings(self, scorer):
        claims = [
            Claim(text="High risk claim", claim_type=ClaimType.OPINION, confidence=0.2),
            Claim(text="Low risk claim", claim_type=ClaimType.FACTUAL, confidence=0.9),
        ]
        results = scorer.score_claims(claims, {"": 0.3}, {"0": 0.2, str(claims[1].position): 0.9})
        output = RiskScorer.format_warnings(results)
        assert "## Risk Assessment" in output

    def test_is_warning_required(self):
        assert RiskScorer.is_warning_required(0.8)
        assert not RiskScorer.is_warning_required(0.3)

    def test_custom_weights(self):
        scorer = RiskScorer(
            source_weight=0.5,
            claim_weight=0.3,
            verification_weight=0.2,
        )
        claim = Claim(text="Test", claim_type=ClaimType.FACTUAL, confidence=0.5)
        risk = scorer.score_claim(claim, source_score=0.2, verification_score=0.5)
        assert 0.0 <= risk.risk_score <= 1.0

    def test_risk_level_determination(self, scorer):
        factual = Claim(text="Fact", claim_type=ClaimType.FACTUAL, confidence=0.9)
        opinion = Claim(text="Opinion", claim_type=ClaimType.OPINION, confidence=0.1)

        low_risk = scorer.score_claim(factual, source_score=0.9, verification_score=0.9)
        high_risk = scorer.score_claim(opinion, source_score=0.1, verification_score=0.1)

        assert low_risk.risk_score <= high_risk.risk_score

    def test_warnings_for_untrusted_source(self, scorer):
        claim = Claim(
            text="X causes Y.",
            claim_type=ClaimType.CAUSATION,
            confidence=0.3,
            source_url="https://random-site.com",
        )
        risk = scorer.score_claim(claim, source_score=0.1, verification_score=0.1)
        assert len(risk.warnings) > 0

    def test_recommendations_generated(self, scorer):
        claim = Claim(text="X increased by 200%.", claim_type=ClaimType.NUMERIC, confidence=0.5)
        risk = scorer.score_claim(claim, source_score=0.2, verification_score=0.2)
        assert len(risk.recommendations) > 0


class TestConvenienceFunctions:
    """Tests for convenience functions"""

    def test_score_claim_risk(self):
        claim = Claim(text="Test", claim_type=ClaimType.FACTUAL, confidence=0.8)
        result = score_claim_risk(claim, source_score=0.8, verification_score=0.9)
        assert isinstance(result, ClaimRisk)

    def test_score_source_risk(self):
        claims = [Claim(text="Test", claim_type=ClaimType.FACTUAL, confidence=0.8)]
        result = score_source_risk("https://example.com", "Test", claims, 0.3)
        assert isinstance(result, SourceRisk)


class TestIntegrationClaimRisk:
    """Integration tests: claim extraction + risk scoring"""

    def test_end_to_end(self):
        from deepclaw.validation.claim_extractor import ClaimExtractor
        from deepclaw.validation.risk_scorer import RiskScorer

        extractor = ClaimExtractor()
        text = (
            "Research shows that AI productivity gains reached 40% in 2025. "
            "However, some experts believe these numbers are overstated. "
            "The increase in AI adoption may lead to significant job displacement."
        )
        claims = extractor.extract_claims(
            text,
            source_url="https://reliable-source.example.com",
            source_title="AI Research Report",
        )
        assert len(claims) > 0

        scorer = RiskScorer()
        results = scorer.score_claims(claims)
        assert len(results) == len(claims)

        source_risk = scorer.score_source(
            url="https://reliable-source.example.com",
            title="AI Research Report",
            claims=claims,
            domain_risk=0.2,
        )
        assert source_risk.overall_risk_score > 0


class TestFactCheckIntegration:
    """Tests for factcheck_service.py integration"""

    def test_verify_factual_claim(self):
        claim = Claim(
            text="According to research, solar efficiency has reached 47%.",
            claim_type=ClaimType.FACTUAL,
            confidence=0.8,
        )
        service = FactCheckService()
        result = service.verify_claim(claim)
        assert result.claim == claim
        assert result.status is not None

    def test_verify_opinion_claim(self):
        claim = Claim(
            text="I believe solar power is the best energy source.",
            claim_type=ClaimType.OPINION,
            confidence=0.5,
        )
        service = FactCheckService()
        result = service.verify_claim(claim)
        assert result.status is not None

    def test_verify_with_sources(self):
        claim = Claim(text="AI improves productivity by 40%.", claim_type=ClaimType.NUMERIC, confidence=0.7)
        refs = [
            {"text": "AI improves productivity by 40% according to multiple studies."},
            {"text": "Research confirms significant AI-driven productivity gains."},
            {"text": "AI has little impact on overall productivity metrics."},
        ]
        service = FactCheckService()
        result = service.verify_claim(claim, refs)
        assert result.source_count == 3

    def test_cache_works(self):
        claim = Claim(text="Test claim for cache.", claim_type=ClaimType.FACTUAL, confidence=0.5)
        service = FactCheckService(cache_ttl_minutes=60)
        result1 = service.verify_claim(claim)
        result2 = service.verify_claim(claim)
        assert result1.checked_at == result2.checked_at  # Cached

    def test_cache_stats(self):
        service = FactCheckService()
        claim = Claim(text="Cache test", claim_type=ClaimType.FACTUAL, confidence=0.5)
        service.verify_claim(claim)
        stats = service.get_cache_stats()
        assert stats["cached_entries"] == 1

    def test_clear_cache(self):
        service = FactCheckService()
        claim = Claim(text="Clear test", claim_type=ClaimType.FACTUAL, confidence=0.5)
        service.verify_claim(claim)
        service.clear_cache()
        stats = service.get_cache_stats()
        assert stats["cached_entries"] == 0

    def test_verify_source(self):
        claims = [
            Claim(text="Fact A", claim_type=ClaimType.FACTUAL, confidence=0.8),
            Claim(text="Opinion B", claim_type=ClaimType.OPINION, confidence=0.4),
        ]
        service = FactCheckService()
        summary = service.verify_source("https://test.com", claims)
        assert summary["total_claims"] == 2
        assert "verified" in summary

    def test_numeric_claim_verification(self):
        claim = Claim(
            text="Revenue grew by 25%.",
            claim_type=ClaimType.NUMERIC,
            confidence=0.7,
        )
        refs = [
            {"text": "Revenue grew by 25% in Q1."},
            {"text": "The company reported 25% revenue growth."},
        ]
        service = FactCheckService()
        result = service.verify_claim(claim, refs)
        assert result.supporting_sources > 0

    def test_verification_result_to_dict(self):
        claim = Claim(text="Test", claim_type=ClaimType.FACTUAL, confidence=0.5)
        service = FactCheckService()
        result = service.verify_claim(claim)
        d = result.to_dict()
        assert "claim_text" in d
        assert "status" in d
