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
Rich CLI Output Module

Provides rich console output with progress bars, colors, and formatted tables.
"""

from typing import Optional, Iterable, Any, List, Dict
from dataclasses import dataclass
from enum import Enum

# Try to import rich, fall back to basic if not available
try:
    from rich.console import Console
    from rich.progress import (
        Progress,
        SpinnerColumn,
        TextColumn,
        BarColumn,
        TaskProgressColumn,
        TimeRemainingColumn,
        TimeElapsedColumn,
    )
    from rich.table import Table
    from rich.panel import Panel
    from rich.text import Text
    from rich.style import Style
    from rich.theme import Theme
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False


class OutputLevel(Enum):
    """Output verbosity levels"""
    QUIET = 0
    NORMAL = 1
    VERBOSE = 2
    DEBUG = 3


@dataclass
class CLIConfig:
    """CLI output configuration"""
    output_level: OutputLevel = OutputLevel.NORMAL
    use_colors: bool = True
    use_progress: bool = True
    show_timestamps: bool = False
    width: int = 80


class RichConsole:
    """Rich console output manager"""

    # Color scheme
    COLORS = {
        "success": "green",
        "error": "red",
        "warning": "yellow",
        "info": "blue",
        "debug": "dim",
        "highlight": "cyan",
        "secondary": "dim",
    }

    def __init__(self, config: Optional[CLIConfig] = None):
        """Initialize rich console

        Args:
            config: CLI configuration
        """
        self.config = config or CLIConfig()

        if RICH_AVAILABLE:
            # Custom theme
            theme = Theme({
                "success": "green",
                "error": "red bold",
                "warning": "yellow",
                "info": "blue",
                "debug": "dim",
            })
            self.console = Console(theme=theme, width=self.config.width)
        else:
            self.console = None

    def print(self, message: str, style: str = "info", level: OutputLevel = None) -> None:
        """Print a message with style

        Args:
            message: Message to print
            style: Style name (success, error, warning, info, debug)
            level: Minimum output level
        """
        level = level or self.config.output_level

        if level.value > self.config.output_level.value:
            return

        if not self.config.use_colors or not RICH_AVAILABLE:
            # Basic output without colors
            prefix = ""
            if style == "success":
                prefix = "✓ "
            elif style == "error":
                prefix = "✗ "
            elif style == "warning":
                prefix = "⚠ "
            print(f"{prefix}{message}")
            return

        # Rich output
        color = self.COLORS.get(style, "white")
        self.console.print(f"[{color}]{message}[/{color}]")

    def print_success(self, message: str) -> None:
        """Print success message"""
        self.print(f"✓ {message}", "success")

    def print_error(self, message: str) -> None:
        """Print error message"""
        self.print(f"✗ {message}", "error")

    def print_warning(self, message: str) -> None:
        """Print warning message"""
        self.print(f"⚠ {message}", "warning")

    def print_info(self, message: str) -> None:
        """Print info message"""
        self.print(message, "info")

    def print_debug(self, message: str) -> None:
        """Print debug message"""
        self.print(message, "debug")

    def print_header(self, title: str) -> None:
        """Print a section header"""
        if not self.config.use_colors or not RICH_AVAILABLE:
            print(f"\n{'=' * 40}")
            print(f"  {title}")
            print(f"{'=' * 40}\n")
            return

        self.console.print(f"\n[bold cyan]{'=' * 40}[/]")
        self.console.print(f"  [bold cyan]{title}[/]")
        self.console.print(f"[bold cyan]{'=' * 40}[/]\n")

    def print_table(self, data: List[Dict[str, Any]], title: str = None) -> None:
        """Print data as a table

        Args:
            data: List of dicts to display
            title: Optional table title
        """
        if not data:
            return

        if not self.config.use_colors or not RICH_AVAILABLE:
            # Basic table output
            if title:
                print(f"\n{title}")
                print("-" * 40)
            keys = list(data[0].keys())
            print(" | ".join(keys))
            for row in data:
                print(" | ".join(str(row.get(k, "")) for k in keys))
            return

        # Rich table
        table = Table(title=title, show_header=True, header_style="bold magenta")

        # Add columns
        keys = list(data[0].keys())
        for key in keys:
            table.add_column(key.replace("_", " ").title(), style="cyan")

        # Add rows
        for row in data:
            table.add_row(*[str(row.get(k, "")) for k in keys])

        self.console.print(table)

    def print_panel(self, content: str, title: str = None, style: str = "info") -> None:
        """Print content in a panel

        Args:
            content: Panel content
            title: Optional panel title
            style: Panel style
        """
        if not self.config.use_colors or not RICH_AVAILABLE:
            if title:
                print(f"\n--- {title} ---")
            print(content)
            print("-" * 40)
            return

        color = self.COLORS.get(style, "blue")
        self.console.print(Panel(content, title=title, border_style=color))

    def create_progress(self, description: str = "Processing...") -> "ProgressContext":
        """Create a progress bar context

        Args:
            description: Progress description

        Returns:
            Progress context manager
        """
        if not self.config.use_progress or not RICH_AVAILABLE:
            return ProgressContext(dummy=True)

        progress = Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=self.console,
        )
        return ProgressContext(progress=progress, description=description)


class ProgressContext:
    """Context manager for progress bars"""

    def __init__(self, progress=None, description: str = None, dummy: bool = False):
        """Initialize progress context

        Args:
            progress: Rich Progress instance
            description: Task description
            dummy: If True, this is a dummy progress bar
        """
        self.progress = progress
        self.description = description
        self.dummy = dummy
        self.task_id = None

    def __enter__(self):
        """Enter context"""
        if self.dummy:
            print(self.description)
            return self

        self.progress.__enter__()
        self.task_id = self.progress.add_task(self.description, total=None)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context"""
        if self.dummy:
            return

        if self.progress:
            self.progress.__exit__(exc_type, exc_val, exc_tb)

    def update(self, advance: int = 1, description: str = None):
        """Update progress

        Args:
            advance: Amount to advance
            description: New description
        """
        if self.dummy:
            return

        if self.progress and self.task_id is not None:
            if description:
                self.progress.update(self.task_id, description=description)
            self.progress.update(self.task_id, advance=advance)

    def set_total(self, total: int):
        """Set total progress

        Args:
            total: Total amount
        """
        if self.dummy:
            return

        if self.progress and self.task_id is not None:
            self.progress.update(self.task_id, total=total)


# Global console instance
_console: Optional[RichConsole] = None


def get_console(config: Optional[CLIConfig] = None) -> RichConsole:
    """Get global console instance

    Args:
        config: Optional configuration

    Returns:
        RichConsole instance
    """
    global _console
    if _console is None or config is not None:
        _console = RichConsole(config)
    return _console


def set_verbose(verbose: bool):
    """Set verbose mode

    Args:
        verbose: Enable verbose output
    """
    console = get_console()
    console.config.output_level = OutputLevel.VERBOSE if verbose else OutputLevel.NORMAL


def set_quiet(quiet: bool):
    """Set quiet mode

    Args:
        quiet: Enable quiet mode (only errors)
    """
    console = get_console()
    console.config.output_level = OutputLevel.QUIET if quiet else OutputLevel.NORMAL


__all__ = [
    "OutputLevel",
    "CLIConfig",
    "RichConsole",
    "ProgressContext",
    "get_console",
    "set_verbose",
    "set_quiet",
]
