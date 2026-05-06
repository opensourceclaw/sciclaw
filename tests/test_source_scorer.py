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
Tests for source_scorer module
"""

import pytest
from datetime import datetime, timedelta

from deepclaw.validation.source_scorer import (
    DomainReputation,
    FreshnessScore,
    SourceScore,
    DomainScorer,
    FreshnessScorer,
    SourceScorer,
    score_source,
    score_sources,
)


class TestDomainScorer:
    """Tests for DomainScorer"""

    def test_known_domain_high_reputation(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://arxiv.org/abs/2301.00001")
        assert rep.is_known
        assert rep.reputation_score >= 0.8
        assert rep.domain == "arxiv.org"

    def test_known_domain_wikipedia(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://en.wikipedia.org/wiki/Python")
        assert rep.is_known
        assert rep.reputation_score >= 0.8
        assert rep.domain == "en.wikipedia.org"

    def test_known_domain_low_reputation(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://medium.com/some-article")
        assert rep.is_known
        assert rep.reputation_score <= 0.5

    def test_educational_domain(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://cs.stanford.edu/research")
        assert rep.is_educational
        assert rep.reputation_score > 0.5

    def test_government_domain(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://www.nasa.gov/mission")
        assert rep.is_government or rep.is_known
        assert rep.reputation_score >= 0.7

    def test_unknown_domain(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://some-random-blog.example.com")
        assert not rep.is_known
        assert not rep.is_educational
        assert not rep.is_government

    def test_ssl_detection(self):
        scorer = DomainScorer()
        rep_https = scorer.score_domain("https://example.com")
        rep_http = scorer.score_domain("http://example.com")
        assert rep_https.has_ssl
        assert not rep_http.has_ssl

    def test_domain_with_www(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://www.github.com/repo")
        assert rep.domain == "github.com"

    def test_domain_with_port(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("http://localhost:8080/test")
        assert rep.domain == "localhost"
        assert not rep.is_known

    def test_github_known_score(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://github.com/user/repo")
        assert rep.is_known
        assert 0.7 <= rep.reputation_score <= 0.9

    def test_to_dict(self):
        scorer = DomainScorer()
        rep = scorer.score_domain("https://example.edu/test")
        d = rep.to_dict()
        assert d["domain"] == "example.edu"
        assert isinstance(d["reputation_score"], float)
        assert isinstance(d["factors"], dict)


class TestFreshnessScorer:
    """Tests for FreshnessScorer"""

    def test_very_recent(self):
        scorer = FreshnessScorer()
        today = datetime.now().strftime("%Y-%m-%d")
        score = scorer.score_freshness(today)
        assert score.freshness_score == 1.0
        assert score.category == "very_recent"

    def test_recent_60_days(self):
        scorer = FreshnessScorer()
        date_60d = (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d")
        score = scorer.score_freshness(date_60d)
        assert score.freshness_score == 0.9
        assert score.category == "recent"

    def test_current_120_days(self):
        scorer = FreshnessScorer()
        date_120d = (datetime.now() - timedelta(days=120)).strftime("%Y-%m-%d")
        score = scorer.score_freshness(date_120d)
        assert score.freshness_score == 0.7
        assert score.category == "current"

    def test_acceptable_200_days(self):
        scorer = FreshnessScorer()
        date_200d = (datetime.now() - timedelta(days=200)).strftime("%Y-%m-%d")
        score = scorer.score_freshness(date_200d)
        assert score.freshness_score == 0.5
        assert score.category == "acceptable"

    def test_dated_400_days(self):
        scorer = FreshnessScorer()
        date_400d = (datetime.now() - timedelta(days=400)).strftime("%Y-%m-%d")
        score = scorer.score_freshness(date_400d)
        assert score.freshness_score == 0.3
        assert score.category == "dated"

    def test_outdated_800_days(self):
        scorer = FreshnessScorer()
        date_800d = (datetime.now() - timedelta(days=800)).strftime("%Y-%m-%d")
        score = scorer.score_freshness(date_800d)
        assert score.freshness_score == 0.1
        assert score.category == "outdated"

    def test_no_date(self):
        scorer = FreshnessScorer()
        score = scorer.score_freshness(None)
        assert score.freshness_score == 0.5
        assert score.category == "unknown"

    def test_iso_format(self):
        scorer = FreshnessScorer()
        score = scorer.score_freshness("2026-01-15")
        assert score.pub_date is not None
        assert score.category is not None

    def test_mod_date_preferred(self):
        scorer = FreshnessScorer()
        old_date = (datetime.now() - timedelta(days=400)).strftime("%Y-%m-%d")
        recent_date = (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
        score = scorer.score_freshness(old_date, recent_date)
        assert score.freshness_score > 0.5  # uses more recent mod date

    def test_year_only_format(self):
        scorer = FreshnessScorer()
        score = scorer.score_freshness("2024")
        assert score.pub_date is not None
        assert score.pub_date.year == 2024

    def test_full_iso_format(self):
        scorer = FreshnessScorer()
        score = scorer.score_freshness("2026-04-15T10:30:00")
        assert score.pub_date is not None
        assert score.pub_date.month == 4

    def test_to_dict(self):
        scorer = FreshnessScorer()
        score = scorer.score_freshness("2026-05-01")
        d = score.to_dict()
        assert d["freshness_score"] == 1.0
        assert "pub_date" in d


class TestSourceScorer:
    """Tests for SourceScorer"""

    def test_high_quality_source(self):
        scorer = SourceScorer()
        result = scorer.score(
            url="https://arxiv.org/abs/paper",
            pub_date=datetime.now().strftime("%Y-%m-%d"),
            author_info={"credentials": "Ph.D.", "publication_count": 100},
        )
        assert result.combined_score >= 0.7
        assert result.domain_score > 0.5
        assert result.freshness_score > 0.5
        assert result.authority_score > 0.5

    def test_low_quality_source(self):
        scorer = SourceScorer()
        result = scorer.score(
            url="https://some-blog.wordpress.com/post",
            pub_date="2020-01-01",
        )
        assert result.combined_score < 0.6
        assert result.domain_score <= 0.5

    def test_missing_author_info(self):
        scorer = SourceScorer()
        result = scorer.score(
            url="https://example.com/article",
            pub_date="2025-01-01",
            author_info=None,
        )
        assert result.authority_score == 0.5

    def test_score_batch(self):
        scorer = SourceScorer()
        sources = [
            {"url": "https://arxiv.org/abs/1", "pub_date": "2026-05-01"},
            {"url": "https://medium.com/post", "pub_date": "2020-01-01"},
        ]
        results = scorer.score_batch(sources)
        assert len(results) == 2
        assert results[0].combined_score > results[1].combined_score

    def test_weight_validation(self):
        with pytest.raises(ValueError):
            SourceScorer(domain_weight=1.0, freshness_weight=1.0, authority_weight=1.0)

    def test_custom_weights(self):
        scorer = SourceScorer(
            domain_weight=0.5,
            freshness_weight=0.3,
            authority_weight=0.2,
        )
        result = scorer.score(
            url="https://example.com",
            pub_date="2026-05-01",
        )
        assert 0.0 <= result.combined_score <= 1.0

    def test_source_score_to_dict(self):
        scorer = SourceScorer()
        result = scorer.score(
            url="https://example.com",
            pub_date="2026-01-15",
        )
        d = result.to_dict()
        assert d["url"] == "https://example.com"
        assert "domain_score" in d
        assert "freshness_score" in d
        assert "combined_score" in d

    def test_authority_with_credentials(self):
        scorer = SourceScorer()
        result = scorer.score(
            url="https://example.com",
            author_info={"credentials": "Professor, Ph.D."},
        )
        assert result.authority_score > 0.5

    def test_authority_with_publications(self):
        scorer = SourceScorer()
        result_high = scorer.score(
            url="https://example.com",
            author_info={"publication_count": 100},
        )
        result_low = scorer.score(
            url="https://example.com",
            author_info={"publication_count": 5},
        )
        assert result_high.authority_score > result_low.authority_score

    def test_empty_url(self):
        scorer = SourceScorer()
        result = scorer.score(url="")
        assert result.combined_score is not None


class TestConvenienceFunctions:
    """Tests for module-level convenience functions"""

    def test_score_source(self):
        result = score_source(
            url="https://www.nasa.gov/news",
            pub_date="2026-05-01",
        )
        assert isinstance(result, SourceScore)
        assert result.domain_score >= 0.7

    def test_score_sources(self):
        sources = [
            {"url": "https://arxiv.org/abs/1"},
            {"url": "https://github.com/repo"},
        ]
        results = score_sources(sources)
        assert len(results) == 2
        for r in results:
            assert isinstance(r, SourceScore)


class TestFamousDomains:
    """Tests for domain reputation scoring of famous sites"""

    @pytest.mark.parametrize("url,expected_min", [
        ("https://www.nature.com/articles/xyz", 0.8),
        ("https://www.science.org/doi/xyz", 0.8),
        ("https://pubmed.ncbi.nlm.nih.gov/123", 0.8),
        ("https://www.who.int/news/item", 0.8),
        ("https://developer.mozilla.org/en-US/docs/Web", 0.8),
        ("https://www.reuters.com/article/xyz", 0.7),
        ("https://www.reddit.com/r/python", 0.2),
        ("https://random-person.blogspot.com/post", 0.2),
    ])
    def test_domain_scoring_range(self, url, expected_min):
        scorer = DomainScorer()
        rep = scorer.score_domain(url)
        assert rep.reputation_score >= expected_min, (
            f"Expected {url} to score >= {expected_min}, got {rep.reputation_score}"
        )
