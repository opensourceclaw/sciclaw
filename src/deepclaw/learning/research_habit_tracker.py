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
Research Habit Tracker Module

Tracks user research patterns including search queries, depth preferences,
source preferences, and topic interests. Stores habits persistently via
claw-mem integration for cross-session learning.

Habit data model:
- Search patterns: frequently used keywords, topics
- Depth preferences: quick/standard/deep research modes
- Source preferences: frequently used data sources
- Session timing: average research duration
"""

import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import Counter

logger = logging.getLogger(__name__)


@dataclass
class ResearchHabit:
    """Aggregated research habit profile for a user"""
    user_id: str
    total_searches: int = 0
    total_sessions: int = 0
    top_keywords: List[str] = field(default_factory=list)
    top_sources: List[str] = field(default_factory=list)
    preferred_depth: str = "standard"
    depth_distribution: Dict[str, int] = field(default_factory=dict)
    average_results_per_search: float = 0.0
    last_active: Optional[datetime] = None
    common_topics: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "total_searches": self.total_searches,
            "total_sessions": self.total_sessions,
            "top_keywords": self.top_keywords,
            "top_sources": self.top_sources,
            "preferred_depth": self.preferred_depth,
            "depth_distribution": self.depth_distribution,
            "average_results_per_search": self.average_results_per_search,
            "last_active": self.last_active.isoformat() if self.last_active else None,
            "common_topics": self.common_topics,
        }


# ============================================================================
# Research Habit Tracker
# ============================================================================

class ResearchHabitTracker:
    """Tracks and analyzes user research habits over time

    Collects behavioral data across research sessions and builds
    habit profiles for personalized research recommendations.
    Data persists via claw-mem when available.
    """

    def __init__(self):
        """Initialize habit tracker"""
        self._habits: Dict[str, ResearchHabit] = {}
        self._search_log: Dict[str, List[Dict[str, Any]]] = {}
        self._source_log: Dict[str, List[str]] = {}
        self._memory_enabled = False
        self._init_memory()

    def _init_memory(self):
        """Try to initialize claw-mem integration"""
        try:
            from deepclaw.integration.memory_integration import MemoryIntegration
            self._memory = MemoryIntegration()
            self._memory_enabled = True
            logger.info("claw-mem integration enabled for habit tracking")
        except (ImportError, Exception):
            logger.debug("claw-mem not available for habit tracking")

    # ================================================================
    # Tracking methods
    # ================================================================

    def track_search(
        self,
        user_id: str,
        query: str,
        results_count: int = 0,
    ) -> None:
        """Track a search query

        Args:
            user_id: User identifier
            query: Search query string
            results_count: Number of results returned
        """
        habit = self._get_or_create_habit(user_id)

        entry = {
            "query": query,
            "results_count": results_count,
            "timestamp": datetime.now().isoformat(),
        }

        if user_id not in self._search_log:
            self._search_log[user_id] = []
        self._search_log[user_id].append(entry)

        habit.total_searches += 1
        habit.last_active = datetime.now()

        # Update average results per search (rolling average)
        if habit.total_searches > 0:
            habit.average_results_per_search = (
                (habit.average_results_per_search * (habit.total_searches - 1)
                 + results_count) / habit.total_searches
            )

        # Update keywords (extract from query)
        self._update_keywords(habit, query)

        # Persist
        self._persist_habit(user_id, habit)

    def track_depth_choice(
        self,
        user_id: str,
        depth: str,
    ) -> None:
        """Track research depth preference

        Args:
            user_id: User identifier
            depth: Research depth (quick/standard/deep)
        """
        habit = self._get_or_create_habit(user_id)

        if depth not in habit.depth_distribution:
            habit.depth_distribution[depth] = 0
        habit.depth_distribution[depth] += 1

        # Determine preferred depth
        if habit.depth_distribution:
            habit.preferred_depth = max(
                habit.depth_distribution, key=habit.depth_distribution.get
            )

        self._persist_habit(user_id, habit)

    def track_source_preference(
        self,
        user_id: str,
        source: str,
    ) -> None:
        """Track a preferred data source

        Args:
            user_id: User identifier
            source: Source identifier (domain, provider name)
        """
        habit = self._get_or_create_habit(user_id)

        if user_id not in self._source_log:
            self._source_log[user_id] = []
        self._source_log[user_id].append(source)

        # Update top sources
        source_counter = Counter(self._source_log[user_id])
        habit.top_sources = [
            src for src, _ in source_counter.most_common(5)
        ]

        self._persist_habit(user_id, habit)

    def track_session_start(
        self,
        user_id: str,
    ) -> None:
        """Track start of a research session

        Args:
            user_id: User identifier
        """
        habit = self._get_or_create_habit(user_id)
        habit.total_sessions += 1
        habit.last_active = datetime.now()
        self._persist_habit(user_id, habit)

    def track_topic(
        self,
        user_id: str,
        topic: str,
    ) -> None:
        """Track a research topic

        Args:
            user_id: User identifier
            topic: Research topic
        """
        habit = self._get_or_create_habit(user_id)
        topics = list(habit.common_topics)
        topics.append(topic)
        topic_counter = Counter(topics)
        habit.common_topics = [
            t for t, _ in topic_counter.most_common(10)
        ]
        self._persist_habit(user_id, habit)

    # ================================================================
    # Query methods
    # ================================================================

    def get_habit_summary(self, user_id: str) -> ResearchHabit:
        """Get habit summary for a user

        Args:
            user_id: User identifier

        Returns:
            ResearchHabit with aggregated data
        """
        if user_id in self._habits:
            return self._habits[user_id]

        return ResearchHabit(user_id=user_id)

    def get_common_topics(
        self,
        user_id: str,
        limit: int = 10,
    ) -> List[str]:
        """Get commonly researched topics

        Args:
            user_id: User identifier
            limit: Maximum topics to return

        Returns:
            List of topic strings
        """
        habit = self.get_habit_summary(user_id)
        return habit.common_topics[:limit]

    def get_preferred_depth(self, user_id: str) -> str:
        """Get user's preferred research depth

        Args:
            user_id: User identifier

        Returns:
            Depth string (quick/standard/deep)
        """
        habit = self.get_habit_summary(user_id)
        return habit.preferred_depth

    def get_top_sources(self, user_id: str) -> List[str]:
        """Get user's top data sources

        Args:
            user_id: User identifier

        Returns:
            List of source identifiers
        """
        habit = self.get_habit_summary(user_id)
        return habit.top_sources

    def get_search_history(
        self,
        user_id: str,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Get recent search history

        Args:
            user_id: User identifier
            limit: Maximum entries

        Returns:
            List of search history entries
        """
        log = self._search_log.get(user_id, [])
        return log[-limit:]

    def get_habit_stats(self, user_id: str) -> Dict[str, Any]:
        """Get habit statistics

        Args:
            user_id: User identifier

        Returns:
            Dict with stats (searches, sessions, etc.)
        """
        habit = self.get_habit_summary(user_id)
        return {
            "total_searches": habit.total_searches,
            "total_sessions": habit.total_sessions,
            "preferred_depth": habit.preferred_depth,
            "average_results_per_search": round(habit.average_results_per_search, 1),
            "unique_sources": len(set(self._source_log.get(user_id, []))),
            "unique_keywords": len(set(
                kw[:20] for entry in self._search_log.get(user_id, [])
                for kw in entry["query"].split()
            )),
            "common_topics": habit.common_topics[:5],
            "last_active": (
                habit.last_active.isoformat() if habit.last_active else None
            ),
        }

    # ================================================================
    # Internal helpers
    # ================================================================

    def _get_or_create_habit(self, user_id: str) -> ResearchHabit:
        """Get existing habit or create new one

        Args:
            user_id: User identifier

        Returns:
            ResearchHabit
        """
        if user_id not in self._habits:
            self._habits[user_id] = ResearchHabit(user_id=user_id)
        return self._habits[user_id]

    def _update_keywords(self, habit: ResearchHabit, query: str) -> None:
        """Update keyword tracking from a query

        Args:
            habit: ResearchHabit to update
            query: Search query string
        """
        # Split query into meaningful keywords (filter short words)
        words = [
            w.lower() for w in query.split()
            if len(w) > 2 and w.isalpha()
        ]

        for word in words:
            habit.top_keywords.append(word)

        # Keep top 10 keywords
        kw_counter = Counter(habit.top_keywords)
        habit.top_keywords = [
            kw for kw, _ in kw_counter.most_common(10)
        ]

    def _persist_habit(self, user_id: str, habit: ResearchHabit) -> None:
        """Persist habit data to claw-mem if available

        Args:
            user_id: User identifier
            habit: ResearchHabit to persist
        """
        if self._memory_enabled:
            try:
                self._memory.store(
                    key=f"habit:{user_id}",
                    value=json.dumps(habit.to_dict()),
                    metadata={"type": "habit", "user_id": user_id},
                )
            except Exception as e:
                logger.warning(f"Failed to persist habit: {e}")


__all__ = [
    "ResearchHabit",
    "ResearchHabitTracker",
]
