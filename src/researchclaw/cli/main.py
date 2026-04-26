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
ResearchClaw CLI - Command Line Interface
"""

import sys
import os
import logging
import click
from rich.console import Console
from rich.progress import (
    Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn,
    TimeRemainingColumn, TimeElapsedColumn
)
from rich.progress import ProgressColumn
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from pathlib import Path
from datetime import datetime

from researchclaw.research.runner import ResearchRunner
from researchclaw.research.synthesizer import ResearchReport
from researchclaw.research.search import SearchEngine
from researchclaw.search.providers import SearchProviderRegistry
from researchclaw.llm.base import LLMProviderRegistry
from researchclaw.llm.engine import LLMEngine
from researchclaw.llm import ChatMessage, MessageRole

console = Console()

# Default engine
DEFAULT_ENGINE = "duckduckgo"


class QueryColumn(ProgressColumn):
    """Custom column showing current query"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._query = ""
    
    def update(self, task):
        return Text(f"[cyan]{task.fields.get('query', 'Searching...')[:40]}[/cyan]")
    
    def get_fraction(self):
        return None


def setup_logging(verbose: bool = False, quiet: bool = False):
    """Setup logging configuration
    
    Args:
        verbose: Enable verbose logging
        quiet: Suppress all output
    """
    if quiet:
        logging.basicConfig(level=logging.CRITICAL)
    elif verbose:
        logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    else:
        logging.basicConfig(level=logging.WARNING)


def print_banner():
    """Print ResearchClaw banner"""
    banner = Text("""
╔═══════════════════════════════════════════════════════════╗
║   ███████╗ █████╗ ██████╗ ██╗     ███████╗███████╗██╗     ║
║   ██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝██║     ║
║   █████╗  ███████║██████╔╝██║     █████╗  █████╗  ██║     ║
║   ██╔══╝  ██╔══██║██╔══██╗██║     ██╔══╝  ██╔══╝  ██║     ║
║   ██║     ██║  ██║██████╔╝███████╗███████╗██║     ███████╗
║   ╚═╝     ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚═╝     ╚══════╝
║              Deep Research Framework v0.2.0              ║
╚═══════════════════════════════════════════════════════════╝
""", style="bold cyan")
    console.print(banner)


def format_report_markdown(report: ResearchReport) -> str:
    """Format research report as Markdown

    Args:
        report: Research report

    Returns:
        str: Markdown formatted report
    """
    return report.format_markdown(include_toc=True, include_summary=True)


