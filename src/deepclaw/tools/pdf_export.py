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
PDF Export Module

Generates PDF reports with customizable styling, headers, footers, and pagination.
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class PDFFooterSettings:
    """PDF footer settings"""
    include_page_numbers: bool = True
    include_date: bool = False
    text: str = ""
    font_size: int = 10
    alignment: str = "center"  # left, center, right


@dataclass
class PDFHeaderSettings:
    """PDF header settings"""
    include_title: bool = True
    include_separator: bool = True
    font_size: int = 12
    alignment: str = "center"  # left, center, right


@dataclass
class PDFStyleSettings:
    """PDF styling configuration"""
    # Font settings
    font_family: str = "Helvetica"
    font_size_body: int = 11
    font_size_heading1: int = 20
    font_size_heading2: int = 16
    font_size_heading3: int = 14
    
    # Color settings
    primary_color: str = "#333333"
    accent_color: str = "#0066CC"
    link_color: str = "#0066CC"
    
    # Spacing
    margin_top: int = 50
    margin_bottom: int = 50
    margin_left: int = 40
    margin_right: int = 40
    line_height: float = 1.5
    paragraph_spacing: float = 12
    
    # Page settings
    page_size: str = "A4"  # A4, Letter
    orientation: str = "portrait"  # portrait, landscape
    
    # Header/Footer
    header: PDFHeaderSettings = field(default_factory=PDFHeaderSettings)
    footer: PDFFooterSettings = field(default_factory=PDFFooterSettings)
    
    # Table of contents
    include_toc: bool = True
    toc_title: str = "Table of Contents"
    
    # Source formatting
    source_format: str = "numbered"  # numbered, bulleted


# Import from report_formatter - forward declaration handled at runtime
def _get_report_formatter_classes():
    """Get required classes from report_formatter module"""
    from deepclaw.tools.report_formatter import (
        Source,
        ReportSection,
        ResearchReport,
    )
    return Source, ReportSection, ResearchReport


# Default style settings
DEFAULT_STYLE = PDFStyleSettings()

# APA Style settings
APA_STYLE = PDFStyleSettings(
    font_family="Helvetica",
    font_size_body=11,
    line_height=1.5,
    primary_color="#000000",
    accent_color="#000000",
    include_toc=False,
)

# MLA Style settings  
MLA_STYLE = PDFStyleSettings(
    font_family="Times New Roman",
    font_size_body=12,
    line_height=1.5,
    primary_color="#000000",
    accent_color="#000000",
    include_toc=False,
)


def convert_markdown_to_html(text: str) -> str:
    """Convert basic markdown to HTML for PDF rendering
    
    Args:
        text: Markdown text
        
    Returns:
        HTML string
    """
    html = text
    
    # Headers
    html = re.sub(r"^#### (.+)$", r"<h4>\1</h4>", html, flags=re.MULTILINE)
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)
    
    # Bold and Italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)
    
    # Links - convert to numbered references for PDF
    html = re.sub(r"\[(.+?)\]\((.+?)\)", r"\1", html)
    
    # Line breaks
    html = html.replace("\n\n", "</p><p>")
    html = html.replace("\n", "<br/>")
    
    return f"<p>{html}</p>"


