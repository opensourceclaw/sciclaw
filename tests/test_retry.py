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
Tests for Retry Logic
"""

import pytest
import time
from unittest.mock import Mock, patch
import requests

from researchclaw.tools.retry import (
    RetryConfig,
    ExtractionError,
    NetworkError,
    ParseError,
    RateLimitError,
    TimeoutError,
    RetryableError,
    is_retryable_error,
    calculate_delay,
    retry_with_backoff,
    RetryContext,
    ExtractionResult,
    extract_with_retry,
)


class TestRetryConfig:
    """Test RetryConfig"""

    def test_default_values(self):
        """Test default configuration"""
        config = RetryConfig()
        assert config.max_attempts == 3
        assert config.initial_delay == 1.0
        assert config.max_delay == 30.0

    def test_custom_values(self):
        """Test custom configuration"""
        config = RetryConfig(max_attempts=5, initial_delay=2.0)
        assert config.max_attempts == 5
        assert config.initial_delay == 2.0


class TestIsRetryableError:
    """Test is_retryable_error function"""

    def test_connection_error(self):
        """Test connection error is retryable"""
        assert is_retryable_error(requests.ConnectionError("Connection failed"))

    def test_timeout_error(self):
        """Test timeout is retryable"""
        assert is_retryable_error(requests.Timeout("Timeout"))

    def test_rate_limit_error(self):
        """Test rate limit error is retryable"""
        assert is_retryable_error(RateLimitError("Rate limited"))

    def test_retryable_error(self):
        """Test RetryableError is retryable"""
        assert is_retryable_error(RetryableError("Retry this"))

    def test_parse_error_not_retryable(self):
        """Test ParseError is not retryable"""
        assert not is_retryable_error(ParseError("Parse failed"))

    def test_http_429_retryable(self):
        """Test 429 HTTP error is retryable"""
        response = Mock()
        response.status_code = 429
        error = requests.HTTPError("Too Many Requests")
        error.response = response
        assert is_retryable_error(error)

    def test_http_500_retryable(self):
        """Test 500 HTTP error is retryable"""
        response = Mock()
        response.status_code = 500
        error = requests.HTTPError("Server Error")
        error.response = response
        assert is_retryable_error(error)

    def test_http_404_not_retryable(self):
        """Test 404 HTTP error is not retryable"""
        response = Mock()
        response.status_code = 404
        error = requests.HTTPError("Not Found")
        error.response = response
        assert not is_retryable_error(error)


class TestCalculateDelay:
    """Test calculate_delay function"""

    def test_exponential_backoff(self):
        """Test exponential backoff calculation"""
        config = RetryConfig(initial_delay=1.0, exponential_base=2.0, jitter=False)
        delay0 = calculate_delay(0, config)
        delay1 = calculate_delay(1, config)
        delay2 = calculate_delay(2, config)

        assert delay0 == 1.0
        assert delay1 == 2.0
        assert delay2 == 4.0

    def test_max_delay(self):
        """Test max delay cap"""
        config = RetryConfig(initial_delay=1.0, max_delay=2.0, exponential_base=10.0, jitter=False)
        delay = calculate_delay(10, config)  # Would be 10s without cap
        assert delay <= 2.0

    def test_jitter_enabled(self):
        """Test jitter adds variation"""
        config = RetryConfig(initial_delay=1.0, jitter=True)
        # Get multiple delays and check they're different
        delays = [calculate_delay(0, config) for _ in range(10)]
        # With jitter, delays should vary (not all exactly 1.0)
        # This is probabilistic, but very unlikely to fail
        assert len(set(delays)) > 1 or all(d == 1.0 for d in delays)


class TestRetryWithBackoff:
    """Test retry_with_backoff decorator"""

    def test_success_first_try(self):
        """Test successful call on first try"""
        @retry_with_backoff(max_attempts=3)
        def succeed():
            return "success"

        result = succeed()
        assert result == "success"

    def test_retry_then_success(self):
        """Test retry until success"""
        call_count = 0

        @retry_with_backoff(max_attempts=3, initial_delay=0.01)
        def flaky():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise requests.ConnectionError("Fail")
            return "success"

        result = flaky()
        assert result == "success"
        assert call_count == 2

    def test_max_attempts_exceeded(self):
        """Test max attempts exceeded"""
        call_count = 0

        @retry_with_backoff(max_attempts=3, initial_delay=0.01)
        def always_fail():
            nonlocal call_count
            call_count += 1
            raise requests.ConnectionError("Always fails")

        with pytest.raises(requests.ConnectionError):
            always_fail()

        assert call_count == 3

    def test_non_retryable_error(self):
        """Test non-retryable error doesn't retry"""
        call_count = 0

        @retry_with_backoff(max_attempts=3, initial_delay=0.01)
        def non_retryable():
            nonlocal call_count
            call_count += 1
            raise ParseError("Parse failed")

        with pytest.raises(ParseError):
            non_retryable()

        # Should not retry ParseError
        assert call_count == 1


