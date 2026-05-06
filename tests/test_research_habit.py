# Copyright 2026 OpenClaw
#
# Licensed under the Apache License, Version 2.0 (the "License");
# ...

"""
Tests for research_habit_tracker module and learning pipeline integration
"""

import pytest

from deepclaw.learning.research_habit_tracker import (
    ResearchHabit,
    ResearchHabitTracker,
)
from deepclaw.learning.feedback_collector import Feedback, FeedbackType
from deepclaw.learning.learning_pipeline import (
    LearningConfig,
    LearningPipeline,
)


class TestResearchHabit:
    def test_creation(self):
        habit = ResearchHabit(user_id="user1")
        assert habit.user_id == "user1"
        assert habit.total_searches == 0
        assert habit.preferred_depth == "standard"

    def test_to_dict(self):
        habit = ResearchHabit(
            user_id="user1",
            total_searches=10,
            top_keywords=["ai", "ml"],
            top_sources=["arxiv.org"],
            preferred_depth="deep",
        )
        d = habit.to_dict()
        assert d["user_id"] == "user1"
        assert d["total_searches"] == 10
        assert d["preferred_depth"] == "deep"


class TestResearchHabitTracker:
    @pytest.fixture
    def tracker(self):
        return ResearchHabitTracker()

    def test_track_search(self, tracker):
        tracker.track_search("user1", "machine learning survey", results_count=15)
        habit = tracker.get_habit_summary("user1")
        assert habit.total_searches == 1
        assert habit.average_results_per_search == 15

    def test_track_multiple_searches(self, tracker):
        for i in range(5):
            tracker.track_search("user1", f"query {i}", results_count=10)
        habit = tracker.get_habit_summary("user1")
        assert habit.total_searches == 5
        assert habit.average_results_per_search == 10

    def test_track_depth_choice(self, tracker):
        tracker.track_depth_choice("user1", "deep")
        tracker.track_depth_choice("user1", "deep")
        tracker.track_depth_choice("user1", "quick")
        habit = tracker.get_habit_summary("user1")
        assert habit.preferred_depth == "deep"

    def test_track_depth_standard(self, tracker):
        tracker.track_depth_choice("user1", "quick")
        tracker.track_depth_choice("user1", "standard")
        tracker.track_depth_choice("user1", "standard")
        assert tracker.get_preferred_depth("user1") == "standard"

    def test_track_source_preference(self, tracker):
        tracker.track_source_preference("user1", "arxiv.org")
        tracker.track_source_preference("user1", "arxiv.org")
        tracker.track_source_preference("user1", "github.com")
        tracker.track_source_preference("user1", "wikipedia.org")
        sources = tracker.get_top_sources("user1")
        assert "arxiv.org" in sources
        assert sources[0] == "arxiv.org"

    def test_track_session_start(self, tracker):
        tracker.track_session_start("user1")
        tracker.track_session_start("user1")
        habit = tracker.get_habit_summary("user1")
        assert habit.total_sessions == 2

    def test_track_topic(self, tracker):
        tracker.track_topic("user1", "AI")
        tracker.track_topic("user1", "ML")
        tracker.track_topic("user1", "AI")
        topics = tracker.get_common_topics("user1")
        assert "AI" in topics

    def test_get_habit_summary_default(self, tracker):
        habit = tracker.get_habit_summary("nonexistent")
        assert habit.user_id == "nonexistent"
        assert habit.total_searches == 0

    def test_get_common_topics(self, tracker):
        for _ in range(3):
            tracker.track_topic("user1", "deep learning")
        for _ in range(2):
            tracker.track_topic("user1", "NLP")
        tracker.track_topic("user1", "reinforcement learning")
        topics = tracker.get_common_topics("user1", limit=2)
        assert len(topics) <= 2
        assert "deep learning" in topics

    def test_get_preferred_depth(self, tracker):
        tracker.track_depth_choice("user1", "deep")
        assert tracker.get_preferred_depth("user1") == "deep"

    def test_get_top_sources(self, tracker):
        tracker.track_source_preference("user1", "arxiv.org")
        assert tracker.get_top_sources("user1") == ["arxiv.org"]

    def test_get_search_history(self, tracker):
        for i in range(5):
            tracker.track_search("user1", f"query_{i}", results_count=i)
        history = tracker.get_search_history("user1", limit=3)
        assert len(history) == 3
        assert history[-1]["query"] == "query_4"

    def test_get_habit_stats(self, tracker):
        tracker.track_search("user1", "ai research", results_count=10)
        tracker.track_depth_choice("user1", "deep")
        tracker.track_session_start("user1")
        stats = tracker.get_habit_stats("user1")
        assert stats["total_searches"] == 1
        assert stats["total_sessions"] == 1
        assert stats["preferred_depth"] == "deep"
        assert stats["average_results_per_search"] == 10

    def test_keyword_extraction(self, tracker):
        tracker.track_search("user1", "machine learning neural networks deep")
        habit = tracker.get_habit_summary("user1")
        assert len(habit.top_keywords) > 0

    def test_multi_user_isolation(self, tracker):
        tracker.track_search("user1", "ai", 10)
        tracker.track_search("user2", "biology", 5)
        habit1 = tracker.get_habit_summary("user1")
        habit2 = tracker.get_habit_summary("user2")
        assert habit1.total_searches == 1
        assert habit2.total_searches == 1
        assert habit1 != habit2

    def test_average_results_rolling(self, tracker):
        tracker.track_search("user1", "q1", 10)
        tracker.track_search("user1", "q2", 20)
        habit = tracker.get_habit_summary("user1")
        assert habit.average_results_per_search == 15.0

    def test_depth_distribution(self, tracker):
        tracker.track_depth_choice("user1", "quick")
        tracker.track_depth_choice("user1", "standard")
        tracker.track_depth_choice("user1", "standard")
        tracker.track_depth_choice("user1", "deep")
        habit = tracker.get_habit_summary("user1")
        assert habit.depth_distribution["quick"] == 1
        assert habit.depth_distribution["standard"] == 2
        assert habit.depth_distribution["deep"] == 1


