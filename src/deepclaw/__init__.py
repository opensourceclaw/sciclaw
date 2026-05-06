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
ResearchClaw - Open-source Deep Research Framework

A framework for conducting deep research on any topic.
"""

__version__ = "1.0.0"
__author__ = "OpenClaw Team"

from .cli import main
from .research import planner, search, synthesizer, runner
from .storage import manager
from .tools import web_search, content_extraction
from .config import Config, ConfigManager, get_config
from .cache import Cache, FileCache, get_cache, clear_cache

__all__ = [
    "main",
    "planner",
    "search",
    "synthesizer",
    "runner",
    "manager",
    "web_search",
    "content_extraction",
    "Config",
    "ConfigManager",
    "get_config",
    "Cache",
    "FileCache",
    "get_cache",
    "clear_cache",
]
