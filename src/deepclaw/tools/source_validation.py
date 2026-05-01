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
Source Validation Module

Validates URLs and content quality before extraction.
"""

import re
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
from dataclasses import dataclass, field
from enum import Enum
import requests

logger = logging.getLogger(__name__)


class ValidationStatus(Enum):
    """Validation status codes"""
    VALID = "valid"
    INVALID_URL = "invalid_url"
    UNREACHABLE = "unreachable"
    TIMEOUT = "timeout"
    LOW_QUALITY = "low_quality"
    BLOCKED = "blocked"
    ERROR = "error"


class QualityScore(Enum):
    """Content quality scores"""
    EXCELLENT = 5
    GOOD = 4
    AVERAGE = 3
    POOR = 2
    VERY_POOR = 1


@dataclass
class ValidationResult:
    """Result of URL validation"""
    url: str
    status: ValidationStatus
    quality_score: QualityScore = QualityScore.AVERAGE
    error_message: Optional[str] = None
    status_code: Optional[int] = None
    content_length: int = 0
    content_type: Optional[str] = None
    response_time: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_valid(self) -> bool:
        """Check if URL is valid and accessible"""
        return self.status == ValidationStatus.VALID

    @property
    def is_recommended(self) -> bool:
        """Check if source is recommended (valid + good quality)"""
        return self.is_valid and self.quality_score.value >= QualityScore.GOOD.value


# Blocked domains/patterns
BLOCKED_DOMAINS = [
    r"\.onion$",
    r"localhost",
    r"127\.0\.0\.1",
    r"0\.0\.0\.0",
    r"\.local$",
]

# Content type whitelist
ALLOWED_CONTENT_TYPES = [
    "text/html",
    "application/xhtml+xml",
]

# Minimum content length
MIN_CONTENT_LENGTH = 100

# Maximum content length (10MB)
MAX_CONTENT_LENGTH = 10 * 1024 * 1024

# Timeout for validation requests
DEFAULT_TIMEOUT = 10


class SourceValidator:
    """Validates URLs and content quality"""

    # Known ad/tracking domains to filter
    AD_DOMAINS = [
        "doubleclick.net",
        "googlesyndication.com",
        "googleadservices.com",
        "facebook.net/tr.js",
        "analytics.google.com",
        "hotjar.com",
        "mixpanel.com",
        "segment.io",
        "newrelic.com",
    ]

    def __init__(self, timeout: int = DEFAULT_TIMEOUT):
        """Initialize validator

        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout

    def validate_url(self, url: str) -> ValidationResult:
        """Validate a URL

        Args:
            url: URL to validate

        Returns:
            ValidationResult with validation status
        """
        # Check URL format
        if not self._is_valid_url_format(url):
            return ValidationResult(
                url=url,
                status=ValidationStatus.INVALID_URL,
                error_message="Invalid URL format",
            )

        # Check if domain is blocked
        if self._is_blocked_domain(url):
            return ValidationResult(
                url=url,
                status=ValidationStatus.BLOCKED,
                error_message="Domain is blocked",
            )

        # Try to reach the URL
        try:
            import time
            start_time = time.time()

            response = requests.head(
                url,
                timeout=self.timeout,
                allow_redirects=True,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; ResearchClaw/1.0)",
                },
            )

            response_time = time.time() - start_time

            # Check status code
            if response.status_code >= 400:
                return ValidationResult(
                    url=url,
                    status=ValidationStatus.UNREACHABLE,
                    status_code=response.status_code,
                    error_message=f"HTTP {response.status_code}",
                    response_time=response_time,
                )

            # Check content type
            content_type = response.headers.get("Content-Type", "")
            if not self._is_allowed_content_type(content_type):
                return ValidationResult(
                    url=url,
                    status=ValidationStatus.INVALID_URL,
                    content_type=content_type,
                    error_message="Unsupported content type",
                    response_time=response_time,
                )

            # Try GET request to check content length
            try:
                get_response = requests.get(
                    url,
                    timeout=self.timeout,
                    headers={
                        "User-Agent": "Mozilla/5.0 (compatible; ResearchClaw/1.0)",
                    },
                    stream=True,
                )
                content_length = len(get_response.content)

                # Check content length
                if content_length < MIN_CONTENT_LENGTH:
                    return ValidationResult(
                        url=url,
                        status=ValidationStatus.LOW_QUALITY,
                        status_code=get_response.status_code,
                        content_length=content_length,
                        content_type=content_type,
                        response_time=response_time,
                        error_message="Content too short",
                    )

                # Calculate quality score
                quality = self._calculate_quality_score(
                    content_length, response_time, get_response.status_code
                )

                return ValidationResult(
                    url=url,
                    status=ValidationStatus.VALID,
                    status_code=get_response.status_code,
                    quality_score=quality,
                    content_length=content_length,
                    content_type=content_type,
                    response_time=response_time,
                )

            except requests.Timeout:
                return ValidationResult(
                    url=url,
                    status=ValidationStatus.TIMEOUT,
                    error_message="Request timeout",
                    response_time=response_time,
                )

        except requests.RequestException as e:
            return ValidationResult(
                url=url,
                status=ValidationStatus.ERROR,
                error_message=str(e),
            )

    def validate_urls(self, urls: List[str]) -> List[ValidationResult]:
        """Validate multiple URLs

        Args:
            urls: List of URLs to validate

        Returns:
            List of ValidationResult
        """
        results = []
        for url in urls:
            result = self.validate_url(url)
            results.append(result)
        return results

    def filter_valid_urls(self, urls: List[str]) -> List[str]:
        """Filter list to only valid URLs

        Args:
            urls: List of URLs to filter

        Returns:
            List of valid URLs
        """
        results = self.validate_urls(urls)
        return [r.url for r in results if r.is_valid]

    def filter_recommended_urls(self, urls: List[str]) -> List[str]:
        """Filter list to only recommended URLs (valid + good quality)

        Args:
            urls: List of URLs to filter

        Returns:
            List of recommended URLs
        """
        results = self.validate_urls(urls)
        return [r.url for r in results if r.is_recommended]

    def _is_valid_url_format(self, url: str) -> bool:
        """Check if URL has valid format"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False

    def _is_blocked_domain(self, url: str) -> bool:
        """Check if domain is blocked"""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()

        for pattern in BLOCKED_DOMAINS:
            if re.search(pattern, domain):
                return True

        # Check for ad domains
        for ad_domain in self.AD_DOMAINS:
            if ad_domain in domain:
                return True

        return False

    def _is_allowed_content_type(self, content_type: str) -> bool:
        """Check if content type is allowed"""
        content_type = content_type.lower()
        return any(ct in content_type for ct in ALLOWED_CONTENT_TYPES)

    def _calculate_quality_score(
        self,
        content_length: int,
        response_time: float,
        status_code: int,
    ) -> QualityScore:
        """Calculate content quality score"""
        score = 3  # Start with average

        # Content length scoring
        if content_length > 10000:
            score += 1
        elif content_length < 500:
            score -= 1

        # Response time scoring
        if response_time < 1.0:
            score += 1
        elif response_time > 5.0:
            score -= 1

        # Clamp score
        score = max(1, min(5, score))

        return QualityScore(score)


def validate_source(url: str, timeout: int = DEFAULT_TIMEOUT) -> ValidationResult:
    """Validate a single URL

    Args:
        url: URL to validate
        timeout: Request timeout

    Returns:
        ValidationResult
    """
    validator = SourceValidator(timeout)
    return validator.validate_url(url)


def validate_sources(urls: List[str], timeout: int = DEFAULT_TIMEOUT) -> List[ValidationResult]:
    """Validate multiple URLs

    Args:
        urls: URLs to validate
        timeout: Request timeout

    Returns:
        List of ValidationResult
    """
    validator = SourceValidator(timeout)
    return validator.validate_urls(urls)


def filter_valid_sources(urls: List[str], timeout: int = DEFAULT_TIMEOUT) -> List[str]:
    """Filter to only valid URLs

    Args:
        urls: URLs to filter
        timeout: Request timeout

    Returns:
        List of valid URLs
    """
    validator = SourceValidator(timeout)
    return validator.filter_valid_urls(urls)


__all__ = [
    "ValidationStatus",
    "QualityScore",
    "ValidationResult",
    "SourceValidator",
    "validate_source",
    "validate_sources",
    "filter_valid_sources",
]
