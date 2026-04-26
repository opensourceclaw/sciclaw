# Copyright 2026 Peter Cheng
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
Tests for summarization module - Error handling
"""

import pytest
from researchclaw.summarization.errors import (
    ErrorSeverity,
    SummarizationError,
    LLMError,
    RateLimitError,
    FallbackError,
    ValidationError,
    TimeoutError,
)


class TestErrorSeverity:
    """Test ErrorSeverity enum"""

    def test_error_severity_values(self):
        """Test ErrorSeverity values"""
        assert ErrorSeverity.LOW.value == "low"
        assert ErrorSeverity.MEDIUM.value == "medium"
        assert ErrorSeverity.HIGH.value == "high"
        assert ErrorSeverity.CRITICAL.value == "critical"


class TestSummarizationError:
    """Test SummarizationError base class"""

    def test_create_summarization_error(self):
        """Test creating a SummarizationError"""
        error = SummarizationError(
            message="Test error",
            severity=ErrorSeverity.MEDIUM,
            details={"key": "value"},
        )

        assert error.message == "Test error"
        assert error.severity == ErrorSeverity.MEDIUM
        assert error.details["key"] == "value"
        assert str(error) == "Test error"

    def test_error_with_original(self):
        """Test error with original exception"""
        original = ValueError("Original error")
        error = SummarizationError(
            message="Wrapped error",
            original_error=original,
        )

        assert error.original_error is original


class TestLLMError:
    """Test LLMError"""

    def test_create_llm_error(self):
        """Test creating an LLMError"""
        error = LLMError(
            message="API call failed",
            status_code=500,
            provider="deepseek",
        )

        assert error.message == "API call failed"
        assert error.status_code == 500
        assert error.provider == "deepseek"
        assert error.severity == ErrorSeverity.HIGH


class TestRateLimitError:
    """Test RateLimitError"""

    def test_create_rate_limit_error(self):
        """Test creating a RateLimitError"""
        error = RateLimitError(
            message="Rate limit exceeded",
            retry_after=60,
            provider="deepseek",
        )

        assert error.message == "Rate limit exceeded"
        assert error.retry_after == 60
        assert error.severity == ErrorSeverity.MEDIUM


class TestFallbackError:
    """Test FallbackError"""

    def test_create_fallback_error(self):
        """Test creating a FallbackError"""
        error = FallbackError(
            message="All fallbacks failed",
            attempts=5,
        )

        assert error.message == "All fallbacks failed"
        assert error.attempts == 5
        assert error.severity == ErrorSeverity.CRITICAL


class TestValidationError:
    """Test ValidationError"""

    def test_create_validation_error(self):
        """Test creating a ValidationError"""
        error = ValidationError(
            message="Invalid input",
            field="content",
        )

        assert error.message == "Invalid input"
        assert error.field == "content"
        assert error.severity == ErrorSeverity.LOW


class TestTimeoutError:
    """Test TimeoutError"""

    def test_create_timeout_error(self):
        """Test creating a TimeoutError"""
        error = TimeoutError(
            message="Operation timed out",
            timeout=30.0,
        )

        assert error.message == "Operation timed out"
        assert error.timeout == 30.0
        assert error.severity == ErrorSeverity.MEDIUM