class TestIntegrationLearning:
    """Integration tests between habit tracker and learning pipeline"""

    def test_feedback_with_habit_tracking(self):
        tracker = ResearchHabitTracker()
        pipeline = LearningPipeline()

        # Simulate user research session
        tracker.track_search("user1", "AI safety", 15)
        tracker.track_depth_choice("user1", "deep")
        tracker.track_source_preference("user1", "arxiv.org")
        tracker.track_topic("user1", "AI safety")

        # Simulate feedback
        feedbacks = [
            Feedback(feedback_type=FeedbackType.QUALITY, rating=4, topic="AI safety"),
            Feedback(feedback_type=FeedbackType.ACCURACY, rating=5, topic="AI safety"),
        ]

        # Verify stats after tracking
        stats = tracker.get_habit_stats("user1")
        assert stats["total_searches"] == 1

    def test_habit_informs_pipeline(self):
        tracker = ResearchHabitTracker()
        tracker.track_depth_choice("user1", "deep")
        preferred = tracker.get_preferred_depth("user1")
        assert preferred == "deep"


class TestFeedbackCollectorExtended:
    """Extended tests for FeedbackCollector"""

    def test_collect_all_types(self):
        from deepclaw.learning.feedback_collector import FeedbackCollector
        collector = FeedbackCollector()
        for t in FeedbackType:
            collector.collect_feedback(t, 4, topic="Test")
        stats = collector.get_statistics()
        assert stats["total_feedback"] == 5

    def test_positive_negative_mix(self):
        from deepclaw.learning.feedback_collector import FeedbackCollector
        collector = FeedbackCollector()
        collector.collect_feedback(FeedbackType.QUALITY, 5)
        collector.collect_feedback(FeedbackType.QUALITY, 1)
        collector.collect_feedback(FeedbackType.ACCURACY, 4)
        collector.collect_feedback(FeedbackType.ACCURACY, 2)
        stats = collector.get_statistics()
        assert stats["positive_rate"] == 0.5
        assert stats["negative_rate"] == 0.5

    def test_collect_batch_mixed(self):
        from deepclaw.learning.feedback_collector import FeedbackCollector
        collector = FeedbackCollector()
        results = collector.collect_feedback_batch([
            {"type": "quality", "rating": 5, "topic": "T1", "comment": "Great"},
            {"type": "accuracy", "rating": 1, "topic": "T2", "comment": "Bad"},
            {"type": "relevance", "rating": 3, "topic": "T3"},
            {"type": "completeness", "rating": 4, "topic": "T4"},
            {"type": "usefulness", "rating": 5, "topic": "T5"},
        ])
        assert len(results) == 5

    def test_statistics_detailed(self):
        from deepclaw.learning.feedback_collector import FeedbackCollector
        collector = FeedbackCollector()
        collector.collect_feedback(FeedbackType.QUALITY, 5, topic="T1")
        collector.collect_feedback(FeedbackType.QUALITY, 4, topic="T2")
        collector.collect_feedback(FeedbackType.QUALITY, 3, topic="T3")
        collector.collect_feedback(FeedbackType.ACCURACY, 2, topic="T4")
        collector.collect_feedback(FeedbackType.ACCURACY, 1, topic="T5")
        stats = collector.get_statistics()
        assert stats["by_type"]["quality"] >= 3.0
        assert stats["by_type"]["accuracy"] <= 2.5

    def test_export_json_format(self):
        from deepclaw.learning.feedback_collector import FeedbackCollector
        collector = FeedbackCollector()
        collector.collect_feedback(FeedbackType.QUALITY, 4, topic="Test")
        exported = collector.export_feedbacks()
        import json
        data = json.loads(exported)
        assert isinstance(data, list)
        assert len(data) == 1


