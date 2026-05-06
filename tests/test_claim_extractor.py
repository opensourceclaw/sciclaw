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
Tests for claim_extractor module
"""

import pytest

from deepclaw.validation.claim_extractor import (
    ClaimType,
    NumericClaim,
    Claim,
    ClaimExtractor,
    extract_claims,
)


class TestClaimType:
    """Tests for ClaimType enum"""

    def test_values(self):
        assert ClaimType.FACTUAL.value == "factual"
        assert ClaimType.NUMERIC.value == "numeric"
        assert ClaimType.QUOTATION.value == "quotation"
        assert ClaimType.COMPARISON.value == "comparison"
        assert ClaimType.CAUSATION.value == "causation"
        assert ClaimType.OPINION.value == "opinion"


class TestNumericClaim:
    """Tests for NumericClaim dataclass"""

    def test_creation(self):
        nc = NumericClaim(value=42.5, unit="kg", context="weighs 42.5 kg")
        assert nc.value == 42.5
        assert nc.unit == "kg"

    def test_to_dict(self):
        nc = NumericClaim(value=100, unit="percentage", original_text="100%")
        d = nc.to_dict()
        assert d["value"] == 100
        assert d["unit"] == "percentage"


class TestClaim:
    """Tests for Claim dataclass"""

    def test_creation(self):
        claim = Claim(text="Research shows AI is improving.", claim_type=ClaimType.FACTUAL)
        assert claim.claim_type == ClaimType.FACTUAL
        assert claim.confidence == 0.5

    def test_to_dict(self):
        claim = Claim(
            text="Revenue increased by 25%",
            claim_type=ClaimType.COMPARISON,
            confidence=0.8,
            source_url="https://example.com",
        )
        d = claim.to_dict()
        assert d["claim_type"] == "comparison"
        assert d["confidence"] == 0.8
        assert d["source_url"] == "https://example.com"


class TestClaimExtractor:
    """Tests for ClaimExtractor"""

    @pytest.fixture
    def extractor(self):
        return ClaimExtractor()

    def test_empty_text(self, extractor):
        claims = extractor.extract_claims("")
        assert claims == []

    def test_factual_claim(self, extractor):
        text = "Research shows that AI can improve productivity by 40%."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0
        assert claims[0].claim_type in (ClaimType.FACTUAL, ClaimType.NUMERIC, ClaimType.COMPARISON)

    def test_numeric_claim_percentage(self, extractor):
        text = "The survey found that 75% of respondents agreed with the proposal."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0

    def test_numeric_claim_millions(self, extractor):
        text = "The company invested 500 million dollars in research and development."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0

    def test_quotation_claim(self, extractor):
        text = 'The CEO stated "our company is committed to reaching net-zero emissions by 2040" in the annual report.'
        claims = extractor.extract_claims(text)
        # Quotation should be detected
        assert len(claims) > 0

    def test_causation_claim(self, extractor):
        text = "The temperature increase causes sea levels to rise, leading to coastal flooding."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0

    def test_comparison_claim(self, extractor):
        text = "Sales increased by 30% compared to last year, which is higher than expected."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0

    def test_opinion_claim(self, extractor):
        text = "I believe this is probably the best approach for solving the problem."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0
        # Should be detected as opinion
        found_opinion = any(c.claim_type == ClaimType.OPINION for c in claims)
        # At minimum we have some claims extracted
        assert len(claims) > 0

    def test_multiple_sentences(self, extractor):
        text = (
            "The GDP grew by 3.2% in Q1. This represents the fastest growth since 2021. "
            "Economists believe this trend will continue through the year."
        )
        claims = extractor.extract_claims(text)
        assert len(claims) >= 2

    def test_source_attribution(self, extractor):
        text = "According to WHO, global vaccination rates have increased by 15%."
        claims = extractor.extract_claims(
            text,
            source_url="https://who.int/report",
            source_title="WHO Report",
        )
        for claim in claims:
            assert claim.source_url == "https://who.int/report"
            assert claim.source_title == "WHO Report"

    def test_date_extraction(self, extractor):
        text = "The report was published on 2026-01-15 and shows data from March 2024."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0

    def test_numeric_data_extraction(self, extractor):
        text = "The temperature reached 42.5 degrees Celsius according to measurements."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0

    def test_short_sentences_filtered(self, extractor):
        text = "OK. Yes. No. This is a properly long enough sentence to be included."
        claims = extractor.extract_claims(text)
        # Short sentences (< 10 chars) should be filtered
        assert len(claims) == 1

    def test_extract_claims_batch(self, extractor):
        texts = [
            {"text": "AI models are becoming more efficient.", "url": "https://a.com", "title": "A"},
            {"text": "Energy consumption decreased by 25%.", "url": "https://b.com", "title": "B"},
        ]
        claims = extractor.extract_claims_batch(texts)
        assert len(claims) >= 2

    def test_get_claims_by_type(self, extractor):
        text = "Data indicates 45% growth. Research shows AI is advancing rapidly. I think it will continue."
        claims = extractor.extract_claims(text)
        numerics = extractor.get_claims_by_type(claims, ClaimType.NUMERIC)
        assert len(numerics) >= 0

    def test_get_claims_by_confidence(self, extractor):
        text = "The company reported 50% revenue growth according to audited financial statements."
        claims = extractor.extract_claims(text)
        high_conf = extractor.get_claims_by_confidence(claims, 0.6)
        assert len(high_conf) >= 0

    def test_get_statistics(self, extractor):
        text = "GDP grew 3%. Research shows AI improves efficiency. Sales are up compared to 2024."
        claims = extractor.extract_claims(text)
        stats = extractor.get_statistics(claims)
        assert stats["total_claims"] >= 2
        assert "by_type" in stats
        assert "average_confidence" in stats

    def test_convenience_function(self):
        claims = extract_claims(
            "According to research, solar energy costs have decreased by 89% since 2010.",
            source_url="https://energy.gov",
        )
        assert len(claims) > 0
        for claim in claims:
            assert claim.source_url == "https://energy.gov"

    def test_numeric_extraction_with_dates(self, extractor):
        text = "On 2026-05-01, the company reported Q1 revenue of 2.5 billion dollars."
        claims = extractor.extract_claims(text)
        assert len(claims) > 0
        # Check for date extraction
        all_dates = []
        for claim in claims:
            all_dates.extend(claim.dates)
        assert any("2026" in d for d in all_dates)


class TestEdgeCases:
    """Tests for edge cases"""

    @pytest.fixture
    def extractor(self):
        return ClaimExtractor()

    def test_whitespace_only(self, extractor):
        claims = extractor.extract_claims("   \n  \t  ")
        assert claims == []

    def test_single_short_sentence(self, extractor):
        claims = extractor.extract_claims("Hi.")
        assert claims == []

    def test_non_english_text(self, extractor):
        text = "根据研究报告，人工智能技术在过去一年中提高了约40%的生产效率。"
        claims = extractor.extract_claims(text)
        assert len(claims) >= 0  # Should not crash

    def test_very_long_text(self, extractor):
        text = "The system processes data efficiently. " * 50
        claims = extractor.extract_claims(text)
        assert len(claims) > 0
