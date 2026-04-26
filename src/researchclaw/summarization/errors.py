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
Error handling for summarization module
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from enum import Enum


class ErrorSeverity(str, Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SummarizationError(Exception):
    """Base exception for summarization errors"""
    message: str
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
    details: Dict[str, Any] = field(default_factory=dict)
    original_error: Optional[Exception] = None

    def __str__(self) -> str:
        return self.message


class LLMError(SummarizationError):
    """Error during LLM API call"""
    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        provider: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            severity=ErrorSeverity.HIGH,
            details={"status_code": status_code, "provider": provider, **kwargs},
        )
        self.status_code = status_code
        self.provider = provider


class RateLimitError(LLMError):
    """Rate limit exceeded"""
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None, **kwargs):
        super().__init__(message=message, **kwargs)
        self.severity = ErrorSeverity.MEDIUM
        self.retry_after = retry_after
        self.details["retry_after"] = retry_after


class FallbackError(SummarizationError):
    """All fallback strategies exhausted"""
    def __init__(self, message: str = "All fallback strategies exhausted", attempts: int = 0, **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.CRITICAL,
            details={"attempts": attempts, **kwargs},
        )
        self.attempts = attempts


class ValidationError(SummarizationError):
    """Input validation error"""
    def __init__(self, message: str, field: Optional[str] = None, **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.LOW,
            details={"field": field, **kwargs},
        )
        self.field = field


class TimeoutError(SummarizationError):
    """Operation timeout"""
    def __init__(self, message: str = "Operation timed out", timeout: Optional[float] = None, **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.MEDIUM,
            details={"timeout": timeout, **kwargs},
        )
        self.timeout = timeout


__all__ = [
    "ErrorSeverity",
    "SummarizationError",
    "LLMError",
    "RateLimitError",
    "FallbackError",
    "ValidationError",
    "TimeoutError",
]
