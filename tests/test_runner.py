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
Tests for Research Runner Module
"""

import pytest
from deepclaw.research.runner import ResearchRunner, ResearchFinding
from deepclaw.research.search import SearchResult
from deepclaw.tools.content_extraction import ExtractedContent
from datetime import datetime


class TestResearchFinding:
    """Test ResearchFinding"""

    def test_creation(self):
        """Test ResearchFinding creation"""
        finding = ResearchFinding(
            query="test query",
            search_results=[],
            extracted_content=[],
        )

        assert finding.query == "test query"
        assert finding.timestamp is not None

    def test_to_dict(self):
        """Test to_dict method"""
        finding = ResearchFinding(
            query="test",
            search_results=[],
            extracted_content=[],
        )

        d = finding.to_dict()
        assert d["query"] == "test"
        assert "timestamp" in d


class TestResearchRunner:
    """Test ResearchRunner"""

    @pytest.fixture
    def runner(self):
        return ResearchRunner(max_content=1)

    def test_creation(self, runner):
        """Test ResearchRunner creation"""
        assert runner is not None
        assert runner.max_content == 1

    def test_research_query(self, runner):
        """Test _research_query returns finding"""
        finding = runner._research_query("test")
        assert finding.query == "test"
        assert isinstance(finding.search_results, list)

    def test_convert_findings(self, runner):
        """Test _convert_findings"""
        search_result = SearchResult(
            title="Test",
            url="https://example.com",
            snippet="Test snippet"
        )
        extracted = ExtractedContent(
            url="https://example.com",
            title="Test",
            text="Test content",
            html="<html>Test</html>"
        )

        finding = ResearchFinding(
            query="test",
            search_results=[search_result],
            extracted_content=[extracted]
        )

        converted = runner._convert_findings([finding])
        assert len(converted) > 0
        assert converted[0]["theme"] == "test"
