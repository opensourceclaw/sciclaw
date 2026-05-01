#!/usr/bin/env python3
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
ResearchClaw Skill - OpenClaw Skill Integration

This module provides the OpenClaw Skill interface for ResearchClaw,
enabling deep research capabilities within the OpenClaw ecosystem.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


class ResearchDepth(str, Enum):
    """Research depth levels"""
    QUICK = "quick"
    STANDARD = "standard"
    DEEP = "deep"


class OutputFormat(str, Enum):
    """Output format types"""
    MARKDOWN = "markdown"
    HTML = "html"
    PDF = "pdf"


@dataclass
class ResearchRequest:
    """Research request parameters"""
    topic: str
    depth: ResearchDepth = ResearchDepth.STANDARD
    max_sources: int = 10
    language: str = "en"
    output_format: OutputFormat = OutputFormat.MARKDOWN
    interactive: bool = False
    
    def __post_init__(self):
        if isinstance(self.depth, str):
            self.depth = ResearchDepth(self.depth)
        if isinstance(self.output_format, str):
            self.output_format = OutputFormat(self.output_format)


@dataclass
class ResearchResult:
    """Research result container"""
    request: ResearchRequest
    report: Optional[str] = None
    sources: list = field(default_factory=list)
    status: str = "pending"
    error: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class BaseResearchSkill(ABC):
    """Base class for ResearchClaw Skill
    
    This abstract class defines the interface that any ResearchClaw
    implementation must provide to integrate with OpenClaw.
    """
    
    # Skill metadata (override in subclasses)
    name: str = "ResearchClaw"
    version: str = "0.5.0"
    description: str = "AI-powered deep research framework"
    
    def __init__(self, config: Optional[dict] = None):
        """Initialize the skill with configuration
        
        Args:
            config: Skill configuration dictionary
        """
        self.config = config or {}
        self._initialized = False
        logger.info(f"Initializing {self.name} v{self.version}")
    
    @abstractmethod
    def initialize(self) -> bool:
        """Initialize the skill and its dependencies
        
        Returns:
            True if initialization successful, False otherwise
        """
        pass
    
    @abstractmethod
    def execute(self, request: ResearchRequest) -> ResearchResult:
        """Execute a research request
        
        Args:
            request: Research request parameters
            
        Returns:
            Research result containing report and metadata
        """
        pass
    
    @abstractmethod
    def get_status(self) -> dict:
        """Get current skill status
        
        Returns:
            Dictionary containing status information
        """
        pass
    
    @abstractmethod
    def shutdown(self) -> bool:
        """Shutdown the skill and cleanup resources
        
        Returns:
            True if shutdown successful, False otherwise
        """
        pass
    
    def validate_config(self) -> bool:
        """Validate skill configuration
        
        Returns:
            True if configuration is valid
        """
        required_keys = []
        for key in required_keys:
            if key not in self.config:
                logger.error(f"Missing required config key: {key}")
                return False
        return True
    
    @property
    def is_initialized(self) -> bool:
        """Check if skill is initialized"""
        return self._initialized


class ResearchSkill(BaseResearchSkill):
    """ResearchClaw Skill implementation for OpenClaw
    
    This class provides the complete implementation of the ResearchClaw
    skill, integrating with OpenClaw's command system.
    """
    
    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        self._runner = None
        self._search_engine = None
        self._llm_engine = None
        self._research_results: dict = {}
    
    def initialize(self) -> bool:
        """Initialize ResearchClaw components"""
        try:
            from deepclaw.research.runner import ResearchRunner
            from deepclaw.research.search import SearchEngine
            from deepclaw.llm.engine import LLMEngine
            
            # Initialize components
            self._runner = ResearchRunner(
                search_provider=self.config.get("search_provider", "all"),
                llm_provider=self.config.get("llm_provider", "openai"),
                max_sources=self.config.get("max_sources", 10),
                cache_enabled=self.config.get("cache_enabled", True)
            )
            
            self._search_engine = SearchEngine(
                provider=self.config.get("search_provider", "duckduckgo")
            )
            
            self._llm_engine = LLMEngine(
                provider=self.config.get("llm_provider", "openai")
            )
            
            self._initialized = True
            logger.info("ResearchClaw Skill initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize ResearchClaw: {e}")
            return False
    
    def execute(self, request: ResearchRequest) -> ResearchResult:
        """Execute research request"""
        if not self._initialized:
            if not self.initialize():
                return ResearchResult(
                    request=request,
                    status="error",
                    error="Failed to initialize skill"
                )
        
        try:
            result = ResearchResult(request=request, status="running")
            
            # Map depth to research depth
            depth_map = {
                ResearchDepth.QUICK: 1,
                ResearchDepth.STANDARD: 2,
                ResearchDepth.DEEP: 3
            }
            
            # Execute research
            report = self._runner.run(
                query=request.topic,
                depth=depth_map.get(request.depth, 2),
                max_sources=request.max_sources,
                language=request.language
            )
            
            result.report = report.content if report else None
            result.sources = [s.dict() for s in report.sources] if report and hasattr(report, 'sources') else []
            result.status = "completed"
            result.created_at = report.created_at.isoformat() if report and hasattr(report, 'created_at') else None
            
            # Store result
            self._research_results[report.id] = result if report else None
            
            return result
            
        except Exception as e:
            logger.error(f"Research execution failed: {e}")
            return ResearchResult(
                request=request,
                status="error",
                error=str(e)
            )
    
    def get_status(self) -> dict:
        """Get skill status"""
        return {
            "name": self.name,
            "version": self.version,
            "initialized": self._initialized,
            "config": {
                "search_provider": self.config.get("search_provider"),
                "llm_provider": self.config.get("llm_provider"),
                "max_sources": self.config.get("max_sources")
            },
            "results_count": len(self._research_results)
        }
    
    def shutdown(self) -> bool:
        """Shutdown skill and cleanup"""
        try:
            self._research_results.clear()
            self._initialized = False
            logger.info("ResearchClaw Skill shutdown complete")
            return True
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
            return False
    
    def get_result(self, result_id: str) -> Optional[ResearchResult]:
        """Retrieve a previous research result"""
        return self._research_results.get(result_id)
    
    def list_results(self) -> list:
        """List all research results"""
        return [
            {"id": k, "status": v.status, "topic": v.request.topic}
            for k, v in self._research_results.items()
        ]


# Default skill instance
default_skill: Optional[ResearchSkill] = None


def get_skill(config: Optional[dict] = None) -> ResearchSkill:
    """Get or create the default skill instance"""
    global default_skill
    if default_skill is None:
        default_skill = ResearchSkill(config)
    return default_skill