def save_report_to_file(report: ResearchReport, output_path: str, output_format: str = "markdown") -> str:
    """Save report to file

    Args:
        report: Research report
        output_path: Output file path
        output_format: Output format (markdown, html, json)

    Returns:
        str: Path to saved file
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    if output_format == "json":
        content = report.to_json()
    elif output_format == "html":
        content = report.format_html()
    else:
        content = report.format_markdown()
    
    output_file.write_text(content)
    return str(output_file)


def validate_engine(ctx, param, value):
    """Validate engine name

    Args:
        ctx: Click context
        param: Parameter
        value: Engine name

    Returns:
        str: Validated engine name
    """
    if value is None:
        return DEFAULT_ENGINE

    available = SearchProviderRegistry.list_providers()
    if value.lower() not in available:
        raise click.BadParameter(
            f"Invalid engine '{value}'. Available: {', '.join(available)}"
        )
    return value.lower()


def get_api_key_for_engine(engine: str) -> str:
    """Get API key for engine from config

    Args:
        engine: Engine name

    Returns:
        str: API key or None
    """
    try:
        from researchclaw.config import get_config
        config = get_config()
        providers = config.search.get("providers", {}) if hasattr(config, "search") else {}
        engine_config = providers.get(engine, {})
        return engine_config.get("api_key")
    except Exception:
        return None


@click.group()
@click.version_option(version="0.2.0")
def cli():
    """ResearchClaw - Open-source Deep Research Framework

    A powerful tool for conducting in-depth research on any topic.
    """
    pass


@cli.command()
@click.argument("topic")
@click.option("--depth", "-d", default=3, help="Research depth level")
@click.option("--output", "-o", default=None, help="Output file path")
@click.option("--format", "-f", type=click.Choice(["markdown", "html", "json"]), 
              default="markdown", help="Output format")
@click.option("--engine", "-e", default=DEFAULT_ENGINE, help="Search engine to use",
              callback=validate_engine, is_eager=True)
@click.option("--verbose", "-v", is_flag=True, help="Verbose output")
@click.option("--quiet", "-q", is_flag=True, help="Suppress all output except errors")
def research(topic, depth, output, format, engine, verbose, quiet):
    """Research a topic deeply.

    TOPIC: The topic to research.

    Examples:
        researchclaw research "AI ethics"
        researchclaw research "quantum computing" --depth 5
        researchclaw research "AI" --output ./reports/ai.md
        researchclaw research "AI" --format html
    """
    setup_logging(verbose, quiet)
    
    if not quiet:
        print_banner()
        console.print(f"[bold]Topic:[/bold] {topic}")
        console.print(f"[bold]Depth:[/bold] {depth}")
        console.print(f"[bold]Engine:[/bold] {engine}")
        if output:
            console.print(f"[bold]Output:[/bold] {output} ({format})")
        console.print()

    start_time = datetime.now()
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(bar_width=40),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        TimeRemainingColumn(),
        console=console if not quiet else None,
        transient=quiet,
    ) as progress:
        if not quiet:
            task = progress.add_task("[cyan]Researching...", total=depth * 10)
        else:
            task = None

        try:
            provider_class = SearchProviderRegistry.get(engine)
            api_key = None
            if provider_class and provider_class.requires_api_key:
                api_key = get_api_key_for_engine(engine)
                if not api_key and not quiet:
                    console.print(f"[yellow]Warning: {engine} requires API key[/yellow]")

            runner = ResearchRunner()
            
            if task:
                progress.update(task, description=f"[cyan]Researching: {topic[:30]}...")
                progress.advance(task, 2)
            
            report = runner.run(topic, depth=depth)
            
            if task:
                progress.update(task, completed=depth * 10)

        except Exception as e:
            if quiet:
                print(f"Error: {str(e)}", file=sys.stderr)
            else:
                console.print(f"[bold red]Error:[/bold red] {str(e)}")
            if verbose:
                raise
            sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    if not quiet:
        console.print()
        
        # Result panel
        result_text = Text()
        result_text.append(f"✓ Research Complete\n\n", style="bold green")
        result_text.append(f"Topic: {report.topic}\n", style="bold")
        result_text.append(f"Sections: {len(report.sections)}\n")
        result_text.append(f"Duration: {duration:.1f}s\n")
        
        console.print(Panel(result_text, title="[bold green]✓ Success[/bold green]", 
                           border_style="green", expand=False))

        # Sections table
        table = Table(title="Research Sections", show_header=True, header_style="bold cyan")
        table.add_column("#", style="cyan", width=3)
        table.add_column("Title", style="white")
        table.add_column("Sources", style="yellow", justify="right")
        table.add_column("Confidence", style="green", justify="right")
        
        for i, section in enumerate(report.sections, 1):
            sources_count = len(section.sources) if section.sources else 0
            conf_color = "green" if section.confidence >= 0.7 else "yellow" if section.confidence >= 0.4 else "red"
            table.add_row(
                str(i),
                section.title,
                str(sources_count),
                f"[{conf_color}]{section.confidence:.2f}[/{conf_color}]"
            )
        
        console.print(table)
        console.print()

        if output:
            saved_path = save_report_to_file(report, output, format)
            console.print(f"[bold]Report saved to:[/bold] [link]{saved_path}[/link]")
        elif verbose:
            console.print("[bold]Report Preview:[/bold]")
            console.print(format_report_markdown(report)[:2000] + "...")
    else:
        if output:
            saved_path = save_report_to_file(report, output, format)
            print(saved_path)


@cli.command()
@click.argument("query")
@click.option("--limit", "-n", default=10, help="Number of results")
@click.option("--engine", "-e", default=DEFAULT_ENGINE, help="Search engine to use",
              callback=validate_engine, is_eager=True)
@click.option("--output", "-o", default=None, help="Output file path")
@click.option("--format", "-f", type=click.Choice(["markdown", "json"]), 
              default="markdown", help="Output format")
@click.option("--verbose", "-v", is_flag=True, help="Verbose output")
@click.option("--quiet", "-q", is_flag=True, help="Suppress all output except errors")
def search(query, limit, engine, output, format, verbose, quiet):
    """Search for information.

    QUERY: Search query.

    Examples:
        researchclaw search "machine learning"
        researchclaw search "neural networks" --limit 20
    """
    setup_logging(verbose, quiet)
    
    if not quiet:
        console.print(f"[bold cyan]🔍 Searching[/bold cyan] for: [bold]{query}[/bold]")
        console.print(f"Engine: {engine} | Limit: {limit}")

    try:
        provider_class = SearchProviderRegistry.get(engine)
        api_key = None
        if provider_class:
            temp_provider = provider_class()
            if temp_provider.requires_api_key:
                api_key = get_api_key_for_engine(engine)
                if not api_key and not quiet:
                    console.print(f"[yellow]Warning: {engine} requires API key[/yellow]")

        engine_obj = SearchEngine(provider=engine, api_key=api_key)
        results = engine_obj.search(query, limit=limit)

        if not quiet:
            console.print(f"[bold green]✓ Found {len(results)} results[/bold green]")
            console.print()
            
            for i, result in enumerate(results, 1):
                console.print(f"[bold cyan]{i}.[/bold cyan] [bold]{result.title}[/bold]")
                console.print(f"   [link]{result.url}[/link]")
                snippet = result.snippet[:150] + "..." if len(result.snippet) > 150 else result.snippet
                console.print(f"   [dim]{snippet}[/dim]")
                console.print()

        if output:
            output_file = Path(output)
            output_file.parent.mkdir(parents=True, exist_ok=True)

            if format == "json":
                import json
                data = {
                    "query": query,
                    "engine": engine,
                    "results": [r.to_dict() for r in results]
                }
                output_file.write_text(json.dumps(data, indent=2, ensure_ascii=False))
            else:
                lines = [f"# Search Results: {query}", f"**Engine**: {engine}", ""]
                for i, result in enumerate(results, 1):
                    lines.append(f"## {i}. {result.title}")
                    lines.append(f"URL: {result.url}")
                    lines.append(f"Score: {result.score}")
                    lines.append(f"\n{result.snippet}\n")
                output_file.write_text("\n".join(lines))
            
            if not quiet:
                console.print(f"[bold]Results saved to:[/bold] [link]{output}[/link]")

    except Exception as e:
        if quiet:
            print(f"Error: {str(e)}", file=sys.stderr)
        else:
            console.print(f"[bold red]Error:[/bold red] {str(e)}")
        if verbose:
            raise
        sys.exit(1)


@cli.command("engines")
def list_engines():
    """List available search engines."""
    providers = SearchProviderRegistry.list_providers()

    table = Table(title="Available Search Engines")
    table.add_column("Engine", style="cyan", width=15)
    table.add_column("Requires API Key", style="yellow", width=15)
    table.add_column("Status", style="green", width=10)

    for name in providers:
        provider_class = SearchProviderRegistry.get(name)
        if provider_class:
            requires_key = "Yes" if provider_class.requires_api_key else "No"
            table.add_row(name, requires_key, "✓ Available")

    console.print(table)
    console.print("\n[bold]Note:[/bold] Set API keys in config.json")


@cli.command()
@click.argument("name", default=".")
@click.option("--topic", "-t", default="", help="Research topic")
def init(name, topic):
    """Initialize a new ResearchClaw project.

    NAME: Project name (default: current directory)

    Examples:
        researchclaw init
        researchclaw init my-project
    """
    project_path = Path(name)

    if project_path.exists() and (project_path / "pyproject.toml").exists():
        console.print(f"[yellow]Project already exists at {project_path}[/yellow]")
        return

    console.print(f"[bold blue]Initializing[/bold blue] ResearchClaw project: {name}")

    project_path.mkdir(parents=True, exist_ok=True)

    (project_path / "pyproject.toml").write_text("""[project]
