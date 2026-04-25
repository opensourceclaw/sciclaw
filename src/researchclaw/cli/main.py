#!/usr/bin/env python3
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
ResearchClaw CLI - Command Line Interface
"""

import click
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from pathlib import Path

from researchclaw.research.runner import ResearchRunner
from researchclaw.research.synthesizer import ResearchReport
from researchclaw.storage.manager import StorageManager

console = Console()


def format_report_markdown(report: ResearchReport) -> str:
    """Format research report as Markdown

    Args:
        report: Research report

    Returns:
        str: Markdown formatted report
    """
    lines = [
        f"# Research Report: {report.topic}",
        "",
        f"**Generated**: {report.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
        f"**Version**: {report.version}",
        "",
        "---",
        "",
    ]

    for section in report.sections:
        lines.append(f"## {section.title}")
        lines.append("")
        lines.append(section.content)
        lines.append("")
        if section.sources:
            lines.append("### Sources")
            for source in section.sources:
                lines.append(f"- {source}")
            lines.append("")
        lines.append(f"**Confidence**: {section.confidence:.2f}")
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def save_report_to_file(report: ResearchReport, output_path: str) -> str:
    """Save report to file

    Args:
        report: Research report
        output_path: Output file path

    Returns:
        str: Path to saved file
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    markdown = format_report_markdown(report)
    output_file.write_text(markdown)

    return str(output_file)


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """ResearchClaw - Open-source Deep Research Framework

    A powerful tool for conducting in-depth research on any topic.
    """
    pass


@cli.command()
@click.argument("topic")
@click.option("--depth", "-d", default=3, help="Research depth level")
@click.option("--output", "-o", default=None, help="Output file path (Markdown)")
@click.option("--verbose", "-v", is_flag=True, help="Verbose output")
def research(topic, depth, output, verbose):
    """Research a topic deeply.

    TOPIC: The topic to research.

    Examples:
        researchclaw research "AI ethics"
        researchclaw research "quantum computing" --depth 5
        researchclaw research "AI" --output ./reports/ai.md
    """
    console.print(f"[bold blue]ResearchClaw[/bold blue] - Researching: {topic}")
    console.print(f"Depth level: {depth}")

    if output:
        console.print(f"Output will be saved to: {output}")

    # Run research
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Researching...", total=None)

        try:
            runner = ResearchRunner()
            report = runner.run(topic, depth=depth)
            progress.update(task, completed=True)

            # Display summary
            console.print("")
            console.print(f"[bold green]Research complete![/bold green]")
            console.print(f"Topic: {report.topic}")
            console.print(f"Sections: {len(report.sections)}")

            for section in report.sections:
                sources_count = len(section.sources) if section.sources else 0
                console.print(f"  - {section.title}: {sources_count} sources (confidence: {section.confidence:.2f})")

            # Save to file if output specified
            if output:
                saved_path = save_report_to_file(report, output)
                console.print(f"[bold]Report saved to:[/bold] {saved_path}")
            elif verbose:
                # Display full report
                console.print("")
                console.print("[bold]Report Preview:[/bold]")
                console.print(format_report_markdown(report)[:1000] + "...")

        except Exception as e:
            progress.update(task, completed=True)
            console.print(f"[bold red]Error:[/bold red] {str(e)}")
            if verbose:
                raise


@cli.command()
@click.argument("query")
@click.option("--limit", "-n", default=10, help="Number of results")
@click.option("--output", "-o", default=None, help="Output file path")
def search(query, limit, output):
    """Search for information.

    QUERY: Search query.

    Examples:
        researchclaw search "machine learning"
        researchclaw search "neural networks" --limit 20
    """
    console.print(f"[bold blue]Searching[/bold blue] for: {query}")
    console.print(f"Limit: {limit} results")

    from researchclaw.research.search import SearchEngine

    try:
        engine = SearchEngine()
        results = engine.search(query, limit=limit)

        console.print(f"[bold green]Found {len(results)} results[/bold green]")

        for i, result in enumerate(results, 1):
            console.print(f"\n[bold]{i}. {result.title}[/bold]")
            console.print(f"   {result.url}")
            console.print(f"   {result.snippet[:150]}...")

        # Save to file if output specified
        if output:
            output_file = Path(output)
            output_file.parent.mkdir(parents=True, exist_ok=True)

            lines = [f"# Search Results: {query}\n"]
            for i, result in enumerate(results, 1):
                lines.append(f"## {i}. {result.title}")
                lines.append(f"URL: {result.url}")
                lines.append(f"Score: {result.score}")
                lines.append(f"\n{result.snippet}\n")

            output_file.write_text("\n".join(lines))
            console.print(f"[bold]Results saved to:[/bold] {output}")

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")


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

    # Create project structure
    project_path.mkdir(parents=True, exist_ok=True)

    # Create basic files
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


def main():
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()
