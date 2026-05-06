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
Tests for authority_scorer module
"""

import pytest

from deepclaw.validation.authority_scorer import (
    AuthorReputation,
    AuthorityScorer,
    score_author,
    score_authors,
)


class TestAuthorReputation:
    """Tests for AuthorReputation dataclass"""

    def test_defaults(self):
        rep = AuthorReputation()
        assert rep.overall_score == 0.5
        assert rep.tier == "moderate"

    def test_tier_expert(self):
        rep = AuthorReputation(overall_score=0.85)
        assert rep.tier == "expert"

    def test_tier_credible(self):
        rep = AuthorReputation(overall_score=0.7)
        assert rep.tier == "credible"

    def test_tier_unknown(self):
        rep = AuthorReputation(overall_score=0.3)
        assert rep.tier == "unknown"

    def test_to_dict(self):
        rep = AuthorReputation(
            name="Dr. John Smith",
            has_credentials=True,
            institution="MIT",
            institution_score=0.95,
            overall_score=0.85,
        )
        d = rep.to_dict()
        assert d["name"] == "Dr. John Smith"
        assert d["institution"] == "MIT"
        assert d["overall_score"] == 0.85


class TestAuthorityScorer:
    """Tests for AuthorityScorer"""

    def test_professor_with_mit(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_name="Dr. John Smith",
            author_info={
                "credentials": "Professor, Ph.D.",
                "institution": "MIT",
                "citation_count": 5000,
            },
        )
        assert result.overall_score >= 0.6
        assert result.is_known_institution
        assert result.tier in ("expert", "credible")

    def test_phd_student(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_name="Jane Doe",
            author_info={
                "credentials": "Ph.D. Candidate",
                "institution": "Stanford University",
                "citation_count": 15,
            },
        )
        assert 0.5 <= result.overall_score <= 0.85

    def test_no_author_info(self):
        scorer = AuthorityScorer()
        result = scorer.score()
        assert result.overall_score == 0.3
        assert result.tier == "unknown"

    def test_empty_strings(self):
        scorer = AuthorityScorer()
        result = scorer.score(author_name="", author_info={})
        assert 0.0 <= result.overall_score <= 0.5

    def test_known_institution(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_name="Scientist",
            author_info={
                "institution": "Google DeepMind",
                "citation_count": 1000,
            },
        )
        assert result.is_known_institution
        assert result.institution_score >= 0.8

    def test_unknown_institution(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_name="Unknown Author",
            author_info={
                "institution": "Random Blog Inc",
            },
        )
        assert not result.is_known_institution or result.institution_score <= 0.5

    def test_high_citation_count(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_name="Prolific Author",
            author_info={"citation_count": 15000},
        )
        assert result.citation_score == 1.0

    def test_zero_citations(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_name="New Author",
            author_info={"citation_count": 0},
        )
        assert result.citation_score <= 0.3

    def test_weight_validation(self):
        with pytest.raises(ValueError):
            AuthorityScorer(
                credential_weight=1.0,
                institution_weight=1.0,
                citation_weight=1.0,
                recognition_weight=1.0,
            )

    def test_custom_weights(self):
        scorer = AuthorityScorer(
            credential_weight=0.1,
            institution_weight=0.5,
            citation_weight=0.3,
            recognition_weight=0.1,
        )
        result = scorer.score(
            author_name="Test",
            author_info={
                "institution": "MIT",
            },
        )
        assert 0.0 <= result.overall_score <= 1.0

    def test_score_batch(self):
        scorer = AuthorityScorer()
        authors = [
            {
                "name": "Author A",
                "info": {"institution": "MIT", "citation_count": 1000},
            },
            {
                "name": "Author B",
                "info": {"institution": "Unknown", "citation_count": 5},
            },
        ]
        results = scorer.score_batch(authors)
        assert len(results) == 2
        assert results[0].overall_score > results[1].overall_score

    def test_known_author_recognition(self):
        scorer = AuthorityScorer()
        result = scorer.score(author_name="Geoffrey Hinton")
        assert result.overall_score > 0.4

    def test_academic_institution_detected(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_info={"institution": "Some University of Technology"},
        )
        assert result.institution_score >= 0.6

    def test_research_lab_detected(self):
        scorer = AuthorityScorer()
        result = scorer.score(
            author_info={"institution": "Advanced Research Laboratory"},
        )
        assert result.institution_score >= 0.5

    def test_credential_score_boost(self):
        scorer = AuthorityScorer()
        result_with = scorer.score(
            author_info={"credentials": "Professor, Ph.D."},
        )
        result_without = scorer.score(
            author_info={"credentials": ""},
        )
        assert result_with.credential_score > result_without.credential_score


class TestConvenienceFunctions:
    """Tests for convenience functions"""

    def test_score_author(self):
        result = score_author(
            author_name="Dr. Test",
            author_info={
                "credentials": "Ph.D.",
                "institution": "Stanford University",
                "citation_count": 500,
            },
        )
        assert isinstance(result, AuthorReputation)
        assert result.overall_score >= 0.5

    def test_score_authors(self):
        results = score_authors([
            {"name": "A", "info": {"institution": "MIT"}},
            {"name": "B", "info": {"institution": "Unknown"}},
        ])
        assert len(results) == 2
        assert isinstance(results[0], AuthorReputation)