name = "research-project"
version = "0.1.0"
description = "Research project"
""")

    (project_path / "README.md").write_text(f"""# {name}

Research project initialized with ResearchClaw.

## Usage

```bash
researchclaw research "{topic or 'your topic'}"
```
""")

    console.print("[bold green]Project initialized successfully![/bold green]")


def validate_llm_provider(ctx, param, value):
    """Validate LLM provider name
    
    Args:
        ctx: Click context
        param: Parameter
        value: Provider name
        
    Returns:
        str: Validated provider name
    """
    if value is None:
        return "deepseek"
    
    available = LLMProviderRegistry.list_providers()
    if value.lower() not in available:
        raise click.BadParameter(
            f"Invalid provider '{value}'. Available: {', '.join(available)}"
        )
    return value.lower()


@cli.command()
@click.argument("prompt")
@click.option("--model", "-m", default=None, help="Model name (uses provider default if not specified)")
@click.option("--provider", "-p", default="deepseek", help="LLM provider to use",
              callback=validate_llm_provider, is_eager=True)
@click.option("--system", "-s", default=None, help="System prompt")
@click.option("--temperature", "-t", default=0.7, type=float, help="Temperature (0.0-2.0)")
@click.option("--max-tokens", default=None, type=int, help="Maximum tokens to generate")
@click.option("--verbose", "-v", is_flag=True, help="Verbose output")
def llm(prompt, model, provider, system, temperature, max_tokens, verbose):
    """Chat with an LLM.
    
    PROMPT: The message to send to the LLM.
    
    Examples:
        researchclaw llm "What is Python?"
        researchclaw llm "Explain quantum computing" --provider glm
        researchclaw llm "Write a function" --model deepseek-coder --temperature 0.3
    """
    setup_logging(verbose, quiet=False)
    
    try:
        api_key = None
        provider_class = LLMProviderRegistry.get(provider)
        if provider_class and provider_class.requires_api_key:
            api_key = os.environ.get(f"{provider.upper()}_API_KEY")
            if not api_key:
                console.print(f"[yellow]Warning: {provider} requires API key[/yellow]")
                console.print(f"[dim]Set {provider.upper()}_API_KEY environment variable[/dim]")

        engine = LLMEngine(provider=provider, model=model, api_key=api_key)
        
        if verbose:
            console.print(f"[dim]Provider:[/dim] {provider}")
            console.print(f"[dim]Model:[/dim] {engine.model}")
            console.print()
        
        messages = []
        if system:
            messages.append(ChatMessage(role=MessageRole.SYSTEM, content=system))
        messages.append(ChatMessage(role=MessageRole.USER, content=prompt))
        
        response = engine.chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        console.print(Panel(response.content, title=f"[bold]{provider}: {engine.model}[/bold]", 
                           border_style="cyan", expand=False))
        
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")
        if verbose:
            raise
        sys.exit(1)


@cli.command("llms")
def list_llms():
    """List available LLM providers and models."""
    providers = LLMProviderRegistry.list_providers()

    table = Table(title="Available LLM Providers")
    table.add_column("Provider", style="cyan", width=12)
    table.add_column("Default Model", style="yellow", width=20)
    table.add_column("Requires API Key", style="red", width=15)
    table.add_column("Status", style="green", width=10)

    for name in providers:
        provider_class = LLMProviderRegistry.get(name)
        if provider_class:
            try:
                temp_provider = provider_class()
                default_model = temp_provider.default_model
                requires_key = "Yes" if temp_provider.requires_api_key else "No"
            except Exception:
                default_model = "(error)"
                requires_key = "?"
            table.add_row(name, default_model, requires_key, "✓ Available")

    console.print(table)
    console.print("\n[bold]Note:[/bold] Set API keys via environment variables (e.g., DEEPSEEK_API_KEY)")


def main():
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()
