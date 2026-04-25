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
Research Runner - Coordinates the full research workflow
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime

from researchclaw.research.search import SearchEngine, SearchResult
from researchclaw.research.planner import ResearchPlan, ResearchPlanner
from researchclaw.research.synthesizer import ResearchReport, ResearchSynthesizer
from researchclaw.tools.content_extraction import ContentExtractor, ExtractedContent


@dataclass
class ResearchFinding:
    """A single research finding"""
    query: str
    search_results: List[SearchResult]
    extracted_content: List[ExtractedContent]
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "search_results": [r.to_dict() for r in self.search_results],
            "extracted_content": [
                {"title": c.title, "url": c.url, "text": c.text[:500]}
                for c in self.extracted_content
            ],
            "timestamp": self.timestamp.isoformat(),
        }


class ResearchRunner:
    """Coordinates the full research workflow"""

    def __init__(self, max_content: int = 5):
        """Initialize research runner

        Args:
            max_content: Maximum URLs to extract content from
        """
        self.search_engine = SearchEngine()
        self.planner = ResearchPlanner()
        self.synthesizer = ResearchSynthesizer()
        self.content_extractor = ContentExtractor()
        self.max_content = max_content

    def run(self, topic: str, depth: int = 3) -> ResearchReport:
        """Run full research workflow

        Args:
            topic: Research topic
            depth: Research depth level

        Returns:
            ResearchReport: Complete research report
        """
        # Create research plan
        plan = self.planner.create_plan(topic, depth)

        # Execute searches and extract content
        findings = []
        for query in plan.queries:
            finding = self._research_query(query)
            findings.append(finding)

        # Also research subtopics
        for subtopic in plan.subtopics:
            finding = self._research_query(subtopic)
            findings.append(finding)

        # Convert findings to synthesizer format
        synth_findings = self._convert_findings(findings)

        # Synthesize report
        report = self.synthesizer.synthesize(topic, synth_findings)

        return report

    def _research_query(self, query: str) -> ResearchFinding:
        """Research a single query

        Args:
            query: Search query

        Returns:
            ResearchFinding: Research findings
        """
        # Search
        search_results = self.search_engine.search(query, limit=10)

        # Extract content from top results
        extracted_content = []
        for result in search_results[:self.max_content]:
            content = self.content_extractor.extract(result.url)
            if content:
                extracted_content.append(content)

        return ResearchFinding(
            query=query,
            search_results=search_results,
            extracted_content=extracted_content,
        )

    def _convert_findings(self, findings: List[ResearchFinding]) -> List[Dict[str, Any]]:
        """Convert research findings to synthesizer format

        Args:
            findings: Research findings

        Returns:
            List[Dict]: Findings in synthesizer format
        """
        result = []

        for finding in findings:
            # Use search result snippets as content
            for i, sr in enumerate(finding.search_results):
                result.append({
                    "theme": finding.query,
                    "content": f"{sr.title}\n{sr.snippet}",
                    "source": sr.url,
                    "confidence": sr.score,
                })

            # Add extracted content summaries
            for ec in finding.extracted_content:
                result.append({
                    "theme": finding.query,
                    "content": f"{ec.title}\n{ec.text[:1000]}",
                    "source": ec.url,
                    "confidence": 0.8,
                })

        return result


def run_research(topic: str, depth: int = 3) -> ResearchReport:
    """Run full research workflow

    Args:
        topic: Research topic
        depth: Research depth level

    Returns:
        ResearchReport: Complete research report
    """
    runner = ResearchRunner()
    return runner.run(topic, depth)


__all__ = ["ResearchFinding", "ResearchRunner", "run_research"]
