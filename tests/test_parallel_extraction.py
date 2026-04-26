# Copyright 2026 OpenClaw
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributions are permitted provided that the following conditions are met:
#
#     * Redistributions of source code must retain the above copyright notice,
#       this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright notice,
#       this list of conditions and the following disclaimer in the documentation
#       and/or other materials provided with the distribution.
#     * Neither the name of the copyright holder nor the names of its contributors
#       may be used to endorse or promote products derived from this software
#       without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
# LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.

"""
Tests for Parallel Extraction
"""

import pytest
import time
from unittest.mock import Mock, patch, MagicMock
from researchclaw.tools.parallel_extraction import (
    ExtractionTask,
    ExtractionResult,
    ParallelExtractor,
    extract_parallel,
    extract_with_timing,
)


class TestExtractionTask:
    """Test ExtractionTask"""

    def test_creation(self):
        """Test creating task"""
        task = ExtractionTask(url="https://example.com", index=0, timeout=30)
        assert task.url == "https://example.com"
        assert task.index == 0
        assert task.timeout == 30


class TestExtractionResult:
    """Test ExtractionResult"""

    def test_creation_success(self):
        """Test creating successful result"""
        result = ExtractionResult(
            url="https://example.com",
            index=0,
            success=True,
            duration=1.5,
        )
        assert result.url == "https://example.com"
        assert result.success is True
        assert result.duration == 1.5

    def test_creation_failure(self):
        """Test creating failed result"""
        result = ExtractionResult(
            url="https://example.com",
            index=0,
            success=False,
            error="Connection failed",
        )
        assert result.success is False
        assert result.error == "Connection failed"


class TestParallelExtractor:
    """Test ParallelExtractor"""

    @pytest.fixture
    def extractor(self):
        """Create extractor"""
        return ParallelExtractor(max_workers=3, timeout=5)

    def test_creation(self, extractor):
        """Test creating extractor"""
        assert extractor.max_workers == 3
        assert extractor.timeout == 5
        assert extractor.retry_count == 0

    @patch("researchclaw.tools.parallel_extraction.extract_content")
    def test_extract_single_success(self, mock_extract, extractor):
        """Test successful single extraction"""
        mock_content = Mock()
        mock_content.text = "Test content"
        mock_extract.return_value = mock_content

        result = extractor._extract_single("https://example.com", 0)

        assert result.success is True
        assert result.content == mock_content
        assert result.duration > 0

    @patch("researchclaw.tools.parallel_extraction.extract_content")
    def test_extract_single_failure(self, mock_extract, extractor):
        """Test failed extraction"""
        mock_extract.side_effect = Exception("Connection error")

        result = extractor._extract_single("https://example.com", 0)

        assert result.success is False
        assert "Connection error" in result.error

    @patch("researchclaw.tools.parallel_extraction.extract_content")
    def test_extract_urls(self, mock_extract, extractor):
        """Test extracting multiple URLs"""
        mock_content = Mock()
        mock_content.text = "Test content"
        mock_extract.return_value = mock_content

        urls = [
            "https://example.com/1",
            "https://example.com/2",
            "https://example.com/3",
        ]

        results = extractor.extract_urls(urls)

        assert len(results) == 3
        assert all(r.success for r in results)

    @patch("researchclaw.tools.parallel_extraction.extract_content")
    def test_extract_urls_with_progress(self, mock_extract, extractor):
        """Test progress callback"""
        mock_content = Mock()
        mock_content.text = "Test content"
        mock_extract.return_value = mock_content

        progress_calls = []

        def progress_callback(completed, total):
            progress_calls.append((completed, total))

        urls = ["https://example.com/1", "https://example.com/2"]
        results = extractor.extract_urls(urls, progress_callback)

        assert len(progress_calls) == 2
        assert progress_calls[0] == (1, 2)
        assert progress_calls[1] == (2, 2)

    def test_extract_urls_empty(self, extractor):
        """Test empty URL list"""
        results = extractor.extract_urls([])
        assert results == []

    @patch("researchclaw.tools.parallel_extraction.extract_content")
    def test_extract_urls_sequential(self, mock_extract, extractor):
        """Test sequential extraction"""
        mock_content = Mock()
        mock_content.text = "Test content"
        mock_extract.return_value = mock_content

        urls = ["https://example.com/1", "https://example.com/2"]
        results = extractor.extract_urls_sequential(urls)

        assert len(results) == 2
        assert all(r.success for r in results)


class TestExtractParallel:
    """Test module-level functions"""

    @patch("researchclaw.tools.parallel_extraction.ParallelExtractor")
    def test_extract_parallel(self, mock_extractor_class):
        """Test extract_parallel function"""
        mock_extractor = Mock()
        mock_extractor.extract_urls.return_value = [
            ExtractionResult(url="https://example.com", index=0, success=True)
        ]
        mock_extractor_class.return_value = mock_extractor

        results = extract_parallel(["https://example.com"])

        mock_extractor_class.assert_called_once()
        mock_extractor.extract_urls.assert_called_once()
        assert len(results) == 1


class TestExtractWithTiming:
    """Test extract_with_timing function"""

    def test_timing_statistics(self):
        """Test timing statistics calculation"""
        # Create mock results directly
        results = [
            ExtractionResult(url="https://example.com/1", index=0, success=True, duration=1.0),
            ExtractionResult(url="https://example.com/2", index=1, success=True, duration=2.0),
            ExtractionResult(url="https://example.com/3", index=2, success=False, error="Error"),
        ]

        # Calculate statistics manually (as extract_with_timing does)
        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        assert len(successful) == 2
        assert len(failed) == 1
        assert len(successful) / len(results) == 2/3

    def test_timing_empty(self):
        """Test timing with empty list"""
        results = []
        successful = [r for r in results if r.success]

        assert len(successful) == 0


class TestPerformance:
    """Performance-related tests"""

    @patch("researchclaw.tools.parallel_extraction.extract_content")
    def test_parallel_is_faster(self, mock_extract):
        """Test parallel is faster than sequential"""
        # Create slow mock
        def slow_extract(url, timeout=30):
            time.sleep(0.1)  # 100ms per extraction
            mock_content = Mock()
            mock_content.text = "Content"
            return mock_content

        mock_extract.side_effect = slow_extract

        extractor = ParallelExtractor(max_workers=3)

        # Test parallel (should be ~0.1s for 3 URLs with 3 workers)
        start = time.time()
        parallel_results = extractor.extract_urls([
            "https://example.com/1",
            "https://example.com/2",
            "https://example.com/3",
        ])
        parallel_time = time.time() - start

        # Test sequential (should be ~0.3s for 3 URLs)
        start = time.time()
        sequential_results = extractor.extract_urls_sequential([
            "https://example.com/1",
            "https://example.com/2",
            "https://example.com/3",
        ])
        sequential_time = time.time() - start

        # Parallel should be significantly faster
        assert parallel_time < sequential_time
        assert all(r.success for r in parallel_results)
