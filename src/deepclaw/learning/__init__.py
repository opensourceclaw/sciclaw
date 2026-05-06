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
Learning Package - Feedback collection, learning pipeline, and personalization
"""

from .feedback_collector import (
    FeedbackType,
    Feedback,
    FeedbackCollector,
    collect_feedback,
)
from .learning_pipeline import (
    LearningConfig,
    LearningResult,
    LearningPipeline,
    process_feedback,
)

__all__ = [
    "FeedbackType",
    "Feedback",
    "FeedbackCollector",
    "collect_feedback",
    "LearningConfig",
    "LearningResult",
    "LearningPipeline",
    "process_feedback",
]
