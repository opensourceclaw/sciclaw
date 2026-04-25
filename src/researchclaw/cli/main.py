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

console = Console()


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
@click.option("--output", "-o", default=None, help="Output file path")
def research(topic, depth, output):
    """Research a topic deeply.

    TOPIC: The topic to research.

    Examples:
        researchclaw research "AI ethics"
        researchclaw research "quantum computing" --depth 5
    """
    console.print(f"[bold blue]ResearchClaw[/bold blue] - Researching: {topic}")
    console.print(f"Depth level: {depth}")

    if output:
        console.print(f"Output will be saved to: {output}")

    # Placeholder for actual research logic
    console.print("[green]Research complete![/green]")


@cli.command()
@click.argument("query")
@click.option("--limit", "-n", default=10, help="Number of results")
def search(query, limit):
    """Search for information.

    QUERY: Search query.

    Examples:
        researchclaw search "machine learning"
        researchclaw search "neural networks" --limit 20
    """
    console.print(f"[bold blue]Searching[/bold blue] for: {query}")
    console.print(f"Limit: {limit} results")

    # Placeholder for actual search logic
    console.print("[green]Search complete![/green]")


@cli.command()
def init():
    """Initialize a new ResearchClaw project.

    Examples:
        researchclaw init
    """
    console.print("[bold blue]Initializing[/bold blue] ResearchClaw project...")
    console.print("[green]Project initialized successfully![/green]")


def main():
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()