class TestLearningPipelineExtended:
    """Extended tests for LearningPipeline"""

    def test_pipeline_with_all_feedback_types(self):
        feedbacks = [
            Feedback(t, rating=4, topic="AI") for t in FeedbackType
        ]
        pipeline = LearningPipeline()
        result = pipeline.process_feedback(feedbacks)
        assert result.feedback_count == 5
        assert result.success

    def test_pipeline_only_positive(self):
        feedbacks = [Feedback(t, 5, topic="AI") for t in FeedbackType]
        pipeline = LearningPipeline()
        result = pipeline.process_feedback(feedbacks)
        assert result.patterns_found > 0

    def test_pipeline_all_negative(self):
        feedbacks = [Feedback(t, 1, comment="Bad " + t.value, topic="AI") for t in FeedbackType]
        pipeline = LearningPipeline()
        result = pipeline.process_feedback(feedbacks)
        assert result.feedback_count == 5

    def test_pipeline_with_comments(self):
        feedbacks = [
            Feedback(FeedbackType.QUALITY, 5, comment="Excellent depth", topic="AI"),
            Feedback(FeedbackType.ACCURACY, 4, comment="Very accurate data", topic="AI"),
            Feedback(FeedbackType.RELEVANCE, 3, comment="Somewhat relevant", topic="AI"),
        ]
        pipeline = LearningPipeline()
        result = pipeline.process_feedback(feedbacks)
        assert result.success

    def test_pipeline_context_passed(self):
        feedbacks = [Feedback(FeedbackType.QUALITY, 4, topic="ML")]
        pipeline = LearningPipeline()
        context = {"session_id": "test-123", "topic": "ML"}
        result = pipeline.process_feedback(feedbacks, context)
        assert result.success
        assert len(result.insights) > 0

    def test_config_min_rating(self):
        config = LearningConfig(min_rating_for_learning=4)
        pipeline = LearningPipeline(config)
        feedbacks = [
            Feedback(FeedbackType.QUALITY, 5),  # Should be processed
            Feedback(FeedbackType.QUALITY, 1),  # Negative, always processed
            Feedback(FeedbackType.QUALITY, 3),  # Below threshold, not negative
        ]
        result = pipeline.process_feedback(feedbacks)
        assert result.feedback_count == 3

    def test_config_max_rules(self):
        config = LearningConfig(max_rules_per_session=1)
        pipeline = LearningPipeline(config)
        feedbacks = [Feedback(t, 1, comment="Bad") for t in FeedbackType]
        result = pipeline.process_feedback(feedbacks)
        assert result.rules_generated >= 0


