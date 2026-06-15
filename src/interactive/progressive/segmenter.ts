/**
 * Section Segmenter - Splits reports into independently buildable sections
 */

import type { Section, SegmenterOptions } from './types.js';
import type { ProcessedFeedback } from '../feedback/types.js';

const DEFAULT_TEMPLATES: Record<string, string[]> = {
  research: ['introduction', 'methodology', 'results', 'discussion', 'conclusion'],
  technical: ['overview', 'architecture', 'implementation', 'evaluation', 'conclusion'],
  analysis: ['background', 'data', 'analysis', 'findings', 'recommendations'],
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function detectTemplate(topic: string): string[] {
  const lower = topic.toLowerCase();
  if (/research|study|experiment|analysis/i.test(lower)) return DEFAULT_TEMPLATES.research ?? [];
  if (/technical|architecture|system|platform/i.test(lower)) return DEFAULT_TEMPLATES.technical ?? [];
  if (/analysis|report|review/i.test(lower)) return DEFAULT_TEMPLATES.analysis ?? [];
  return DEFAULT_TEMPLATES.research ?? [];
}

function detectDependencies(sections: Section[]): Section[] {
  return sections.map((s, i) => {
    if (i === 0) return { ...s, dependencies: [] };
    if (i === sections.length - 1) return { ...s, dependencies: sections.slice(0, -1).map((x) => x.id) };
    return { ...s, dependencies: [sections[i - 1]!.id] };
  });
}

export class SectionSegmenter {
  private options: SegmenterOptions;

  constructor(options?: Partial<SegmenterOptions>) {
    this.options = {
      maxSections: 10,
      minSectionWords: 100,
      parallelBuild: false,
      ...options,
    };
  }

  segment(topic: string, outline?: string[]): Section[] {
    const titles = outline ?? detectTemplate(topic);
    const sections: Section[] = titles.slice(0, this.options.maxSections).map((title, i) => ({
      id: generateId(),
      title,
      description: `Section: ${title} for topic: ${topic}`,
      dependencies: [],
      status: 'pending' as const,
      priority: 1 - i * 0.1,
    }));

    return detectDependencies(sections);
  }

  resegment(sections: Section[], feedback: ProcessedFeedback): Section[] {
    if (feedback.action === 'continue' || feedback.action === 'halt') {
      return sections;
    }

    if (feedback.action === 'expand') {
      const newSection: Section = {
        id: generateId(),
        title: `Additional: ${feedback.original.content.slice(0, 50)}`,
        description: feedback.original.content,
        dependencies: sections.map((s) => s.id),
        status: 'pending',
        priority: 0.5,
      };
      return [...sections, newSection].slice(0, this.options.maxSections);
    }

    return sections;
  }

  detectDependencies(sections: Section[]): Section[] {
    return detectDependencies(sections);
  }
}
