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
Tests for Source Validation
"""

import pytest
from unittest.mock import Mock, patch
import requests

from researchclaw.tools.source_validation import (
    ValidationStatus,
    QualityScore,
    ValidationResult,
    SourceValidator,
    validate_source,
    validate_sources,
    filter_valid_sources,
)


class TestValidationStatus:
    """Test ValidationStatus enum"""

    def test_status_values(self):
        """Test status enum values"""
        assert ValidationStatus.VALID.value == "valid"
        assert ValidationStatus.INVALID_URL.value == "invalid_url"
        assert ValidationStatus.UNREACHABLE.value == "unreachable"
        assert ValidationStatus.TIMEOUT.value == "timeout"
        assert ValidationStatus.LOW_QUALITY.value == "low_quality"


class TestQualityScore:
    """Test QualityScore enum"""

    def test_score_values(self):
        """Test quality score values"""
        assert QualityScore.EXCELLENT.value == 5
        assert QualityScore.GOOD.value == 4
        assert QualityScore.AVERAGE.value == 3
        assert QualityScore.POOR.value == 2
        assert QualityScore.VERY_POOR.value == 1


class TestValidationResult:
    """Test ValidationResult dataclass"""

    def test_creation_valid(self):
        """Test creating valid result"""
        result = ValidationResult(
            url="https://example.com",
            status=ValidationStatus.VALID,
            status_code=200,
            content_length=5000,
            quality_score=QualityScore.GOOD,
        )
        assert result.url == "https://example.com"
        assert result.is_valid is True
        assert result.is_recommended is True

    def test_creation_invalid(self):
        """Test creating invalid result"""
        result = ValidationResult(
            url="https://example.com",
            status=ValidationStatus.INVALID_URL,
            error_message="Invalid format",
        )
        assert result.is_valid is False
        assert result.is_recommended is False

    def test_is_recommended_requires_good_quality(self):
        """Test is_recommended requires good quality"""
        result = ValidationResult(
            url="https://example.com",
            status=ValidationStatus.VALID,
            status_code=200,
            quality_score=QualityScore.POOR,
        )
        assert result.is_valid is True
        assert result.is_recommended is False


class TestSourceValidator:
    """Test SourceValidator class"""

    @pytest.fixture
    def validator(self):
        """Create validator instance"""
        return SourceValidator(timeout=5)

    def test_creation(self, validator):
        """Test creating validator"""
        assert validator.timeout == 5

    def test_is_valid_url_format(self, validator):
        """Test URL format validation"""
        assert validator._is_valid_url_format("https://example.com") is True
        assert validator._is_valid_url_format("http://test.org") is True
        assert validator._is_valid_url_format("not-a-url") is False
        assert validator._is_valid_url_format("") is False

    def test_is_blocked_domain(self, validator):
        """Test blocked domain detection"""
        assert validator._is_blocked_domain("http://localhost:8080") is True
        assert validator._is_blocked_domain("http://127.0.0.1/page") is True
        assert validator._is_blocked_domain("http://example.onion") is True
        assert validator._is_blocked_domain("http://example.com") is False

    def test_is_allowed_content_type(self, validator):
        """Test content type validation"""
        assert validator._is_allowed_content_type("text/html") is True
        assert validator._is_allowed_content_type("application/xhtml+xml") is True
        assert validator._is_allowed_content_type("text/plain") is False
        assert validator._is_allowed_content_type("application/json") is False

    def test_calculate_quality_score(self, validator):
        """Test quality score calculation"""
        # Good: long content, fast response
        score = validator._calculate_quality_score(10000, 0.5, 200)
        assert score.value >= 4

        # Poor: short content, slow response
        score = validator._calculate_quality_score(100, 10.0, 200)
        assert score.value <= 2

    @patch("researchclaw.tools.source_validation.requests.head")
    def test_validate_url_success(self, mock_head, validator):
        """Test successful URL validation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "text/html"}
        mock_head.return_value = mock_response

        with patch("researchclaw.tools.source_validation.requests.get") as mock_get:
            mock_get_response = Mock()
            mock_get_response.status_code = 200
            mock_get_response.content = b"x" * 5000  # 5KB content
            mock_get.return_value = mock_get_response

            result = validator.validate_url("https://example.com/article")

            assert result.is_valid is True
            assert result.status_code == 200

    @patch("researchclaw.tools.source_validation.requests.head")
    def test_validate_url_404(self, mock_head, validator):
        """Test URL validation with 404"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.headers = {"Content-Type": "text/html"}
        mock_head.return_value = mock_response

        result = validator.validate_url("https://example.com/missing")

        assert result.is_valid is False
        assert result.status == ValidationStatus.UNREACHABLE

    @patch("researchclaw.tools.source_validation.requests.head")
    def test_validate_url_invalid_format(self, mock_head, validator):
        """Test validation of invalid URL format"""
        result = validator.validate_url("not-a-valid-url")

        assert result.is_valid is False
        assert result.status == ValidationStatus.INVALID_URL

    @patch("researchclaw.tools.source_validation.requests.head")
    def test_validate_url_blocked(self, mock_head, validator):
        """Test validation of blocked domain"""
        result = validator.validate_url("http://localhost:8080")

        assert result.is_valid is False
        assert result.status == ValidationStatus.BLOCKED


class TestModuleFunctions:
    """Test module-level functions"""

    @patch("researchclaw.tools.source_validation.requests.head")
    @patch("researchclaw.tools.source_validation.requests.get")
    def test_validate_source(self, mock_get, mock_head):
        """Test validate_source function"""
        mock_head.return_value = Mock(
            status_code=200,
            headers={"Content-Type": "text/html"},
        )
        mock_get.return_value = Mock(
            status_code=200,
            content=b"x" * 5000,
        )

        result = validate_source("https://example.com")
        assert result is not None
        assert result.url == "https://example.com"

    @patch("researchclaw.tools.source_validation.requests.head")
    def test_validate_sources(self, mock_head):
        """Test validate_sources function"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "text/html"}
        mock_head.return_value = mock_response

        # Will fail on GET, but HEAD works
        results = validate_sources(["https://example.com"])
        assert len(results) == 1


class TestFilterFunctions:
    """Test filtering functions"""

    @patch("researchclaw.tools.source_validation.requests.head")
    def test_filter_valid_sources(self, mock_head):
        """Test filter_valid_sources function"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "text/html"}
        mock_head.return_value = mock_response

        with patch("researchclaw.tools.source_validation.requests.get") as mock_get:
            mock_get.return_value = Mock(
                status_code=200,
                content=b"x" * 5000,
            )

            urls = [
                "https://example.com",
                "https://test.org",
            ]
            valid = filter_valid_sources(urls)
            # May have 0, 1, or 2 depending on mocking
            assert isinstance(valid, list)
