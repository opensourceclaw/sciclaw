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
Feedback Collector Module

Collects user feedback on research quality, accuracy, relevance,
completeness, and usefulness. Supports CLI and API feedback collection
with integration to claw-mem for persistent storage.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class FeedbackType(Enum):
    """Types of user feedback"""
    QUALITY = "quality"
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    COMPLETENESS = "completeness"
    USEFULNESS = "usefulness"


@dataclass
class Feedback:
    """A single user feedback entry"""
    feedback_type: FeedbackType
    rating: int  # 1-5 scale
    topic: str = ""
    comment: str = ""
    session_id: str = ""
    research_id: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Validate rating"""
        if not 1 <= self.rating <= 5:
            raise ValueError(f"Rating must be 1-5, got {self.rating}")

    @property
    def is_positive(self) -> bool:
        """Check if feedback is positive (rating >= 4)"""
        return self.rating >= 4

    @property
    def is_negative(self) -> bool:
        """Check if feedback is negative (rating <= 2)"""
        return self.rating <= 2

    def to_dict(self) -> Dict[str, Any]:
        return {
            "feedback_type": self.feedback_type.value,
            "rating": self.rating,
            "topic": self.topic,
            "comment": self.comment,
            "session_id": self.session_id,
            "research_id": self.research_id,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Feedback":
        """Create Feedback from dictionary"""
        fb_type = data.get("feedback_type", "quality")
        if isinstance(fb_type, str):
            fb_type = FeedbackType(fb_type)
        return cls(
            feedback_type=fb_type,
            rating=data.get("rating", 3),
            topic=data.get("topic", ""),
            comment=data.get("comment", ""),
            session_id=data.get("session_id", ""),
            research_id=data.get("research_id", ""),
            timestamp=datetime.fromisoformat(data["timestamp"])
            if data.get("timestamp") else datetime.now(),
            metadata=data.get("metadata", {}),
        )


# ============================================================================
# Feedback Collector
# ============================================================================

class FeedbackCollector:
    """Collects and manages user feedback

    Supports CLI-based interactive feedback collection and API-style
    programmatic feedback submission. Integrates with claw-mem for
    persistent storage when available.
    """

    def __init__(self, storage_path: Optional[str] = None):
        """Initialize feedback collector

        Args:
            storage_path: Optional file path for local storage
        """
        self.storage_path = storage_path
        self._feedbacks: List[Feedback] = []
        self._memory_enabled = False
        self._init_memory()

    def _init_memory(self):
        """Try to initialize claw-mem integration"""
        try:
            from deepclaw.integration.memory_integration import MemoryIntegration
            self._memory = MemoryIntegration()
            self._memory_enabled = True
            logger.info("claw-mem integration enabled for feedback storage")
        except ImportError:
            logger.debug("claw-mem not available, using local storage only")
        except Exception as e:
            logger.warning(f"Failed to init claw-mem: {e}")

    def collect_feedback(
        self,
        feedback_type: FeedbackType,
        rating: int,
        topic: str = "",
        comment: str = "",
        **metadata,
    ) -> Feedback:
        """Collect user feedback (API style)

        Args:
            feedback_type: Type of feedback
            rating: Rating 1-5
            topic: Research topic
            comment: Optional comment
            **metadata: Additional metadata

        Returns:
            Feedback object
        """
        feedback = Feedback(
            feedback_type=feedback_type,
            rating=rating,
            topic=topic,
            comment=comment,
            metadata=dict(metadata),
        )
        self._store_feedback(feedback)
        return feedback

    def collect_feedback_batch(
        self,
        feedbacks: List[Dict[str, Any]],
    ) -> List[Feedback]:
        """Collect multiple feedback entries at once

        Args:
            feedbacks: List of dicts with feedback data

        Returns:
            List of Feedback objects
        """
        results = []
        for fb_data in feedbacks:
            fb_type = fb_data.get("type", "quality")
            if isinstance(fb_type, str):
                fb_type = FeedbackType(fb_type)
            fb = self.collect_feedback(
                feedback_type=fb_type,
                rating=fb_data.get("rating", 3),
                topic=fb_data.get("topic", ""),
                comment=fb_data.get("comment", ""),
                **fb_data.get("metadata", {}),
            )
            results.append(fb)
        return results

    def collect_cli(self, topic: str = "") -> List[Feedback]:
        """Interactive CLI feedback collection

        Asks the user a series of questions about research quality.

        Args:
            topic: Research topic context

        Returns:
            List of collected Feedback
        """
        print("\n" + "=" * 60)
        print("📊 Research Feedback Survey")
        if topic:
            print(f"Topic: {topic}")
        print("=" * 60)
        print("Rate each category 1-5 (1=Poor, 5=Excellent)")
        print()

        questions = [
            (FeedbackType.QUALITY, "Overall research quality"),
            (FeedbackType.ACCURACY, "Factual accuracy of information"),
            (FeedbackType.RELEVANCE, "Relevance to your topic"),
            (FeedbackType.COMPLETENESS, "Completeness of coverage"),
            (FeedbackType.USEFULNESS, "Usefulness for your needs"),
        ]

        feedbacks = []
        for fb_type, question in questions:
            while True:
                try:
                    rating_input = input(f"[{question}] (1-5): ").strip()
                    if not rating_input:
                        continue
                    rating = int(rating_input)
                    if 1 <= rating <= 5:
                        break
                    print("Please enter a number between 1 and 5.")
                except ValueError:
                    print("Please enter a valid number.")

            comment = input("Comments (optional): ").strip()
            print()

            fb = self.collect_feedback(
                feedback_type=fb_type,
                rating=rating,
                topic=topic,
                comment=comment,
            )
            feedbacks.append(fb)

        return feedbacks

    def get_statistics(self) -> Dict[str, Any]:
        """Get feedback statistics

        Returns:
            Dict with averages by type, total count, etc.
        """
        if not self._feedbacks:
            return {
                "total_feedback": 0,
                "by_type": {},
                "average_rating": 0.0,
                "positive_rate": 0.0,
                "negative_rate": 0.0,
            }

        by_type: Dict[str, List[int]] = {}
        for fb in self._feedbacks:
            key = fb.feedback_type.value
            if key not in by_type:
                by_type[key] = []
            by_type[key].append(fb.rating)

        type_averages = {
            t: round(sum(rs) / len(rs), 2) for t, rs in by_type.items()
        }

        all_ratings = [fb.rating for fb in self._feedbacks]
        positive = sum(1 for fb in self._feedbacks if fb.is_positive)
        negative = sum(1 for fb in self._feedbacks if fb.is_negative)

        return {
            "total_feedback": len(self._feedbacks),
            "by_type": type_averages,
            "average_rating": round(sum(all_ratings) / len(all_ratings), 2),
            "positive_rate": round(positive / len(self._feedbacks), 3),
            "negative_rate": round(negative / len(self._feedbacks), 3),
        }

    def get_feedbacks_by_type(
        self,
        feedback_type: FeedbackType,
    ) -> List[Feedback]:
        """Get feedbacks filtered by type

        Args:
            feedback_type: Type to filter by

        Returns:
            List of matching Feedback
        """
        return [fb for fb in self._feedbacks if fb.feedback_type == feedback_type]

    def get_positive_feedbacks(self) -> List[Feedback]:
        """Get all positive feedbacks (rating >= 4)

        Returns:
            List of positive Feedback
        """
        return [fb for fb in self._feedbacks if fb.is_positive]

    def export_feedbacks(self, format: str = "json") -> str:
        """Export all feedbacks

        Args:
            format: Export format (json)

        Returns:
            Exported string
        """
        data = [fb.to_dict() for fb in self._feedbacks]
        return json.dumps(data, indent=2, ensure_ascii=False)

    def _store_feedback(self, feedback: Feedback) -> None:
        """Store feedback locally and optionally in memory

        Args:
            feedback: Feedback to store
        """
        self._feedbacks.append(feedback)
        logger.debug(f"Stored feedback: {feedback.feedback_type.value}={feedback.rating}")

        if self._memory_enabled:
            try:
                self._memory.store(
                    key=f"feedback:{feedback.session_id}:{feedback.feedback_type.value}",
                    value=json.dumps(feedback.to_dict()),
                    metadata={"type": "feedback", "rating": feedback.rating},
                )
            except Exception as e:
                logger.warning(f"Failed to store feedback in memory: {e}")

        # Also save to local file if path is set
        if self.storage_path:
            try:
                with open(self.storage_path, "w") as f:
                    json.dump([fb.to_dict() for fb in self._feedbacks], f, indent=2)
            except OSError as e:
                logger.warning(f"Failed to save feedback to file: {e}")


# ============================================================================
# Convenience functions
# ============================================================================

def collect_feedback(
    feedback_type: str = "quality",
    rating: int = 3,
    topic: str = "",
    comment: str = "",
) -> Feedback:
    """Convenience function to collect a single feedback

    Args:
        feedback_type: Feedback type string
        rating: Rating 1-5
        topic: Research topic
        comment: Optional comment

    Returns:
        Feedback object
    """
    if isinstance(feedback_type, str):
        fb_type = FeedbackType(feedback_type)
    else:
        fb_type = feedback_type

    collector = FeedbackCollector()
    return collector.collect_feedback(fb_type, rating, topic, comment)


__all__ = [
    "FeedbackType",
    "Feedback",
    "FeedbackCollector",
    "collect_feedback",
]