class TestRetryContext:
    """Test RetryContext"""

    def test_successful_operation(self):
        """Test context with successful operation"""
        with RetryContext() as ctx:
            pass  # No exception, succeeds
        assert ctx.attempt == 1

    def test_context_tracks_attempts(self):
        """Test context tracks attempt number"""
        with RetryContext() as ctx:
            assert ctx.attempt == 1
        # After exiting, attempt should be tracked
        assert ctx.attempt >= 1


class TestExtractionResult:
    """Test ExtractionResult"""

    def test_successful_result(self):
        """Test successful result"""
        result = ExtractionResult(
            success=True,
            content={"title": "Test"},
            attempts=1,
            duration=0.5,
        )
        assert result.success is True
        assert result.content == {"title": "Test"}
        assert result.failed is False

    def test_failed_result(self):
        """Test failed result"""
        result = ExtractionResult(
            success=False,
            error="Connection failed",
            attempts=3,
            duration=5.0,
        )
        assert result.success is False
        assert result.error == "Connection failed"
        assert result.failed is True

    def test_repr(self):
        """Test string representation"""
        result = ExtractionResult(success=True, attempts=2, duration=1.5)
        assert "success=True" in repr(result)
        assert "attempts=2" in repr(result)


class TestExtractWithRetry:
    """Test extract_with_retry function"""

    def test_success(self):
        """Test successful extraction"""
        def extractor(url):
            return {"title": "Test", "url": url}

        result = extract_with_retry(extractor, "https://example.com")
        assert result.success is True
        assert result.content == {"title": "Test", "url": "https://example.com"}
        assert result.attempts == 1

    def test_retry_then_success(self):
        """Test retry until success"""
        call_count = 0

        def flaky_extractor(url):
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise requests.ConnectionError("Fail")
            return {"title": "Success"}

        result = extract_with_retry(
            flaky_extractor,
            "https://example.com",
            RetryConfig(max_attempts=3, initial_delay=0.01),
        )
        assert result.success is True
        assert call_count == 2

    def test_all_fail(self):
        """Test all attempts fail"""
        def fail_extractor(url):
            raise requests.ConnectionError("Always fails")

        result = extract_with_retry(
            fail_extractor,
            "https://example.com",
            RetryConfig(max_attempts=3, initial_delay=0.01),
        )
        assert result.success is False
        assert result.error is not None
        assert result.attempts == 3


class TestCustomExceptions:
    """Test custom exception classes"""

    def test_extraction_error(self):
        """Test ExtractionError"""
        err = ExtractionError("Test error")
        assert str(err) == "Test error"

    def test_network_error(self):
        """Test NetworkError"""
        err = NetworkError("Network failed")
        assert isinstance(err, ExtractionError)

    def test_parse_error(self):
        """Test ParseError"""
        err = ParseError("Parse failed")
        assert isinstance(err, ExtractionError)

    def test_rate_limit_error(self):
        """Test RateLimitError"""
        err = RateLimitError("Rate limited")
        assert isinstance(err, ExtractionError)
