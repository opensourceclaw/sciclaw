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
Retry Logic for Content Extraction
"""

import time
import logging
from typing import Callable, Any, Optional, TypeVar, Type
from functools import wraps
from dataclasses import dataclass

import requests

logger = logging.getLogger(__name__)

T = TypeVar('T')


@dataclass
class RetryConfig:
    """Configuration for retry behavior"""
    max_attempts: int = 3
    initial_delay: float = 1.0
    max_delay: float = 30.0
    exponential_base: float = 2.0
    jitter: bool = True

    @property
    def total_timeout(self) -> float:
        """Calculate approximate total timeout"""
        delay = self.initial_delay
        total = 0
        for _ in range(self.max_attempts - 1):
            total += delay
            delay = min(delay * self.exponential_base, self.max_delay)
        return total


class ExtractionError(Exception):
    """Base exception for extraction errors"""
    pass


class NetworkError(ExtractionError):
    """Network-related errors"""
    pass


class ParseError(ExtractionError):
    """Parsing-related errors"""
    pass


class RateLimitError(ExtractionError):
    """Rate limit exceeded"""
    pass


class TimeoutError(ExtractionError):
    """Request timeout"""
    pass


class RetryableError(ExtractionError):
    """Errors that can be retried"""
    pass


def is_retryable_error(exception: Exception) -> bool:
    """Check if an error is retryable

    Args:
        exception: Exception to check

    Returns:
        True if the error is retryable
    """
    # Network errors
    if isinstance(exception, (
        requests.ConnectionError,
        requests.Timeout,
        requests.URLRequired,
        requests.TooManyRedirects,
    )):
        return True

    # HTTP errors that might be temporary
    if isinstance(exception, requests.HTTPError):
        status_code = exception.response.status_code if hasattr(exception, 'response') else 0
        # 429 Too Many Requests, 500-599 Server Errors
        if status_code in (429, 500, 502, 503, 504):
            return True

    # Custom retryable errors
    if isinstance(exception, (RetryableError, RateLimitError)):
        return True

    return False


def calculate_delay(attempt: int, config: RetryConfig) -> float:
    """Calculate delay before next retry

    Args:
        attempt: Current attempt number (0-indexed)
        config: Retry configuration

    Returns:
        Delay in seconds
    """
    delay = config.initial_delay * (config.exponential_base ** attempt)
    delay = min(delay, config.max_delay)

    if config.jitter:
        # Add random jitter (±25%)
        import random
        jitter = delay * 0.25
        delay = delay + random.uniform(-jitter, jitter)

    return max(0, delay)


def retry_with_backoff(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_errors: Optional[tuple] = None,
    on_retry: Optional[Callable[[Exception, int], None]] = None,
):
    """Decorator to retry a function with exponential backoff

    Args:
        max_attempts: Maximum number of attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential backoff
        jitter: Add random jitter to delay
        retryable_errors: Tuple of retryable exception types
        on_retry: Callback function called on each retry

    Returns:
        Decorated function
    """
    if retryable_errors is None:
        retryable_errors = (RetryableError, requests.RequestException)

    config = RetryConfig(
        max_attempts=max_attempts,
        initial_delay=initial_delay,
        max_delay=max_delay,
        exponential_base=exponential_base,
        jitter=jitter,
    )

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception: Optional[Exception] = None

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except retryable_errors as e:
                    last_exception = e

                    # Don't retry on last attempt
                    if attempt >= max_attempts - 1:
                        break

                    # Check if error is retryable
                    if not is_retryable_error(e):
                        break

                    # Calculate delay
                    delay = calculate_delay(attempt, config)
                    logger.warning(
                        f"Attempt {attempt + 1}/{max_attempts} failed: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )

                    # Call on_retry callback
                    if on_retry:
                        on_retry(e, attempt + 1)

                    time.sleep(delay)

            # All attempts failed
            if last_exception:
                raise last_exception
            raise ExtractionError("All retry attempts failed")

        return wrapper  # type: ignore
    return decorator


class RetryContext:
    """Context manager for retry operations"""

    def __init__(self, config: Optional[RetryConfig] = None):
        """Initialize retry context

        Args:
            config: Retry configuration
        """
        self.config = config or RetryConfig()
        self.attempt = 0
        self.last_exception: Optional[Exception] = None

    def __enter__(self) -> "RetryContext":
        """Enter context"""
        self.attempt += 1
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        """Exit context"""
        if exc_type is not None:
            self.last_exception = exc_val

            # Check if we should retry
            if (
                self.attempt < self.config.max_attempts
                and is_retryable_error(exc_val)
            ):
                delay = calculate_delay(self.attempt - 1, self.config)
                logger.warning(
                    f"Attempt {self.attempt} failed: {exc_val}. "
                    f"Retrying in {delay:.2f}s..."
                )
                time.sleep(delay)
                return True  # Suppress exception, will retry

        return False  # Propagate exception


class ExtractionResult:
    """Result of an extraction operation"""

    def __init__(
        self,
        success: bool,
        content: Any = None,
        error: Optional[str] = None,
        attempts: int = 1,
        duration: float = 0.0,
    ):
        """Initialize result

        Args:
            success: Whether extraction succeeded
            content: Extracted content (if successful)
            error: Error message (if failed)
            attempts: Number of attempts made
            duration: Time taken in seconds
        """
        self.success = success
        self.content = content
        self.error = error
        self.attempts = attempts
        self.duration = duration

    def __repr__(self) -> str:
        """String representation"""
        if self.success:
            return f"<ExtractionResult success=True attempts={self.attempts} duration={self.duration:.2f}s>"
        return f"<ExtractionResult success=False error={self.error} attempts={self.attempts}>"

    @property
    def failed(self) -> bool:
        """Check if extraction failed"""
        return not self.success


def extract_with_retry(
    extractor_func: Callable[[str], Any],
    url: str,
    config: Optional[RetryConfig] = None,
) -> ExtractionResult:
    """Extract content with retry logic

    Args:
        extractor_func: Function to extract content from URL
        url: URL to extract from
        config: Retry configuration

    Returns:
        ExtractionResult with success/failure info
    """
    import time

    config = config or RetryConfig()
    start_time = time.time()

    for attempt in range(config.max_attempts):
        try:
            content = extractor_func(url)
            duration = time.time() - start_time

            return ExtractionResult(
                success=True,
                content=content,
                attempts=attempt + 1,
                duration=duration,
            )
        except Exception as e:
            last_exception = e

            # Don't retry on last attempt
            if attempt >= config.max_attempts - 1:
                break

            # Check if retryable
            if not is_retryable_error(e):
                break

            delay = calculate_delay(attempt, config)
            logger.warning(f"Extraction attempt {attempt + 1} failed: {e}. Retrying...")
            time.sleep(delay)

    # Failed
    duration = time.time() - start_time
    return ExtractionResult(
        success=False,
        error=str(last_exception),
        attempts=config.max_attempts,
        duration=duration,
    )


__all__ = [
    "RetryConfig",
    "ExtractionError",
    "NetworkError",
    "ParseError",
    "RateLimitError",
    "TimeoutError",
    "RetryableError",
    "is_retryable_error",
    "calculate_delay",
    "retry_with_backoff",
    "RetryContext",
    "ExtractionResult",
    "extract_with_retry",
]
