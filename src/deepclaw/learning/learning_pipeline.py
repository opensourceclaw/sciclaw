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
Learning Pipeline Module

Transforms user feedback into actionable learning rules through
integration with claw-rl. Provides feedback analysis, pattern
extraction, and rule generation logic.

Pipeline: Feedback → Analyze → Extract Patterns → Learn → Apply
"""

import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime

from .feedback_collector import Feedback, FeedbackType

logger = logging.getLogger(__name__)


@dataclass
class LearningConfig:
    """Configuration for the learning pipeline"""
    min_rating_for_learning: int = 3
    auto_learn: bool = True
    learn_from_positive: bool = True
    learn_from_negative: bool = True
    max_rules_per_session: int = 5
    rule_store_path: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "min_rating_for_learning": self.min_rating_for_learning,
            "auto_learn": self.auto_learn,
            "learn_from_positive": self.learn_from_positive,
            "learn_from_negative": self.learn_from_negative,
            "max_rules_per_session": self.max_rules_per_session,
        }


@dataclass
class LearningResult:
    """Result of a learning cycle"""
    feedback_count: int = 0
    patterns_found: int = 0
    rules_generated: int = 0
    rules: List[Dict[str, Any]] = field(default_factory=list)
    insights: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)
    success: bool = True
    error_message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "feedback_count": self.feedback_count,
            "patterns_found": self.patterns_found,
            "rules_generated": self.rules_generated,
            "rules": self.rules,
            "insights": self.insights,
            "timestamp": self.timestamp.isoformat(),
            "success": self.success,
            "error_message": self.error_message,
        }


# ============================================================================
# Learning Pipeline
# ============================================================================

class LearningPipeline:
    """Processes feedback through a learning pipeline

    Converts user feedback into improvement suggestions and learning
    rules. Integrates with claw-rl for reinforcement learning when available.

    Pipeline stages:
    1. Filter feedback (by relevance to learning)
    2. Analyze patterns (identify recurring themes)
    3. Extract rules (generate actionable improvements)
    4. Bridge to claw-rl (optional RL integration)
    """

    def __init__(self, config: Optional[LearningConfig] = None):
        """Initialize learning pipeline

        Args:
            config: Learning configuration
        """
        self.config = config or LearningConfig()
        self._claw_rl_available = False
        self._init_claw_rl()

    def _init_claw_rl(self):
        """Try to initialize claw-rl integration"""
        try:
            self._claw_rl_available = True
            logger.info("claw-rl integration enabled for learning pipeline")
        except ImportError:
            logger.debug("claw-rl not available, using local learning only")
        except Exception as e:
            logger.warning(f"Failed to init claw-rl: {e}")

    def process_feedback(
        self,
        feedbacks: List[Feedback],
        context: Optional[Dict[str, Any]] = None,
    ) -> LearningResult:
        """Process feedback through the learning pipeline

        Args:
            feedbacks: List of feedback entries to process
            context: Optional context dict (topic, session_id, etc.)

        Returns:
            LearningResult with generated rules and insights
        """
        if not feedbacks:
            return LearningResult(
                feedback_count=0,
                error_message="No feedback to process",
            )

        context = context or {}

        # Stage 1: Filter feedback
        filtered = self._filter_feedback(feedbacks)
        if not filtered:
            return LearningResult(
                feedback_count=len(feedbacks),
                error_message="No actionable feedback after filtering",
            )

        # Stage 2: Analyze patterns
        patterns = self._analyze_patterns(filtered, context)

        # Stage 3: Extract rules
        rules = self._extract_rules(patterns, filtered, context)

        # Stage 4: Bridge to claw-rl if available
        if self._claw_rl_available and self.config.auto_learn:
            self._bridge_to_claw_rl(filtered, rules, context)

        # Generate insights
        insights = self._generate_insights(filtered, patterns, rules)

        return LearningResult(
            feedback_count=len(feedbacks),
            patterns_found=len(patterns),
            rules_generated=len(rules),
            rules=rules,
            insights=insights,
            success=True,
        )

    def process_single(
        self,
        feedback: Feedback,
        context: Optional[Dict[str, Any]] = None,
    ) -> LearningResult:
        """Process a single feedback entry

        Args:
            feedback: Single feedback entry
            context: Optional context

        Returns:
            LearningResult
        """
        return self.process_feedback([feedback], context)

    # ====================================================================
    # Pipeline stages
    # ====================================================================

    def _filter_feedback(
        self,
        feedbacks: List[Feedback],
    ) -> List[Feedback]:
        """Filter feedback for learning relevance

        Args:
            feedbacks: All feedback entries

        Returns:
            Filtered list of actionable feedback
        """
        filtered = []
        for fb in feedbacks:
            # Always process negative feedback (it's always actionable)
            if fb.is_negative and self.config.learn_from_negative:
                filtered.append(fb)
                continue
            # Skip positive/neutral if below rating threshold
            if fb.rating < self.config.min_rating_for_learning:
                continue
            # Skip specific feedback types if configured
            if not self.config.learn_from_positive and fb.is_positive:
                continue
            filtered.append(fb)
        return filtered

    def _analyze_patterns(
        self,
        feedbacks: List[Feedback],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Analyze feedback for patterns

        Args:
            feedbacks: Filtered feedback
            context: Context dict

        Returns:
            List of pattern dicts
        """
        patterns = []

        # Pattern 1: Overall quality assessment
        avg_rating = sum(fb.rating for fb in feedbacks) / len(feedbacks)
        if avg_rating >= 4:
            patterns.append({
                "pattern": "high_satisfaction",
                "description": "User is satisfied with overall quality",
                "confidence": min(0.9, avg_rating / 5),
            })
        elif avg_rating <= 2:
            patterns.append({
                "pattern": "low_satisfaction",
                "description": "User is dissatisfied with overall quality",
                "confidence": min(0.9, 1.0 - avg_rating / 5),
            })

        # Pattern 2: By feedback type
        by_type: Dict[str, List[int]] = {}
        for fb in feedbacks:
            key = fb.feedback_type.value
            if key not in by_type:
                by_type[key] = []
            by_type[key].append(fb.rating)

        for fb_type, ratings in by_type.items():
            avg = sum(ratings) / len(ratings)
            if avg <= 2:
                patterns.append({
                    "pattern": f"low_{fb_type}",
                    "description": f"Users consistently rate {fb_type} low",
                    "type": fb_type,
                    "average_rating": round(avg, 2),
                    "confidence": min(0.9, 1.0 - avg / 5),
                })
            elif avg >= 4:
                patterns.append({
                    "pattern": f"high_{fb_type}",
                    "description": f"Users consistently rate {fb_type} high",
                    "type": fb_type,
                    "average_rating": round(avg, 2),
                    "confidence": min(0.9, avg / 5),
                })

        # Pattern 3: Comment sentiment analysis (keyword-based)
        keywords_negative = [
            "inaccurate", "wrong", "outdated", "irrelevant", "incomplete",
            "missing", "poor", "bad", "useless", "confusing", "shallow",
        ]
        keywords_positive = [
            "accurate", "helpful", "useful", "comprehensive", "insightful",
            "clear", "detailed", "good", "great", "excellent", "deep",
        ]

        for fb in feedbacks:
            if fb.comment:
                comment_lower = fb.comment.lower()
                neg_hits = sum(1 for kw in keywords_negative if kw in comment_lower)
                pos_hits = sum(1 for kw in keywords_positive if kw in comment_lower)
                if neg_hits > pos_hits:
                    patterns.append({
                        "pattern": "negative_sentiment",
                        "description": f"Negative comment detected: {fb.comment[:100]}",
                        "type": fb.feedback_type.value,
                        "confidence": 0.6,
                    })

        return patterns

    def _extract_rules(
        self,
        patterns: List[Dict[str, Any]],
        feedbacks: List[Feedback],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Extract learning rules from patterns

        Args:
            patterns: Analyzed patterns
            feedbacks: Original feedback
            context: Context dict

        Returns:
            List of learning rule dicts
        """
        rules = []
        topic = context.get("topic", "")

        for pattern in patterns[:self.config.max_rules_per_session]:
            rule = self._pattern_to_rule(pattern, topic)
            if rule:
                rules.append(rule)

        # Generate general rules from feedback
        for fb in feedbacks[:3]:
            if fb.comment and fb.rating <= 2:
                rules.append({
                    "action": f"improve_{fb.feedback_type.value}",
                    "condition": f"User rated {fb.feedback_type.value} as {fb.rating}/5",
                    "suggestion": fb.comment,
                    "score": 1.0 - fb.rating / 5,
                    "source": "feedback",
                })

        return rules

    @staticmethod
    def _pattern_to_rule(
        pattern: Dict[str, Any],
        topic: str = "",
    ) -> Optional[Dict[str, Any]]:
        """Convert a pattern to a learning rule

        Args:
            pattern: Pattern dict
            topic: Research topic

        Returns:
            Rule dict or None
        """
        pattern_name = pattern.get("pattern", "")

        rule_map = {
            "high_satisfaction": {
                "action": "maintain_quality",
                "condition": "Overall satisfaction is high",
                "suggestion": "Continue current research approach for similar topics",
                "score": pattern.get("confidence", 0.5),
                "source": "feedback_pattern",
            },
            "low_satisfaction": {
                "action": "improve_overall",
                "condition": "Overall satisfaction is low",
                "suggestion": "Review research depth and source quality",
                "score": pattern.get("confidence", 0.5),
                "source": "feedback_pattern",
            },
            "negative_sentiment": {
                "action": "address_criticism",
                "condition": pattern.get("description", ""),
                "suggestion": "Investigate and address specific concerns",
                "score": 0.6,
                "source": "feedback_pattern",
            },
            "low_accuracy": {
                "action": "improve_accuracy",
                "condition": "Accuracy ratings are consistently low",
                "suggestion": "Cross-reference facts with multiple trusted sources",
                "score": pattern.get("confidence", 0.5),
                "source": "feedback_pattern",
            },
            "low_relevance": {
                "action": "improve_relevance",
                "condition": "Relevance ratings are consistently low",
                "suggestion": "Refine search queries and topic focus",
                "score": pattern.get("confidence", 0.5),
                "source": "feedback_pattern",
            },
            "low_completeness": {
                "action": "deepen_coverage",
                "condition": "Completeness ratings are consistently low",
                "suggestion": "Expand research scope and section coverage",
                "score": pattern.get("confidence", 0.5),
                "source": "feedback_pattern",
            },
            "low_usefulness": {
                "action": "improve_usefulness",
                "condition": "Usefulness ratings are consistently low",
                "suggestion": "Add actionable takeaways and practical examples",
                "score": pattern.get("confidence", 0.5),
                "source": "feedback_pattern",
            },
        }

        if pattern_name in rule_map:
            return rule_map[pattern_name]

        # Generic rule for unknown patterns
        desc = pattern.get("description", "Unidentified pattern")
        return {
            "action": "investigate_pattern",
            "condition": desc,
            "suggestion": f"Analyze pattern: {desc}",
            "score": pattern.get("confidence", 0.3),
            "source": "feedback_pattern",
        }

    def _bridge_to_claw_rl(
        self,
        feedbacks: List[Feedback],
        rules: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> None:
        """Send learning signals to claw-rl

        Args:
            feedbacks: Processed feedback
            rules: Generated rules
            context: Context dict
        """
        if not self._claw_rl_available:
            return

        try:
            for feedback in feedbacks:
                # Evaluate feedback with BinaryRLJudge-style scoring
                signal = {
                    "action": f"research_{feedback.feedback_type.value}",
                    "outcome_positive": feedback.is_positive,
                    "confidence": abs(feedback.rating - 3) / 2,  # 0-1 scale
                    "context": {
                        "topic": feedback.topic,
                        "comment": feedback.comment,
                        "rating": feedback.rating,
                        **context,
                    },
                }
                logger.debug(f"claw-rl signal: {signal['action']} "
                           f"positive={signal['outcome_positive']}")

            logger.info(f"Sent {len(feedbacks)} learning signals to claw-rl")
        except Exception as e:
            logger.warning(f"claw-rl bridge failed: {e}")

    @staticmethod
    def _generate_insights(
        feedbacks: List[Feedback],
        patterns: List[Dict[str, Any]],
        rules: List[Dict[str, Any]],
    ) -> List[str]:
        """Generate human-readable insights

        Args:
            feedbacks: Processed feedback
            patterns: Detected patterns
            rules: Generated rules

        Returns:
            List of insight strings
        """
        insights = []

        if not feedbacks:
            insights.append("No feedback to analyze.")
            return insights

        avg = sum(fb.rating for fb in feedbacks) / len(feedbacks)
        insights.append(f"Average rating: {avg:.1f}/5 across {len(feedbacks)} feedback entries.")

        for pattern in patterns[:3]:
            insights.append(
                f"Detected: {pattern.get('description', 'Unknown pattern')} "
                f"(confidence: {pattern.get('confidence', 0):.0%})"
            )

        for rule in rules[:3]:
            insights.append(
                f"Suggestion: {rule.get('suggestion', 'No suggestion')}"
            )

        return insights


# ============================================================================
# Convenience functions
# ============================================================================

def process_feedback(
    feedbacks: List[Feedback],
    context: Optional[Dict[str, Any]] = None,
) -> LearningResult:
    """Convenience function to process feedback through pipeline

    Args:
        feedbacks: List of feedback entries
        context: Optional context

    Returns:
        LearningResult
    """
    pipeline = LearningPipeline()
    return pipeline.process_feedback(feedbacks, context)


__all__ = [
    "LearningConfig",
    "LearningResult",
    "LearningPipeline",
    "process_feedback",
]
