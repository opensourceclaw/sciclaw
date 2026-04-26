# Copyright 2026 Peter Cheng
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
Summarization module - Content summarization, key point extraction, and fact extraction
"""

from researchclaw.summarization.summarizer import Summarizer, SummarizationLength, SummarizationStyle
from researchclaw.summarization.key_points import KeyPointExtractor, KeyPoint
from researchclaw.summarization.facts import FactExtractor, ExtractedFact
from researchclaw.summarization.errors import (
    SummarizationError,
    LLMError,
    RateLimitError,
    FallbackError,
)
from researchclaw.summarization.engine import SummarizationEngine

__all__ = [
    # Main classes
    "SummarizationEngine",
    "Summarizer",
    "KeyPointExtractor",
    "FactExtractor",
    # Data classes
    "SummarizationLength",
    "SummarizationStyle",
    "KeyPoint",
    "ExtractedFact",
    # Exceptions
    "SummarizationError",
    "LLMError",
    "RateLimitError",
    "FallbackError",
]
