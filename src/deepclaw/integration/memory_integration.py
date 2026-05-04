"""
DeepClaw Memory & Learning Integration

Connects DeepClaw to claw-mem (memory storage/search) and claw-rl (learning/feedback)
via their adapter layers. All integrations are optional — graceful fallback when
claw-mem or claw-rl packages are not installed.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional


class DeepClawMemoryIntegration:
    """
    Integrates DeepClaw with claw-mem and claw-rl via their adapter layers.

    All methods degrade gracefully when backing packages are not installed.
    """

    def __init__(self, workspace_dir: Optional[Path] = None):
        self.workspace = workspace_dir or Path(os.getcwd())
        self._mem_adapter = None
        self._mem_initialized = False
        self._rl_adapter = None
        self._rl_initialized = False
        self._mem_available = False
        self._rl_available = False

        self._init_mem()
        self._init_rl()

    # ---- claw-mem -------------------------------------------------------

    def _init_mem(self):
        """Lazily initialize claw-mem adapter."""
        try:
            from claw_mem.adapters import AdapterRegistry
            from claw_mem import MemoryManager
            workspace = os.environ.get("OPENCLAW_WORKSPACE", str(self.workspace))
            manager = MemoryManager(workspace=workspace)
            self._mem_adapter = AdapterRegistry.create_adapter(manager)
            self._mem_initialized = True
            self._mem_available = True
        except ImportError:
            self._mem_available = False
        except Exception:
            self._mem_available = False

    @property
    def mem_available(self) -> bool:
        return self._mem_available

    def search_memories(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Search claw-mem for relevant memories."""
        if not self._mem_available or not self._mem_adapter:
            return []
        try:
            result = self._mem_adapter.search({
                "query": query,
                "topK": top_k,
                "memory_type": "episodic",
            })
            # Normalize to list of dicts
            if isinstance(result, list):
                return result
            return result.get("results", [])
        except Exception:
            return []

    def store_memory(self, text: str, memory_type: str = "episodic",
                     metadata: Optional[Dict] = None) -> Optional[str]:
        """Store a memory entry via claw-mem."""
        if not self._mem_available or not self._mem_adapter:
            return None
        try:
            result = self._mem_adapter.store({
                "text": text,
                "memory_type": memory_type,
                "metadata": metadata or {},
            })
            return result.get("id")
        except Exception:
            return None

    def get_memory(self, memory_id: str) -> Optional[Dict]:
        """Retrieve a single memory by ID."""
        if not self._mem_available or not self._mem_adapter:
            return None
        try:
            result = self._mem_adapter.get({"id": memory_id})
            if "error" in result:
                return None
            return result
        except Exception:
            return None

    # ---- claw-rl --------------------------------------------------------

    def _init_rl(self):
        """Lazily initialize claw-rl bridge adapter."""
        try:
            from claw_rl.adapters import BridgeAdapterRegistry
            self._rl_adapter = BridgeAdapterRegistry.create_adapter()
            self._rl_adapter.initialize(str(self.workspace))
            self._rl_initialized = True
            self._rl_available = True
        except ImportError:
            self._rl_available = False
        except Exception:
            self._rl_available = False

    @property
    def rl_available(self) -> bool:
        return self._rl_available

    def get_learned_rules(self, context: str = "", top_k: int = 10) -> List[Dict[str, Any]]:
        """Get learned rules from claw-rl for context injection."""
        if not self._rl_available or not self._rl_adapter:
            return []
        try:
            result = self._rl_adapter.get_rules(top_k=top_k, context=context)
            return result.get("rules", [])
        except Exception:
            return []

    def learn_from_feedback(self, feedback: str, action: str = "",
                            context: str = "") -> Optional[Dict]:
        """Submit feedback to claw-rl for learning."""
        if not self._rl_available or not self._rl_adapter:
            return None
        try:
            return self._rl_adapter.collect_feedback(feedback, action, context)
        except Exception:
            return None

    def process_learning(self) -> Optional[Dict]:
        """Process accumulated learning signals."""
        if not self._rl_available or not self._rl_adapter:
            return None
        try:
            return self._rl_adapter.process_learning()
        except Exception:
            return None

    # ---- Convenience ----------------------------------------------------

    def store_research(self, topic: str, findings: List[Dict]) -> Optional[str]:
        """Store research findings as a structured memory."""
        text = f"Research: {topic}\n\n" + "\n".join(
            f"- {f.get('title', f.get('content', str(f)))[:500]}"
            for f in findings[:10]
        )
        return self.store_memory(text, memory_type="semantic", metadata={
            "source": "deepclaw",
            "type": "research",
            "topic": topic,
        })

    def get_research_context(self, query: str, top_k: int = 10) -> Dict[str, Any]:
        """Get combined memory + learned-rules context for a research query."""
        memories = self.search_memories(query, top_k=top_k)
        rules = self.get_learned_rules(context=query, top_k=min(top_k, 5))
        return {
            "memories": memories,
            "learned_rules": rules,
            "memory_count": len(memories),
            "rule_count": len(rules),
        }
