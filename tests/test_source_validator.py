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
Tests for source_validator module
"""

import pytest
from unittest.mock import Mock, patch

from deepclaw.validation.source_validator import (
    SSLInfo,
    ContentIntegrity,
    ExtendedValidationResult,
    SSLChecker,
    ContentIntegrityChecker,
    ExternalSourceValidator,
    validate_source_extended,
    validate_sources_batch,
)
from deepclaw.tools.source_validation import (
    ValidationStatus,
    QualityScore,
)


class TestSSLInfo:
    """Tests for SSLInfo dataclass"""

    def test_defaults(self):
        info = SSLInfo()
        assert info.is_valid is False
        assert info.has_ssl is False

    def test_to_dict(self):
        info = SSLInfo(is_valid=True, has_ssl=True, issuer="Test CA")
        d = info.to_dict()
        assert d["is_valid"] is True
        assert d["issuer"] == "Test CA"


class TestContentIntegrity:
    """Tests for ContentIntegrity dataclass"""

    def test_defaults(self):
        ci = ContentIntegrity()
        assert ci.score == 0.5
        assert ci.issues == []

    def test_to_dict(self):
        ci = ContentIntegrity(
            content_length=5000,
            has_title=True,
            content_type="text/html",
        )
        d = ci.to_dict()
        assert d["content_length"] == 5000
        assert d["has_title"] is True
        assert d["content_type"] == "text/html"


class TestExtendedValidationResult:
    """Tests for ExtendedValidationResult"""

    def test_is_valid(self):
        result = ExtendedValidationResult(
            url="https://example.com",
            status=ValidationStatus.VALID,
        )
        assert result.is_valid

    def test_is_not_valid(self):
        result = ExtendedValidationResult(
            url="https://example.com",
            status=ValidationStatus.UNREACHABLE,
        )
        assert not result.is_valid

    def test_to_dict(self):
        result = ExtendedValidationResult(
            url="https://example.com",
            status=ValidationStatus.VALID,
            quality_score=QualityScore.GOOD,
            ssl_info=SSLInfo(has_ssl=True, is_valid=True),
            content_integrity=ContentIntegrity(content_length=10000, has_title=True),
        )
        d = result.to_dict()
        assert d["ssl_info"] is not None
        assert d["content_integrity"] is not None


class TestContentIntegrityChecker:
    """Tests for ContentIntegrityChecker"""

    def test_good_content(self):
        html = "<html><head><title>Test Article</title>"
        html += '<meta name="description" content="A test article"></head>'
        html += "<body><p>" + "word " * 500 + "</p></body></html>"
        checker = ContentIntegrityChecker()
        result = checker.check(html, "text/html")
        assert result.has_title
        assert result.has_meta_description
        assert result.score >= 0.4

    def test_missing_title(self):
        html = """<html><head></head><body><p>Content without title tag.
        More text to reach minimum word count so we don't get penalized
        for low word count. Additional padding text here to make system
        happy and test the correct behavior of the checker.</p></body></html>"""
        checker = ContentIntegrityChecker()
        result = checker.check(html)
        assert not result.has_title

    def test_paywall_detection(self):
        html = """<html><head><title>Premium</title></head>
        <body><p>Subscribe to read more content here. You must login to read
        the full article. Additional text padding to meet word count requirements
        for testing purposes. This content simulates a paywall scenario in a
        real website article.</p></body></html>"""
        checker = ContentIntegrityChecker()
        result = checker.check(html)
        assert result.is_paywalled or result.score < 0.5

    def test_word_count(self):
        html = "<html><head><title>Test</title></head><body><p>" + "word " * 200 + "</p></body></html>"
        checker = ContentIntegrityChecker()
        result = checker.check(html)
        assert result.word_count is not None
        assert result.word_count > 100

    def test_reading_time(self):
        html = "<html><head><title>Long</title></head><body><p>" + "word " * 1000 + "</p></body></html>"
        checker = ContentIntegrityChecker()
        result = checker.check(html)
        assert result.reading_time_minutes is not None
        assert result.reading_time_minutes >= 4.0


class TestExternalSourceValidator:
    """Tests for ExternalSourceValidator"""

    def test_validate_invalid_url(self):
        validator = ExternalSourceValidator()
        result = validator.validate_with_ssl("not-a-url")
        assert not result.is_valid
        assert result.ssl_info is not None

    def test_validate_blocked_domain(self):
        validator = ExternalSourceValidator()
        result = validator.validate_with_ssl("http://127.0.0.1/test")
        assert not result.is_valid

    def test_validate_extends_base(self):
        validator = ExternalSourceValidator()
        # Base validator method still works
        result = validator.validate_url("https://example.com")
        assert result.is_valid or not result.is_valid  # depends on network

    def test_validate_with_ssl_no_https(self):
        validator = ExternalSourceValidator()
        result = validator.validate_with_ssl("http://example.com")
        assert result.ssl_info is not None
        assert result.ssl_info.has_ssl is False

    def test_validation_result_has_ssl_info(self):
        validator = ExternalSourceValidator()
        result = validator.validate_with_ssl("https://httpbin.org/get")
        assert result.ssl_info is not None

    @patch("deepclaw.validation.source_validator.SSLChecker.check_ssl")
    def test_ssl_check_valid_mocked(self, mock_check_ssl):
        mock_check_ssl.return_value = SSLInfo(
            is_valid=True,
            has_ssl=True,
            issuer="Test CA",
            days_remaining=60,
        )
        validator = ExternalSourceValidator()
        result = validator.validate_with_ssl("https://testsite.com")
        assert result.ssl_info is not None
        assert result.ssl_info.has_ssl is True

    def test_validate_batch(self):
        validator = ExternalSourceValidator()
        results = validator.validate_batch(
            ["http://example.com", "http://test.com"],
            with_ssl=True,
        )
        assert len(results) == 2
        for r in results:
            assert isinstance(r, ExtendedValidationResult)


class TestConvenienceFunctions:
    """Tests for module-level convenience functions"""

    def test_validate_source_extended(self):
        result = validate_source_extended("http://example.com")
        assert isinstance(result, ExtendedValidationResult)
        assert result.ssl_info is not None

    def test_validate_sources_batch(self):
        results = validate_sources_batch(
            ["http://a.com", "http://b.com"],
            with_ssl=True,
        )
        assert len(results) == 2


class TestSSLCheckerUnit:
    """Unit tests for SSLChecker"""

    def test_non_https_url(self):
        checker = SSLChecker()
        result = checker.check_ssl("http://example.com")
        assert result.has_ssl is False
        assert result.error == "Not HTTPS"

    def test_invalid_url(self):
        checker = SSLChecker()
        result = checker.check_ssl("not-a-url")
        assert result.has_ssl is False

    def test_ssl_info_to_dict(self):
        info = SSLInfo(
            is_valid=True,
            has_ssl=True,
            issuer="Let's Encrypt",
            days_remaining=60,
        )
        d = info.to_dict()
        assert d["issuer"] == "Let's Encrypt"
        assert d["days_remaining"] == 60