def generate_pdf_css(style: PDFStyleSettings) -> str:
    """Generate CSS for PDF rendering
    
    Args:
        style: Style settings
        
    Returns:
        CSS string
    """
    page_size = style.page_size
    orientation = style.orientation
    
    # Convert page size and orientation to CSS
    if page_size == "Letter":
        width = "8.5in" if orientation == "portrait" else "11in"
        height = "11in" if orientation == "portrait" else "8.5in"
    else:  # A4
        width = "210mm" if orientation == "portrait" else "297mm"
        height = "297mm" if orientation == "portrait" else "210mm"
    
    # Convert margins
    margin_top = f"{style.margin_top}px"
    margin_bottom = f"{style.margin_bottom}px"
    margin_left = f"{style.margin_left}px"
    margin_right = f"{style.margin_right}px"
    
    return f"""
    @page {{
        size: {width} {height};
        margin-top: {margin_top};
        margin-bottom: {margin_bottom};
        margin-left: {margin_left};
        margin-right: {margin_right};
        
        @top-center {{
            content: "{style.header.include_title if hasattr(style.header, 'include_title') else True}";
            font-size: {style.header.font_size if hasattr(style.header, 'font_size') else 12}pt;
            font-family: {style.font_family};
            color: {style.primary_color};
        }}
        
        @bottom-center {{
            content: counter(page) " / " counter(pages);
            font-size: {style.footer.font_size}pt;
            font-family: {style.font_family};
            color: {style.primary_color};
        }}
    }}
    
    body {{
        font-family: {style.font_family}, Arial, sans-serif;
        font-size: {style.font_size_body}pt;
        line-height: {style.line_height};
        color: {style.primary_color};
    }}
    
    h1 {{
        font-size: {style.font_size_heading1}pt;
        color: {style.primary_color};
        page-break-after: avoid;
        margin-top: 20pt;
        margin-bottom: 12pt;
    }}
    
    h2 {{
        font-size: {style.font_size_heading2}pt;
        color: {style.primary_color};
        page-break-after: avoid;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5pt;
        margin-top: 16pt;
        margin-bottom: 10pt;
    }}
    
    h3 {{
        font-size: {style.font_size_heading3}pt;
        color: {style.primary_color};
        page-break-after: avoid;
        margin-top: 12pt;
        margin-bottom: 8pt;
    }}
    
    h4 {{
        font-size: {style.font_size_body}pt;
        font-weight: bold;
        color: {style.primary_color};
        page-break-after: avoid;
        margin-top: 10pt;
        margin-bottom: 6pt;
    }}
    
    p {{
        margin-top: 0;
        margin-bottom: {style.paragraph_spacing}pt;
        text-align: justify;
    }}
    
    a {{
        color: {style.link_color};
        text-decoration: none;
    }}
    
    .toc {{
        background: #f9f9f9;
        padding: 15pt;
        margin: 20pt 0;
    }}
    
    .toc h2 {{
        border-bottom: none;
    }}
    
    .toc ul {{
        list-style: disc;
        padding-left: 20pt;
    }}
    
    .source {{
        margin: 10pt 0;
        padding: 10pt;
        background: #f5f5f5;
    }}
    
    .metadata {{
        color: #666;
        font-size: 10pt;
        margin-bottom: 20pt;
    }}
    
    .summary {{
        background: #f0f7ff;
        padding: 15pt;
        border-left: 4pt solid {style.accent_color};
        margin: 15pt 0;
    }}
    
    @page :first {{
        @top-center {{
            content: "";
        }}
    }}
    """


