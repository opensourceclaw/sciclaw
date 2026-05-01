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
Parallel Content Extraction Module

Provides parallel extraction with thread/concurrent processing.
"""

import time
import logging
from typing import List, Optional, Callable, Any, Dict
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
from concurrent.futures import Future
import threading

from deepclaw.tools.content_extraction import extract_content, ExtractedContent

logger = logging.getLogger(__name__)


@dataclass
class ExtractionTask:
    """A content extraction task"""
    url: str
    index: int = 0
    timeout: int = 30


@dataclass
class ExtractionResult:
    """Result of extraction task"""
    url: str
    index: int
    success: bool
    content: Optional[ExtractedContent] = None
    error: Optional[str] = None
    duration: float = 0.0


class ParallelExtractor:
    """Parallel content extractor"""

    def __init__(
        self,
        max_workers: int = 5,
        timeout: int = 30,
        retry_count: int = 0,
    ):
        """Initialize parallel extractor

        Args:
            max_workers: Maximum number of concurrent workers
            timeout: Request timeout in seconds
            retry_count: Number of retries on failure
        """
        self.max_workers = max_workers
        self.timeout = timeout
        self.retry_count = retry_count
        self._lock = threading.Lock()

    def extract_urls(
        self,
        urls: List[str],
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> List[ExtractionResult]:
        """Extract content from multiple URLs in parallel

        Args:
            urls: List of URLs to extract
            progress_callback: Optional callback(completed, total)

        Returns:
            List of ExtractionResult
        """
        if not urls:
            return []

        results: List[ExtractionResult] = [None] * len(urls)
        completed = 0
        total = len(urls)

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_index = {
                executor.submit(self._extract_single, url, i): i
                for i, url in enumerate(urls)
            }

            # Process completed tasks
            for future in as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    result = future.result()
                    results[index] = result
                except Exception as e:
                    results[index] = ExtractionResult(
                        url=urls[index],
                        index=index,
                        success=False,
                        error=str(e),
                    )

                completed += 1
                if progress_callback:
                    progress_callback(completed, total)

        return results

    def _extract_single(self, url: str, index: int) -> ExtractionResult:
        """Extract content from a single URL

        Args:
            url: URL to extract
            index: URL index in original list

        Returns:
            ExtractionResult
        """
        start_time = time.time()

        # Try with retries
        for attempt in range(self.retry_count + 1):
            try:
                content = extract_content(url, timeout=self.timeout)

                if content:
                    duration = time.time() - start_time
                    return ExtractionResult(
                        url=url,
                        index=index,
                        success=True,
                        content=content,
                        duration=duration,
                    )

                # No content, but no error - treat as failure
                if attempt < self.retry_count:
                    logger.warning(f"Retry {attempt + 1}/{self.retry_count} for {url}")
                    time.sleep(0.5 * (attempt + 1))  # Brief delay before retry
                    continue

                duration = time.time() - start_time
                return ExtractionResult(
                    url=url,
                    index=index,
                    success=False,
                    error="No content extracted",
                    duration=duration,
                )

            except Exception as e:
                if attempt < self.retry_count:
                    logger.warning(f"Retry {attempt + 1}/{self.retry_count} for {url}: {e}")
                    time.sleep(0.5 * (attempt + 1))
                    continue

                duration = time.time() - start_time
                return ExtractionResult(
                    url=url,
                    index=index,
                    success=False,
                    error=str(e),
                    duration=duration,
                )

        # Should not reach here
        duration = time.time() - start_time
        return ExtractionResult(
            url=url,
            index=index,
            success=False,
            error="Max retries exceeded",
            duration=duration,
        )

    def extract_urls_sequential(
        self,
        urls: List[str],
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> List[ExtractionResult]:
        """Extract content sequentially (for comparison/debugging)

        Args:
            urls: List of URLs to extract
            progress_callback: Optional callback(completed, total)

        Returns:
            List of ExtractionResult
        """
        results = []
        total = len(urls)

        for i, url in enumerate(urls):
            result = self._extract_single(url, i)
            results.append(result)

            if progress_callback:
                progress_callback(i + 1, total)

        return results


def extract_parallel(
    urls: List[str],
    max_workers: int = 5,
    timeout: int = 30,
    progress_callback: Optional[Callable[[int, int], None]] = None,
) -> List[ExtractionResult]:
    """Extract content from multiple URLs in parallel

    Args:
        urls: List of URLs to extract
        max_workers: Maximum concurrent workers
        timeout: Request timeout
        progress_callback: Progress callback

    Returns:
        List of ExtractionResult
    """
    extractor = ParallelExtractor(
        max_workers=max_workers,
        timeout=timeout,
    )
    return extractor.extract_urls(urls, progress_callback)


def extract_with_timing(
    urls: List[str],
    max_workers: int = 5,
    timeout: int = 30,
) -> Dict[str, Any]:
    """Extract content and return timing statistics

    Args:
        urls: List of URLs to extract
        max_workers: Maximum concurrent workers
        timeout: Request timeout

    Returns:
        Dict with results and timing info
    """
    extractor = ParallelExtractor(
        max_workers=max_workers,
        timeout=timeout,
    )

    start_time = time.time()
    results = extractor.extract_urls(urls)
    total_duration = time.time() - start_time

    # Calculate statistics
    successful = [r for r in results if r.success]
    failed = [r for r in results if not r.success]

    avg_duration = sum(r.duration for r in successful) / len(successful) if successful else 0
    min_duration = min(r.duration for r in successful) if successful else 0
    max_duration = max(r.duration for r in successful) if successful else 0

    return {
        "results": results,
        "total_urls": len(urls),
        "successful": len(successful),
        "failed": len(failed),
        "success_rate": len(successful) / len(urls) if urls else 0,
        "total_duration": total_duration,
        "avg_duration": avg_duration,
        "min_duration": min_duration,
        "max_duration": max_duration,
    }


__all__ = [
    "ExtractionTask",
    "ExtractionResult",
    "ParallelExtractor",
    "extract_parallel",
    "extract_with_timing",
]
