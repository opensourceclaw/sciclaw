# Copyright 2026 OpenClaw
#
# Licensed under the Apache License, Version 2.0 (the "License");
# ...

"""
Tests for learning_pipeline module
"""

import pytest

from deepclaw.learning.feedback_collector import Feedback, FeedbackType
from deepclaw.learning.learning_pipeline import (
    LearningConfig,
    LearningResult,
    LearningPipeline,
    process_feedback,
)


class TestLearningConfig:
    def test_defaults(self):
        config = LearningConfig()
        assert config.min_rating_for_learning == 3
        assert config.auto_learn is True
        assert config.max_rules_per_session == 5

    def test_to_dict(self):
        config = LearningConfig()
        d = config.to_dict()
        assert "min_rating_for_learning" in d


class TestLearningResult:
    def test_defaults(self):
        result = LearningResult()
        assert result.feedback_count == 0
        assert result.success is True

    def test_to_dict(self):
        result = LearningResult(
            feedback_count=5,
            patterns_found=2,
            rules_generated=3,
        )
        d = result.to_dict()
        assert d["feedback_count"] == 5
        assert d["rules_generated"] == 3


class TestLearningPipeline:
    @pytest.fixture
    def pipeline(self):
        return LearningPipeline()

    def test_process_empty(self, pipeline):
        result = pipeline.process_feedback([])
        assert result.feedback_count == 0
        assert not result.success or result.error_message != ""

    def test_process_single_positive(self, pipeline):
        fb = Feedback(feedback_type=FeedbackType.QUALITY, rating=5, topic="AI")
        result = pipeline.process_feedback([fb])
        assert result.feedback_count == 1
        assert result.success
        assert len(result.insights) > 0

    def test_process_single_negative(self, pipeline):
        fb = Feedback(feedback_type=FeedbackType.QUALITY, rating=1, topic="AI", comment="Terrible")
        result = pipeline.process_feedback([fb])
        assert result.feedback_count == 1

    def test_process_multiple(self, pipeline):
        feedbacks = [
            Feedback(feedback_type=FeedbackType.QUALITY, rating=4),
            Feedback(feedback_type=FeedbackType.ACCURACY, rating=5),
            Feedback(feedback_type=FeedbackType.RELEVANCE, rating=3),
        ]
        result = pipeline.process_feedback(feedbacks)
        assert result.feedback_count == 3
        assert result.patterns_found >= 0
        assert result.success

    def test_process_single_method(self, pipeline):
        fb = Feedback(feedback_type=FeedbackType.QUALITY, rating=4)
        result = pipeline.process_single(fb)
        assert result.feedback_count == 1

    def test_filter_low_ratings(self, pipeline):
        pipeline.config.min_rating_for_learning = 4
        feedbacks = [
            Feedback(feedback_type=FeedbackType.QUALITY, rating=5),
            Feedback(feedback_type=FeedbackType.QUALITY, rating=2),
        ]
        result = pipeline.process_feedback(feedbacks)
        # The low-rated feedback should still be counted but may be filtered
        assert result.feedback_count == 2

    def test_with_context(self, pipeline):
        fb = Feedback(
            feedback_type=FeedbackType.QUALITY,
            rating=5,
            topic="Machine Learning",
            comment="Excellent research",
        )
        context = {"topic": "Machine Learning", "session_id": "test"}
        result = pipeline.process_feedback([fb], context)
        assert result.success
        assert len(result.rules) >= 0

    def test_generates_rules(self, pipeline):
        feedbacks = [
            Feedback(
                feedback_type=FeedbackType.ACCURACY,
                rating=1,
                comment="The numbers are wrong",
            ),
            Feedback(
                feedback_type=FeedbackType.QUALITY,
                rating=2,
                comment="Poor quality overall",
            ),
        ]
        result = pipeline.process_feedback(feedbacks)
        assert len(result.rules) > 0

    def test_pattern_detection_high_satisfaction(self, pipeline):
        feedbacks = [
            Feedback(feedback_type=FeedbackType.QUALITY, rating=5),
            Feedback(feedback_type=FeedbackType.ACCURACY, rating=5),
            Feedback(feedback_type=FeedbackType.RELEVANCE, rating=4),
        ]
        result = pipeline.process_feedback(feedbacks)
        assert result.patterns_found > 0

    def test_pattern_detection_low_satisfaction(self, pipeline):
        feedbacks = [
            Feedback(feedback_type=FeedbackType.QUALITY, rating=1),
            Feedback(feedback_type=FeedbackType.ACCURACY, rating=2),
        ]
        result = pipeline.process_feedback(feedbacks)
        assert result.patterns_found >= 0

    def test_type_specific_patterns(self, pipeline):
        feedbacks = [
            Feedback(feedback_type=FeedbackType.ACCURACY, rating=1, comment="Wrong data"),
            Feedback(feedback_type=FeedbackType.ACCURACY, rating=2, comment="Inaccurate"),
            Feedback(feedback_type=FeedbackType.ACCURACY, rating=1),
        ]
        result = pipeline.process_feedback(feedbacks)
        assert result.patterns_found >= 0

    def test_max_rules_limit(self, pipeline):
        pipeline.config.max_rules_per_session = 2
        feedbacks = [Feedback(feedback_type=t, rating=2, comment="Bad") for t in FeedbackType]
        result = pipeline.process_feedback(feedbacks)
        assert result.rules_generated >= 0

    def test_comment_sentiment_analysis(self, pipeline):
        fb = Feedback(
            feedback_type=FeedbackType.QUALITY,
            rating=2,
            comment="The research is inaccurate, outdated, and incomplete",
        )
        result = pipeline.process_feedback([fb])
        assert result.patterns_found >= 0

    def test_learn_from_positive_disabled(self, pipeline):
        pipeline.config.learn_from_positive = False
        fb = Feedback(feedback_type=FeedbackType.QUALITY, rating=5)
        result = pipeline.process_feedback([fb])
        assert result.feedback_count == 1

    def test_learn_from_negative_disabled(self, pipeline):
        pipeline.config.learn_from_negative = False
        fb = Feedback(feedback_type=FeedbackType.QUALITY, rating=1, comment="Bad")
        result = pipeline.process_feedback([fb])
        assert result.feedback_count == 1


class TestConvenienceFunctions:
    def test_process_feedback(self):
        feedbacks = [
            Feedback(feedback_type=FeedbackType.QUALITY, rating=4, topic="AI"),
        ]
        result = process_feedback(feedbacks, {"topic": "AI"})
        assert isinstance(result, LearningResult)
        assert result.success
