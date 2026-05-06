# Copyright 2026 OpenClaw
#
# Licensed under the Apache License, Version 2.0 (the "License");
# ...

"""
Tests for feedback_collector module
"""

import pytest
import json

from deepclaw.learning.feedback_collector import (
    FeedbackType,
    Feedback,
    FeedbackCollector,
    collect_feedback,
)


class TestFeedbackType:
    def test_values(self):
        assert FeedbackType.QUALITY.value == "quality"
        assert FeedbackType.ACCURACY.value == "accuracy"
        assert FeedbackType.RELEVANCE.value == "relevance"
        assert FeedbackType.COMPLETENESS.value == "completeness"
        assert FeedbackType.USEFULNESS.value == "usefulness"


class TestFeedback:
    def test_creation(self):
        fb = Feedback(feedback_type=FeedbackType.QUALITY, rating=4, topic="AI")
        assert fb.rating == 4
        assert fb.topic == "AI"
        assert fb.is_positive
        assert not fb.is_negative

    def test_rating_range(self):
        Feedback(feedback_type=FeedbackType.QUALITY, rating=1)
        Feedback(feedback_type=FeedbackType.QUALITY, rating=5)
        with pytest.raises(ValueError):
            Feedback(feedback_type=FeedbackType.QUALITY, rating=0)
        with pytest.raises(ValueError):
            Feedback(feedback_type=FeedbackType.QUALITY, rating=6)

    def test_is_positive(self):
        assert Feedback(feedback_type=FeedbackType.QUALITY, rating=4).is_positive
        assert Feedback(feedback_type=FeedbackType.QUALITY, rating=5).is_positive
        assert not Feedback(feedback_type=FeedbackType.QUALITY, rating=3).is_positive

    def test_is_negative(self):
        assert Feedback(feedback_type=FeedbackType.QUALITY, rating=1).is_negative
        assert Feedback(feedback_type=FeedbackType.QUALITY, rating=2).is_negative
        assert not Feedback(feedback_type=FeedbackType.QUALITY, rating=3).is_negative

    def test_to_dict(self):
        fb = Feedback(feedback_type=FeedbackType.ACCURACY, rating=5, topic="Test", comment="Great")
        d = fb.to_dict()
        assert d["rating"] == 5
        assert d["feedback_type"] == "accuracy"
        assert d["comment"] == "Great"

    def test_from_dict(self):
        data = {
            "feedback_type": "relevance",
            "rating": 3,
            "topic": "AI",
            "comment": "Decent",
            "session_id": "s1",
            "research_id": "r1",
            "metadata": {},
        }
        fb = Feedback.from_dict(data)
        assert fb.feedback_type == FeedbackType.RELEVANCE
        assert fb.rating == 3
        assert fb.topic == "AI"


class TestFeedbackCollector:
    @pytest.fixture
    def collector(self):
        return FeedbackCollector()

    def test_collect_single(self, collector):
        fb = collector.collect_feedback(FeedbackType.QUALITY, 4, topic="Test")
        assert fb.rating == 4
        assert len(collector._feedbacks) == 1

    def test_collect_multiple(self, collector):
        for t in FeedbackType:
            collector.collect_feedback(t, 3)
        assert len(collector._feedbacks) == 5

    def test_collect_batch(self, collector):
        data = [
            {"type": "quality", "rating": 4, "topic": "T1"},
            {"type": "accuracy", "rating": 2, "topic": "T2"},
            {"type": "relevance", "rating": 5, "topic": "T3"},
        ]
        results = collector.collect_feedback_batch(data)
        assert len(results) == 3

    def test_get_statistics(self, collector):
        collector.collect_feedback(FeedbackType.QUALITY, 5)
        collector.collect_feedback(FeedbackType.QUALITY, 1)
        collector.collect_feedback(FeedbackType.ACCURACY, 3)
        stats = collector.get_statistics()
        assert stats["total_feedback"] == 3
        assert 2.0 <= stats["average_rating"] <= 4.0
        assert "quality" in stats["by_type"]

    def test_get_statistics_empty(self, collector):
        stats = collector.get_statistics()
        assert stats["total_feedback"] == 0

    def test_get_feedbacks_by_type(self, collector):
        collector.collect_feedback(FeedbackType.QUALITY, 4)
        collector.collect_feedback(FeedbackType.ACCURACY, 3)
        collector.collect_feedback(FeedbackType.QUALITY, 5)
        quality_fbs = collector.get_feedbacks_by_type(FeedbackType.QUALITY)
        assert len(quality_fbs) == 2

    def test_get_positive_feedbacks(self, collector):
        collector.collect_feedback(FeedbackType.QUALITY, 4)
        collector.collect_feedback(FeedbackType.QUALITY, 2)
        collector.collect_feedback(FeedbackType.QUALITY, 5)
        positive = collector.get_positive_feedbacks()
        assert len(positive) == 2

    def test_export_feedbacks(self, collector):
        collector.collect_feedback(FeedbackType.QUALITY, 4, topic="Test")
        exported = collector.export_feedbacks()
        data = json.loads(exported)
        assert len(data) == 1
        assert data[0]["rating"] == 4

    def test_storage_file(self, tmp_path):
        path = tmp_path / "feedback.json"
        collector = FeedbackCollector(storage_path=str(path))
        collector.collect_feedback(FeedbackType.QUALITY, 5)
        assert path.exists()
        data = json.loads(path.read_text())
        assert len(data) == 1

    def test_feedback_with_metadata(self, collector):
        fb = collector.collect_feedback(
            FeedbackType.QUALITY, 4, topic="Test",
            extra="value", source="api",
        )
        assert fb.metadata["extra"] == "value"
        assert fb.metadata["source"] == "api"


class TestConvenienceFunctions:
    def test_collect_feedback(self):
        fb = collect_feedback("accuracy", 4, topic="Test", comment="Good")
        assert isinstance(fb, Feedback)
        assert fb.rating == 4
