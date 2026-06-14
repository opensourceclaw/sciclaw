/**
 * Research module - Deep research orchestration
 */

import { v4 as uuidv4 } from 'uuid';
import { search } from '../search/index.js';
import { extractContent } from '../extractor/index.js';
import { synthesize } from '../llm/index.js';
import type { ResearchOptions, ResearchResult, ResearchSection, SourceCitation } from '../types/index.js';

export async function conductResearch(options: ResearchOptions): Promise<ResearchResult> {
  const id = uuidv4();
  const depth = options.depth ?? 'medium';

  // Step 1: Search for sources
  const searchResults = await search({
    query: options.topic,
    maxResults: depth === 'shallow' ? 10 : depth === 'medium' ? 20 : 50,
  });

  // Step 2: Extract content from top sources
  const contents = await Promise.all(
    searchResults.slice(0, 10).map(async (r) => {
      try {
        const content = await extractContent(r.url);
        return { ...r, content };
      } catch {
        return { ...r, content: r.snippet };
      }
    })
  );

  // Step 3: Synthesize research
  const summary = await synthesize(options.topic, contents);

  // Step 4: Build sections
  const sections: ResearchSection[] = [
    {
      title: 'Overview',
      content: summary,
      sources: contents.slice(0, 5).map(toCitation),
    },
  ];

  const sources: SourceCitation[] = contents.map(toCitation);

  return {
    id,
    topic: options.topic,
    summary,
    sections,
    sources,
    createdAt: new Date(),
  };
}

function toCitation(result: { title: string; url: string }): SourceCitation {
  return {
    title: result.title,
    url: result.url,
    accessedAt: new Date(),
  };
}

export { conductResearch as default };
