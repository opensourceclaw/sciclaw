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
Source Validation API

Validates external sources with URL accessibility checks, SSL verification,
and content integrity assessment. Extends SourceValidator from
deepclaw.tools.source_validation with additional capabilities.
"""

import re
import logging
import socket
import ssl
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
from dataclasses import dataclass, field
from datetime import datetime
import requests

from deepclaw.tools.source_validation import (
    SourceValidator as BaseSourceValidator,
    ValidationResult as BaseValidationResult,
    ValidationStatus,
    QualityScore,
    DEFAULT_TIMEOUT,
    BLOCKED_DOMAINS,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Extended data classes
# ============================================================================

@dataclass
class SSLInfo:
    """SSL/TLS certificate information"""
    is_valid: bool = False
    has_ssl: bool = False
    issuer: Optional[str] = None
    subject: Optional[str] = None
    expires_on: Optional[datetime] = None
    days_remaining: Optional[int] = None
    version: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "has_ssl": self.has_ssl,
            "issuer": self.issuer,
            "subject": self.subject,
            "expires_on": self.expires_on.isoformat() if self.expires_on else None,
            "days_remaining": self.days_remaining,
            "version": self.version,
            "error": self.error,
        }


@dataclass
class ContentIntegrity:
    """Content integrity assessment"""
    content_length: int = 0
    has_title: bool = False
    has_meta_description: bool = False
    is_paywalled: bool = False
    word_count: Optional[int] = None
    reading_time_minutes: Optional[float] = None
    content_type: Optional[str] = None
    issues: List[str] = field(default_factory=list)
    score: float = 0.5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content_length": self.content_length,
            "has_title": self.has_title,
            "has_meta_description": self.has_meta_description,
            "is_paywalled": self.is_paywalled,
            "word_count": self.word_count,
            "reading_time_minutes": self.reading_time_minutes,
            "content_type": self.content_type,
            "issues": self.issues,
            "score": self.score,
        }


@dataclass
class ExtendedValidationResult:
    """Extended validation result with SSL and content integrity info"""
    url: str
    status: ValidationStatus
    quality_score: QualityScore = QualityScore.AVERAGE
    error_message: Optional[str] = None
    status_code: Optional[int] = None
    content_length: int = 0
    content_type: Optional[str] = None
    response_time: float = 0.0
    ssl_info: Optional[SSLInfo] = None
    content_integrity: Optional[ContentIntegrity] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_valid(self) -> bool:
        return self.status == ValidationStatus.VALID

    @property
    def is_recommended(self) -> bool:
        ssl_ok = self.ssl_info is None or self.ssl_info.is_valid
        integrity_ok = (
            self.content_integrity is None
            or self.content_integrity.score >= 0.4
        )
        return (
            self.is_valid
            and self.quality_score.value >= QualityScore.GOOD.value
            and ssl_ok
            and integrity_ok
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "status": self.status.value,
            "quality_score": self.quality_score.value,
            "error_message": self.error_message,
            "status_code": self.status_code,
            "content_length": self.content_length,
            "content_type": self.content_type,
            "response_time": self.response_time,
            "ssl_info": self.ssl_info.to_dict() if self.ssl_info else None,
            "content_integrity": (
                self.content_integrity.to_dict()
                if self.content_integrity
                else None
            ),
            "metadata": self.metadata,
        }


# ============================================================================
# SSL Checker
# ============================================================================

class SSLChecker:
    """Checks SSL/TLS certificate validity for a URL"""

    def check_ssl(self, url: str) -> SSLInfo:
        """Check SSL certificate for a URL

        Args:
            url: URL to check

        Returns:
            SSLInfo with certificate details
        """
        if not url.startswith("https://"):
            return SSLInfo(
                is_valid=False,
                has_ssl=False,
                error="Not HTTPS",
            )

        try:
            parsed = urlparse(url)
            hostname = parsed.hostname
            if not hostname:
                return SSLInfo(
                    is_valid=False,
                    has_ssl=False,
                    error="Invalid hostname",
                )

            context = ssl.create_default_context()
            with socket.create_connection(
                (hostname, parsed.port or 443), timeout=5
            ) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    if not cert:
                        return SSLInfo(
                            is_valid=False,
                            has_ssl=True,
                            error="No certificate presented",
                        )

                    # Parse certificate details
                    issuer = self._format_issuer(cert.get("issuer", []))
                    subject = self._format_subject(cert.get("subject", []))
                    expires_on = self._parse_expiry(cert.get("notAfter"))

                    days_remaining = None
                    if expires_on:
                        days_remaining = (expires_on - datetime.now()).days

                    return SSLInfo(
                        is_valid=days_remaining is not None and days_remaining > 0,
                        has_ssl=True,
                        issuer=issuer,
                        subject=subject,
                        expires_on=expires_on,
                        days_remaining=days_remaining,
                        version=f"TLS {ssock.version()}" if ssock.version() else None,
                    )

        except ssl.SSLCertVerificationError as e:
            return SSLInfo(
                is_valid=False,
                has_ssl=True,
                error=f"SSL verification failed: {e.reason}",
            )
        except (socket.timeout, ConnectionError, OSError) as e:
            return SSLInfo(
                is_valid=False,
                has_ssl=url.startswith("https://"),
                error=f"Connection failed: {str(e)}",
            )

    @staticmethod
    def _format_issuer(issuer: List) -> Optional[str]:
        """Format certificate issuer from tuple list"""
        if not issuer:
            return None
        orgs = [v for k, v in issuer if k == "organizationName"]
        return orgs[0] if orgs else None

    @staticmethod
    def _format_subject(subject: List) -> Optional[str]:
        """Format certificate subject from tuple list"""
        if not subject:
            return None
        cns = [v for k, v in subject if k == "commonName"]
        return cns[0] if cns else None

    @staticmethod
    def _parse_expiry(not_after: Optional[str]) -> Optional[datetime]:
        """Parse certificate expiry date"""
        if not not_after:
            return None
        try:
            return datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
        except ValueError:
            try:
                from datetime import timezone
                return datetime.strptime(
                    not_after, "%Y-%m-%dT%H:%M:%S"
                ).replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        return None


# ============================================================================
# Content Integrity Checker
# ============================================================================

class ContentIntegrityChecker:
    """Checks content quality and integrity"""

    # Paywall indicators
    PAYWALL_PATTERNS = [
        r"subscribe to (read|continue)",
        r"paywall",
        r"premium (article|content)",
        r"sign in to (read|continue)",
        r"login to (read|continue)",
        r"register to (read|continue)",
        r"create an account to (read|continue)",
    ]

    def check(self, html_content: str, content_type: str = "") -> ContentIntegrity:
        """Check content integrity from HTML

        Args:
            html_content: Raw HTML content
            content_type: Content-Type header value

        Returns:
            ContentIntegrity assessment
        """
        issues: List[str] = []
        score = 0.5

        content_length = len(html_content)

        # Check for title
        has_title = bool(re.search(r"<title[^>]*>([^<]+)</title>", html_content, re.I))
        if not has_title:
            issues.append("Missing <title> tag")
            score -= 0.1

        # Check for meta description
        has_meta = bool(
            re.search(
                r'<meta[^>]*name=["\']description["\'][^>]*>',
                html_content,
                re.I,
            )
        )
        if not has_meta:
            issues.append("Missing meta description")
            score -= 0.05

        # Check for paywalls
        is_paywalled = self._detect_paywall(html_content)
        if is_paywalled:
            issues.append("Detected paywall/subscription wall")
            score -= 0.2

        # Word count estimation (rough: strip HTML tags)
        text = re.sub(r"<[^>]+>", " ", html_content)
        text = re.sub(r"\s+", " ", text).strip()
        words = text.split()
        word_count = len(words)

        if word_count < 100:
            issues.append("Very low word count (<100)")
            score -= 0.15
        elif word_count < 300:
            score -= 0.05
        elif word_count > 5000:
            score += 0.05

        # Reading time (avg 200 wpm)
        reading_time = word_count / 200 if word_count else 0

        # Content length score
        if content_length < 1000:
            score -= 0.1
        elif content_length > 50000:
            score += 0.05

        return ContentIntegrity(
            content_length=content_length,
            has_title=has_title,
            has_meta_description=has_meta,
            is_paywalled=is_paywalled,
            word_count=word_count,
            reading_time_minutes=round(reading_time, 1),
            content_type=content_type,
            issues=issues,
            score=round(max(0.0, min(1.0, score)), 3),
        )

    def _detect_paywall(self, html: str) -> bool:
        """Detect paywall/subscription wall indicators"""
        html_lower = html.lower()
        for pattern in self.PAYWALL_PATTERNS:
            if re.search(pattern, html_lower):
                return True
        return False


# ============================================================================
# Extended Source Validator
# ============================================================================

class ExternalSourceValidator(BaseSourceValidator):
    """Extended source validator with SSL and content integrity checks

    Extends SourceValidator with additional validation capabilities
    while maintaining full backward compatibility.
    """

    def __init__(self, timeout: int = DEFAULT_TIMEOUT):
        """Initialize extended validator

        Args:
            timeout: Request timeout in seconds
        """
        super().__init__(timeout)
        self.ssl_checker = SSLChecker()
        self.integrity_checker = ContentIntegrityChecker()

    def validate_with_ssl(self, url: str) -> ExtendedValidationResult:
        """Validate URL including SSL certificate check

        Args:
            url: URL to validate

        Returns:
            ExtendedValidationResult with SSL info
        """
        # Run base validation
        base_result = self.validate_url(url)

        # Add SSL check
        ssl_info = self.ssl_checker.check_ssl(url)

        return ExtendedValidationResult(
            url=url,
            status=base_result.status,
            quality_score=base_result.quality_score,
            error_message=base_result.error_message,
            status_code=base_result.status_code,
            content_length=base_result.content_length,
            content_type=base_result.content_type,
            response_time=base_result.response_time,
            ssl_info=ssl_info,
            metadata=base_result.metadata,
        )

    def validate_with_integrity(
        self,
        url: str,
        html_content: str = "",
    ) -> ExtendedValidationResult:
        """Validate URL including content integrity check

        Args:
            url: URL to validate
            html_content: Optional HTML content for integrity check

        Returns:
            ExtendedValidationResult with content integrity info
        """
        # Run base validation
        base_result = self.validate_url(url)

        # Add SSL check
        ssl_info = self.ssl_checker.check_ssl(url)

        # Add content integrity
        integrity = None
        if html_content:
            integrity = self.integrity_checker.check(
                html_content, base_result.content_type or ""
            )

        return ExtendedValidationResult(
            url=url,
            status=base_result.status,
            quality_score=base_result.quality_score,
            error_message=base_result.error_message,
            status_code=base_result.status_code,
            content_length=base_result.content_length,
            content_type=base_result.content_type,
            response_time=base_result.response_time,
            ssl_info=ssl_info,
            content_integrity=integrity,
            metadata=base_result.metadata,
        )

    def validate_batch(
        self,
        urls: List[str],
        with_ssl: bool = True,
    ) -> List[ExtendedValidationResult]:
        """Validate multiple URLs with optional SSL check

        Args:
            urls: List of URLs
            with_ssl: Include SSL check

        Returns:
            List of ExtendedValidationResult
        """
        results = []
        for url in urls:
            if with_ssl:
                result = self.validate_with_ssl(url)
            else:
                result = self.validate_with_integrity(url)
            results.append(result)
        return results


# ============================================================================
# Convenience functions
# ============================================================================

def validate_source_extended(url: str) -> ExtendedValidationResult:
    """Validate a source with SSL check

    Args:
        url: URL to validate

    Returns:
        ExtendedValidationResult
    """
    validator = ExternalSourceValidator()
    return validator.validate_with_ssl(url)


def validate_sources_batch(
    urls: List[str],
    with_ssl: bool = True,
) -> List[ExtendedValidationResult]:
    """Validate multiple sources

    Args:
        urls: List of URLs
        with_ssl: Include SSL check

    Returns:
        List of ExtendedValidationResult
    """
    validator = ExternalSourceValidator()
    return validator.validate_batch(urls, with_ssl)


__all__ = [
    "SSLInfo",
    "ContentIntegrity",
    "ExtendedValidationResult",
    "SSLChecker",
    "ContentIntegrityChecker",
    "ExternalSourceValidator",
    "validate_source_extended",
    "validate_sources_batch",
]
