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
Performance tests for content extraction
"""

import pytest
import time
from unittest.mock import Mock, patch
from bs4 import BeautifulSoup

from researchclaw.tools.content_extraction import ContentExtractor


class TestExtractionPerformance:
    """Test extraction performance"""

    @pytest.fixture
    def extractor(self):
        return ContentExtractor(timeout=30)

    def test_extraction_speed_mock(self, extractor):
        """Test extraction speed with mocked response"""
        html_content = """
        <html>
        <head>
            <title>Test Article</title>
            <meta property="og:title" content="OG Title">
            <meta name="description" content="Test description">
        </head>
        <body>
            <article class="article-content">
                <h1>Test Article Title</h1>
                <p>""" + "Lorem ipsum " * 100 + """</p>
                <p>""" + "More content " * 100 + """</p>
                <p>""" + "Additional text " * 100 + """</p>
            </article>
        </body>
        </html>
        """

        with patch.object(extractor, '_get_session') as mock_session:
            mock_response = Mock()
            mock_response.content = html_content.encode()
            mock_response.raise_for_status = Mock()
            
            mock_sess = Mock()
            mock_sess.get.return_value = mock_response
            mock_session.return_value = mock_sess

            start_time = time.time()
            result = extractor.extract("https://example.com/article")
            elapsed = time.time() - start_time

            assert result is not None
            # Should complete in well under 2 seconds with mock
            assert elapsed < 0.5

    def test_clean_noise_performance(self, extractor):
        """Test noise cleaning performance"""
        # Generate HTML with many elements
        html = "<html><body>"
        for i in range(100):
            html += f'<div class="content">Content {i} ' + "text " * 50 + "</div>"
            html += f'<div class="sidebar">Sidebar {i}</div>'
            html += f'<script>var x = {i};</script>'
        html += "</body></html>"

        soup = BeautifulSoup(html, "lxml")
        
        start_time = time.time()
        extractor._clean_noise(soup)
        elapsed = time.time() - start_time

        # Should clean 100 elements quickly
        assert elapsed < 0.2

    def test_selector_extraction_performance(self, extractor):
        """Test selector-based extraction performance"""
        html = "<html><body>"
        for i in range(50):
            html += f'<div class="content">{("Content " * 20) + str(i)}</div>'
        html += "</body></html>"

        soup = BeautifulSoup(html, "lxml")
        
        start_time = time.time()
        result = extractor._extract_by_selectors(soup)
        elapsed = time.time() - start_time

        assert elapsed < 0.1
        assert len(result) > 0

    def test_text_density_performance(self, extractor):
        """Test text density analysis performance"""
        html = "<html><body>"
        for i in range(50):
            html += f'<div class="item">{("Text " * 30) + str(i)}</div>'
        html += "</body></html>"

        soup = BeautifulSoup(html, "lxml")
        
        start_time = time.time()
        result = extractor._extract_by_text_density(soup)
        elapsed = time.time() - start_time

        assert elapsed < 0.2


class TestConcurrentExtraction:
    """Test concurrent extraction"""

    def test_session_thread_safety(self):
        """Test session is thread-safe"""
        import threading
        
        extractor = ContentExtractor()
        sessions = []
        
        def get_session():
            sess = extractor._get_session()
            sessions.append(sess)
        
        # Run in multiple threads
        threads = [threading.Thread(target=get_session) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        # Each thread should get a session (may be same or different due to thread-local)
        assert len(sessions) == 10
