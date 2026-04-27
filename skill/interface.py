"""
ResearchClaw Skill Interface
Defines the base class for OpenClaw Skill integration
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import logging
import warnings


logger = logging.getLogger(__name__)


class SkillState(Enum):
    """Skill lifecycle states"""
    UNLOADED = "unloaded"
    LOADED = "loaded"
    ENABLED = "enabled"
    DISABLED = "disabled"
    ERROR = "error"


# Setup logging
def _setup_logging():
    """Setup skill logging"""
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

_setup_logging()


@dataclass
class ResearchResult:
    """Research result from skill execution"""
    topic: str
    content: str
    sources: List[str]
    confidence: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "content": self.content,
            "sources": self.sources,
            "confidence": self.confidence,
            "metadata": self.metadata
        }


@dataclass
class SearchResult:
    """Search result"""
    title: str
    url: str
    snippet: str
    score: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "score": self.score
        }


class BaseResearchSkill(ABC):
    """Base class for ResearchClaw OpenClaw Skill"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize skill with configuration

        Args:
            config: Skill configuration dictionary
        """
        self.config = config or {}
        self.name = "researchclaw"
        self.version = "0.5.0"
        self._state = SkillState.UNLOADED
        self._error_message: Optional[str] = None

    @property
    def state(self) -> SkillState:
        """Get current skill state"""
        return self._state

    @property
    def error_message(self) -> Optional[str]:
        """Get error message if in error state"""
        return self._error_message

    @abstractmethod
    def research(self, topic: str, **kwargs) -> ResearchResult:
        """Execute research on a topic

        Args:
            topic: Research topic
            **kwargs: Additional parameters (depth, engine, etc.)

        Returns:
            ResearchResult: Research findings
        """
        pass

    @abstractmethod
    def search(self, query: str, **kwargs) -> List[SearchResult]:
        """Search for information

        Args:
            query: Search query
            **kwargs: Additional parameters (limit, engine, etc.)

        Returns:
            List[SearchResult]: Search results
        """
        pass

    @abstractmethod
    def chat(self, prompt: str, **kwargs) -> str:
        """Chat with LLM

        Args:
            prompt: User prompt
            **kwargs: Additional parameters (provider, model, etc.)

        Returns:
            str: LLM response
        """
        pass

    # Configuration methods
    def load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load skill configuration

        Args:
            config_path: Path to config file

        Returns:
            Dict: Loaded configuration
        """
        if config_path:
            import json
            from pathlib import Path
            if Path(config_path).exists():
                with open(config_path) as f:
                    loaded = json.load(f)
                    self.config.update(loaded)
        return self.config

    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value

        Args:
            key: Configuration key
            default: Default value if key not found

        Returns:
            Any: Configuration value
        """
        return self.config.get(key, default)

    def set_config(self, key: str, value: Any) -> None:
        """Set configuration value

        Args:
            key: Configuration key
            value: Configuration value
        """
        self.config[key] = value

    # Lifecycle methods
    def on_load(self) -> bool:
        """Called when skill is loaded

        Returns:
            bool: True if load successful
        """
        try:
            self._state = SkillState.LOADED
            logger.info(f"Skill {self.name} loaded successfully")
            return True
        except Exception as e:
            self._state = SkillState.ERROR
            self._error_message = str(e)
            logger.error(f"Failed to load skill {self.name}: {e}")
            return False

    def on_unload(self) -> None:
        """Called when skill is unloaded"""
        self._state = SkillState.UNLOADED
        logger.info(f"Skill {self.name} unloaded")

    def on_enable(self) -> bool:
        """Called when skill is enabled

        Returns:
            bool: True if enable successful
        """
        if self._state == SkillState.LOADED:
            self._state = SkillState.ENABLED
            logger.info(f"Skill {self.name} enabled")
            return True
        return False

    def on_disable(self) -> None:
        """Called when skill is disabled"""
        self._state = SkillState.DISABLED
        logger.info(f"Skill {self.name} disabled")

    def on_start(self) -> bool:
        """Called when skill starts processing

        Returns:
            bool: True if start successful
        """
        return True

    def on_stop(self) -> None:
        """Called when skill stops processing"""
        pass

    def health_check(self) -> Dict[str, Any]:
        """Perform health check

        Returns:
            Dict: Health status
        """
        return {
            "healthy": self._state != SkillState.ERROR,
            "state": self._state.value,
            "error": self._error_message
        }

    def get_info(self) -> Dict[str, Any]:
        """Get skill information

        Returns:
            Dict: Skill metadata
        """
        return {
            "name": self.name,
            "version": self.version,
            "description": "Open-source Deep Research framework",
            "state": self._state.value,
        }


class ResearchClawSkill(BaseResearchSkill):
    """ResearchClaw Skill implementation for OpenClaw"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self._runner = None
        self._search_engine = None
        self._llm_engine = None
        self._cache_dir = self.get_config("cache_dir", ".researchclaw_cache")

    def on_load(self) -> bool:
        """Load skill and initialize components"""
        try:
            # Ensure cache directory exists
            from pathlib import Path
            Path(self._cache_dir).mkdir(parents=True, exist_ok=True)

            # Call parent on_load
            return super().on_load()
        except Exception as e:
            self._state = SkillState.ERROR
            self._error_message = str(e)
            return False

    def research(self, topic: str, **kwargs) -> ResearchResult:
        """Execute research on a topic

        Args:
            topic: Research topic (required, non-empty)
            **kwargs: Additional parameters (depth, engine, etc.)

        Returns:
            ResearchResult: Research findings

        Raises:
            ValueError: If topic is empty or invalid
        """
        # Validate topic
        if not topic or not topic.strip():
            logger.warning("Empty topic provided, returning empty result")
            return ResearchResult(
                topic="",
                content="",
                sources=[],
                confidence=0.0,
                metadata={"error": "Empty topic"}
            )

        # Validate depth
        depth = kwargs.get('depth', self.get_config('default_depth', 3))
        if depth is not None:
            try:
                depth = int(depth)
                depth = max(1, min(depth, 10))  # Clamp to 1-10
            except (ValueError, TypeError):
                depth = 3
                logger.warning(f"Invalid depth {kwargs.get('depth')}, using default 3")

        logger.info(f"Starting research on topic: {topic[:50]}... (depth={depth})")

        from researchclaw.research.runner import ResearchRunner

        output = kwargs.get('output')
        output_format = kwargs.get('format', 'markdown')

        try:
            runner = ResearchRunner()
            report = runner.run(topic, depth=depth)
        except Exception as e:
            logger.error(f"Research failed: {e}")
            return ResearchResult(
                topic=topic,
                content=f"Research failed: {str(e)}",
                sources=[],
                confidence=0.0,
                metadata={"error": str(e)}
            )

        # Save to file if output specified
        if output:
            from pathlib import Path
            output_file = Path(output)
            output_file.parent.mkdir(parents=True, exist_ok=True)

            if output_format == 'json':
                content = report.to_json()
            elif output_format == 'html':
                content = report.format_html()
            else:
                content = report.format_markdown()

            output_file.write_text(content)

        # Collect all sources
        all_sources = []
        for section in report.sections:
            all_sources.extend(section.sources)

        avg_confidence = sum(s.confidence for s in report.sections) / len(report.sections) if report.sections else 0

        return ResearchResult(
            topic=report.topic,
            content=report.format_markdown(),
            sources=all_sources,
            confidence=avg_confidence,
            metadata={
                "version": report.version,
                "sections": len(report.sections),
                "output": output
            }
        )

    def search(self, query: str, **kwargs) -> List[SearchResult]:
        """Search for information

        Args:
            query: Search query (required, non-empty)
            **kwargs: Additional parameters (limit, engine, etc.)

        Returns:
            List[SearchResult]: Search results

        Raises:
            ValueError: If query is empty
        """
        # Validate query
        if not query or not query.strip():
            logger.warning("Empty query provided, returning empty results")
            return []

        # Validate limit
        limit = kwargs.get('limit', self.get_config('default_limit', 10))
        if limit is not None:
            try:
                limit = int(limit)
                limit = max(1, min(limit, 50))  # Clamp to 1-50
            except (ValueError, TypeError):
                limit = 10
                logger.warning(f"Invalid limit {kwargs.get('limit')}, using default 10")

        engine = kwargs.get('engine', self.get_config('default_engine', 'duckduckgo'))

        logger.info(f"Searching for: {query[:50]}... (limit={limit}, engine={engine})")

        from researchclaw.research.search import SearchEngine

        search_engine = SearchEngine(provider=engine)

        try:
            results = search_engine.search(query, limit=limit)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

        return [
            SearchResult(
                title=r.title,
                url=r.url,
                snippet=r.snippet,
                score=r.score
            )
            for r in results
        ]

    def chat(self, prompt: str, **kwargs) -> str:
        """Chat with LLM

        Args:
            prompt: User prompt (required, non-empty)
            **kwargs: Additional parameters (provider, model, temperature, etc.)

        Returns:
            str: LLM response

        Raises:
            ValueError: If prompt is empty
        """
        # Validate prompt
        if not prompt or not prompt.strip():
            logger.warning("Empty prompt provided")
            return "Error: Empty prompt. Please provide a valid prompt."

        provider = kwargs.get('provider', self.get_config('default_provider', 'deepseek'))
        model = kwargs.get('model')
        temperature = kwargs.get('temperature', self.get_config('default_temperature', 0.7))
        max_tokens = kwargs.get('max_tokens')

        # Validate temperature
        try:
            temperature = float(temperature)
            temperature = max(0.0, min(temperature, 2.0))  # Clamp to 0-2
        except (ValueError, TypeError):
            temperature = 0.7
            logger.warning(f"Invalid temperature, using default 0.7")

        # Get API key from environment
        import os
        api_key = os.environ.get(f"{provider.upper()}_API_KEY")

        logger.info(f"Chat request to {provider}: {prompt[:30]}...")

        try:
            from researchclaw.llm.engine import LLMEngine
            from researchclaw.llm import ChatMessage, MessageRole

            engine = LLMEngine(provider=provider, model=model, api_key=api_key)
            messages = [ChatMessage(role=MessageRole.USER, content=prompt)]
            response = engine.chat(messages, temperature=temperature, max_tokens=max_tokens)

            return response.content
        except Exception as e:
            logger.error(f"Chat failed: {e}")
            return f"Error: Chat failed - {str(e)}"

    def health_check(self) -> Dict[str, Any]:
        """Perform health check"""
        base_health = super().health_check()

        # Check if required modules are available
        try:
            from researchclaw.research.runner import ResearchRunner
            from researchclaw.research.search import SearchEngine
            modules_ok = True
        except ImportError as e:
            modules_ok = False
            base_health["error"] = str(e)

        return {
            **base_health,
            "modules_loaded": modules_ok,
            "cache_dir": self._cache_dir
        }


# Factory function
def create_skill(config: Optional[Dict[str, Any]] = None) -> BaseResearchSkill:
    """Factory function to create ResearchClaw skill instance

    Args:
        config: Skill configuration

    Returns:
        BaseResearchSkill: Skill instance
    """
    return ResearchClawSkill(config=config)


__all__ = [
    "ResearchResult",
    "SearchResult",
    "SkillState",
    "BaseResearchSkill",
    "ResearchClawSkill",
    "create_skill"
]
