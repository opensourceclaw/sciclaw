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
Research Planner - Plans research strategies
"""

from typing import Dict, List, Any, Optional


class ResearchPlan:
    """Research plan representation"""

    def __init__(self, topic: str, depth: int = 3):
        self.topic = topic
        self.depth = depth
        self.queries: List[str] = []
        self.subtopics: List[str] = []
        self.status = "pending"

    def add_query(self, query: str) -> None:
        """Add a search query to the plan"""
        self.queries.append(query)

    def add_subtopic(self, subtopic: str) -> None:
        """Add a subtopic to explore"""
        self.subtopics.append(subtopic)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "depth": self.depth,
            "queries": self.queries,
            "subtopics": self.subtopics,
            "status": self.status,
        }


class ResearchPlanner:
    """Plans research strategies for a given topic"""

    def __init__(self):
        self.plans: Dict[str, ResearchPlan] = {}

    def create_plan(self, topic: str, depth: int = 3) -> ResearchPlan:
        """Create a research plan for a topic

        Args:
            topic: Research topic
            depth: Depth level

        Returns:
            ResearchPlan: Created plan
        """
        plan = ResearchPlan(topic, depth)
        self._generate_queries(plan)
        self._generate_subtopics(plan)
        self.plans[topic] = plan
        return plan

    def get_plan(self, topic: str) -> Optional[ResearchPlan]:
        """Get an existing plan

        Args:
            topic: Topic name

        Returns:
            Optional[ResearchPlan]: Plan if exists
        """
        return self.plans.get(topic)

    def _generate_queries(self, plan: ResearchPlan) -> None:
        """Generate search queries for the topic"""
        # Placeholder: Generate basic queries
        plan.add_query(plan.topic)
        plan.add_query(f"{plan.topic} overview")
        plan.add_query(f"{plan.topic} history")

    def _generate_subtopics(self, plan: ResearchPlan) -> None:
        """Generate subtopics to explore"""
        # Placeholder: Generate basic subtopics
        if plan.depth > 1:
            plan.add_subtopic(f"{plan.topic} fundamentals")
        if plan.depth > 2:
            plan.add_subtopic(f"{plan.topic} advanced topics")


def create_plan(topic: str, depth: int = 3) -> ResearchPlan:
    """Create a research plan

    Args:
        topic: Research topic
        depth: Depth level

    Returns:
        ResearchPlan: Created plan
    """
    planner = ResearchPlanner()
    return planner.create_plan(topic, depth)


__all__ = ["ResearchPlan", "ResearchPlanner", "create_plan"]
