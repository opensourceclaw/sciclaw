/**
 * Progressive Builder - Incrementally builds report sections
 */

import type { Section, SectionResult, BuilderOptions } from './types.js';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export class ProgressiveBuilder {
  private results: Map<string, SectionResult> = new Map();
  private options: BuilderOptions;

  constructor(options?: Partial<BuilderOptions>) {
    this.options = {
      maxRetries: 2,
      timeoutMs: 30000,
      ...options,
    };
  }

  async build(section: Section, context?: string): Promise<SectionResult> {
    const deps = section.dependencies;
    for (const depId of deps) {
      const depResult = this.results.get(depId);
      if (!depResult || depResult.section.status !== 'completed') {
        throw new Error(`Dependency not met: section ${depId} is not completed`);
      }
    }

    const startTime = Date.now();
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const content = context
          ? `Content for "${section.title}": ${context}`
          : `Generated content for "${section.title}".`;

        const result: SectionResult = {
          section: { ...section, status: 'completed' },
          content,
          wordCount: content.split(/\s+/).length,
          durationMs: Date.now() - startTime,
          confidence: 0.7,
        };

        this.results.set(section.id, result);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < this.options.maxRetries) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    }

    const failedResult: SectionResult = {
      section: { ...section, status: 'failed' },
      content: '',
      wordCount: 0,
      durationMs: Date.now() - startTime,
      confidence: 0,
      error: lastError ?? 'Unknown error',
    };

    this.results.set(section.id, failedResult);
    return failedResult;
  }

  async buildBatch(sections: Section[]): Promise<SectionResult[]> {
    const results: SectionResult[] = [];
    for (const section of sections) {
      const context = this.getContext(section);
      results.push(await this.build(section, context));
    }
    return results;
  }

  async rebuild(sectionId: string): Promise<SectionResult> {
    const existing = this.results.get(sectionId);
    if (!existing) {
      throw new Error(`Section ${sectionId} not found`);
    }

    // Mark downstream as pending
    for (const [, result] of this.results) {
      if (result.section.dependencies.includes(sectionId) && result.section.status === 'completed') {
        this.results.set(result.section.id, {
          ...result,
          section: { ...result.section, status: 'pending' },
        });
      }
    }

    this.results.delete(sectionId);
    const context = this.getContext(existing.section);
    return this.build({ ...existing.section, status: 'pending' }, context);
  }

  getResult(sectionId: string): SectionResult | undefined {
    return this.results.get(sectionId);
  }

  getAllResults(): SectionResult[] {
    return Array.from(this.results.values());
  }

  private getContext(section: Section): string {
    return section.dependencies
      .map((depId) => {
        const r = this.results.get(depId);
        return r ? r.content : '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
}