def generate_full_html(
    report: 'ResearchReport',
    style: PDFStyleSettings = DEFAULT_STYLE,
    include_toc: bool = True,
) -> str:
    """Generate full HTML document for PDF conversion
    
    Args:
        report: ResearchReport instance
        style: PDF style settings
        include_toc: Include table of contents
        
    Returns:
        Complete HTML document
    """
    Source, ReportSection, ResearchReport = _get_report_formatter_classes()
    
    html_parts = [
        "<!DOCTYPE html>",
        "<html lang='en'>",
        "<head>",
        "  <meta charset='UTF-8'>",
        "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
        f"  <title>{report.topic}</title>",
        "  <style>",
        generate_pdf_css(style),
        "  </style>",
        "</head>",
        "<body>",
    ]

    # Title
    html_parts.append(f"  <h1>{report.topic}</h1>")
    
    # Metadata
    html_parts.append("  <div class='metadata'>")
    html_parts.append(f"    <p>Generated: {report.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>")
    if report.metadata.get("query"):
        html_parts.append(f"    <p>Query: {report.metadata['query']}</p>")
    html_parts.append("  </div>")

    # Summary
    if report.summary:
        html_parts.append("  <div class='summary'>")
        html_parts.append("    <h2>Summary</h2>")
        html_parts.append(f"    <p>{convert_markdown_to_html(report.summary)}</p>")
        html_parts.append("  </div>")

    # Table of contents
    if include_toc and style.include_toc and report.sections:
        html_parts.append("  <div class='toc'>")
        html_parts.append(f"    <h2>{style.toc_title}</h2>")
        html_parts.append("    <ul>")
        for i, section in enumerate(report.sections, 1):
            slug = ResearchReport._slugify(section.title)
            indent = "  " * (section.level - 2)
            html_parts.append(f'      <li><a href="#{slug}">{section.title}</a></li>')
        html_parts.append("    </ul>")
        html_parts.append("  </div>")

    # Sections
    for section in report.sections:
        slug = ResearchReport._slugify(section.title)
        html_parts.append(f"  <h{section.level} id='{slug}'>{section.title}</h{section.level}>")
        html_parts.append(f"  <div>{convert_markdown_to_html(section.content)}</div>")

    # Sources
    if report.sources:
        html_parts.append("  <h2>References</h2>")
        
        if style.source_format == "numbered":
            for i, source in enumerate(report.sources, 1):
                html_parts.append(f"  <div class='source' id='source-{i}'>")
                html_parts.append(f"    <strong>[{i}] {source.title}</strong>")
                if source.author:
                    html_parts.append(f"    <br>Author: {source.author}")
                if source.date:
                    html_parts.append(f"    <br>Date: {source.date}")
                html_parts.append(f"    <br>URL: <a href='{source.url}'>{source.url}</a>")
                html_parts.append("  </div>")
        else:
            for i, source in enumerate(report.sources, 1):
                html_parts.append(f"  <div class='source'>")
                html_parts.append(f"    <strong>• {source.title}</strong>")
                if source.author:
                    html_parts.append(f"    <br>Author: {source.author}")
                if source.date:
                    html_parts.append(f"    <br>Date: {source.date}")
                html_parts.append(f"    <br>URL: <a href='{source.url}'>{source.url}</a>")
                html_parts.append("  </div>")

    html_parts.extend(["</body>", "</html>"])
    return "\n".join(html_parts)


def export_to_pdf(
    report: 'ResearchReport',
    output_path: str,
    style: Optional[PDFStyleSettings] = None,
    include_toc: bool = True,
) -> None:
    """Export report to PDF file
    
    Args:
        report: ResearchReport instance
        output_path: Output PDF file path
        style: PDF style settings (uses default if not provided)
        include_toc: Include table of contents
        
    Raises:
        ImportError: If weasyprint is not installed
        IOError: If PDF generation fails
    """
    try:
        from weasyprint import HTML, CSS
    except ImportError:
        raise ImportError(
            "weasyprint is required for PDF export. "
            "Install with: pip install weasyprint"
        )
    
    style = style or DEFAULT_STYLE
    
    # Generate HTML
    html_content = generate_full_html(report, style, include_toc)
    
    # Convert to PDF
    html_doc = HTML(string=html_content)
    html_doc.write_pdf(output_path)


def report_to_pdf(
    report: 'ResearchReport',
    output_path: str,
    style_name: str = "default",
    **kwargs,
) -> None:
    """Export report to PDF with named style
    
    Args:
        report: ResearchReport instance
        output_path: Output PDF file path
        style_name: Style name (default, apa, mla)
        **kwargs: Additional style overrides
    """
    style_map = {
        "default": DEFAULT_STYLE,
        "apa": APA_STYLE,
        "mla": MLA_STYLE,
    }
    
    style = style_map.get(style_name, DEFAULT_STYLE)
    
    # Apply any custom overrides
    for key, value in kwargs.items():
        if hasattr(style, key):
            setattr(style, key, value)
    
    export_to_pdf(report, output_path, style, include_toc=style.include_toc)


__all__ = [
    "PDFStyleSettings",
    "PDFHeaderSettings", 
    "PDFFooterSettings",
    "DEFAULT_STYLE",
    "APA_STYLE",
    "MLA_STYLE",
    "generate_pdf_css",
    "generate_full_html",
    "export_to_pdf",
    "report_to_pdf",
    "convert_markdown_to_html",
]