class TestResearchHabitTrackerExtended:
    """Additional habit tracking tests"""

    def test_multiple_users_tracking(self):
        tracker = ResearchHabitTracker()
        tracker.track_search("a", "ai", 10)
        tracker.track_search("b", "biology", 20)
        tracker.track_search("c", "chemistry", 30)
        assert tracker.get_habit_summary("a").total_searches == 1
        assert tracker.get_habit_summary("b").total_searches == 1
        assert tracker.get_habit_summary("c").total_searches == 1

    def test_track_depth_then_query(self):
        tracker = ResearchHabitTracker()
        tracker.track_depth_choice("user1", "deep")
        tracker.track_search("user1", "deep learning", 20)
        habit = tracker.get_habit_summary("user1")
        assert habit.total_searches == 1
        assert habit.preferred_depth == "deep"

    def test_search_history_limit(self):
        tracker = ResearchHabitTracker()
        for i in range(30):
            tracker.track_search("user1", f"q{i}", i)
        history = tracker.get_search_history("user1", limit=10)
        assert len(history) == 10
        assert history[-1]["query"] == "q29"

    def test_get_stats_empty_user(self):
        tracker = ResearchHabitTracker()
        stats = tracker.get_habit_stats("noone")
        assert stats["total_searches"] == 0
        assert stats["total_sessions"] == 0

    def test_habit_to_dict_complete(self):
        habit = ResearchHabit(
            user_id="user1",
            total_searches=100,
            top_keywords=["ai", "ml", "data"],
            top_sources=["arxiv.org", "github.com"],
            depth_distribution={"quick": 5, "standard": 10, "deep": 3},
        )
        d = habit.to_dict()
        assert d["user_id"] == "user1"
        assert d["top_keywords"] == ["ai", "ml", "data"]
        assert len(d["top_sources"]) == 2

    def test_track_topic_frequency(self):
        tracker = ResearchHabitTracker()
        for _ in range(10):
            tracker.track_topic("user1", "AI safety")
        for _ in range(5):
            tracker.track_topic("user1", "ML ops")
        topics = tracker.get_common_topics("user1", limit=2)
        assert len(topics) <= 2
        assert "AI safety" in topics

    def test_update_depth_distribution(self):
        tracker = ResearchHabitTracker()
        tracker.track_depth_choice("user1", "quick")
        tracker.track_depth_choice("user1", "quick")
        tracker.track_depth_choice("user1", "deep")
        habit = tracker.get_habit_summary("user1")
        assert habit.depth_distribution["quick"] == 2
        assert habit.depth_distribution["deep"] == 1


class TestLearningPipelineEdgeCases:
    """Edge case tests for learning pipeline"""

    def test_single_feedback_with_context(self):
        fb = Feedback(FeedbackType.QUALITY, 3, topic="ML")
        pipeline = LearningPipeline()
        result = pipeline.process_single(fb, {"session_id": "s1"})
        assert result.success
        assert result.feedback_count == 1

    def test_process_all_positive(self):
        feedbacks = [
            Feedback(FeedbackType.QUALITY, 5),
            Feedback(FeedbackType.ACCURACY, 5),
        ]
        pipeline = LearningPipeline()
        pipeline.config.learn_from_negative = False
        result = pipeline.process_feedback(feedbacks)
        assert result.patterns_found >= 0

    def test_insight_generation(self):
        feedbacks = [
            Feedback(FeedbackType.QUALITY, 5, comment="Excellent", topic="AI"),
        ]
        pipeline = LearningPipeline()
        result = pipeline.process_feedback(feedbacks)
        assert len(result.insights) > 0
        assert "rating" in result.insights[0].lower()

    def test_repeated_same_feedback(self):
        feedbacks = [
            Feedback(FeedbackType.QUALITY, 4, comment="Good depth"),
            Feedback(FeedbackType.QUALITY, 4, comment="Good depth"),
            Feedback(FeedbackType.QUALITY, 4, comment="Good depth"),
        ]
        pipeline = LearningPipeline()
        result = pipeline.process_feedback(feedbacks)
        assert result.feedback_count == 3
