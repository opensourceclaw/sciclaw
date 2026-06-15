/**
 * Variable Extractor - Extracts key variables/entities from text
 */

import type { CausalVariable } from './types.js';

const CAUSAL_KEYWORDS = [
  '导致', '引起', '影响', '取决于', '因为', '所以', '因此',
  'cause', 'lead to', 'result in', 'due to', 'because', 'affect', 'influence',
  'contribute', 'trigger', '源于', '促使', '引发', '推动',
];

const SPLIT_PATTERN = /[,，。.；;：:\n\r!?？、()（）[\]]/;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function extractNounPhrases(text: string): string[] {
  const phrases: string[] = [];

  // Simple heuristic: extract capitalized multi-word sequences (English)
  const enMatches = text.match(/\b[A-Z][a-z]+(?:\s+[a-z]+)*\b/g);
  if (enMatches) phrases.push(...enMatches);

  // Extract quoted terms
  const quoted = text.match(/["""'']([^""""'']+)["""'']/g);
  if (quoted) {
    phrases.push(...quoted.map((q) => q.replace(/["""'']/g, '').trim()));
  }

  return phrases;
}

export class VariableExtractor {
  extract(text: string): CausalVariable[] {
    if (!text || !text.trim()) return [];

    const variableMap = new Map<string, CausalVariable>();
    const segments = text.split(SPLIT_PATTERN).map((s) => s.trim()).filter(Boolean);

    // Scan for causal keywords and their neighboring terms
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      const words = seg.split(/\s+/).filter(Boolean);

      // Check if this segment contains a causal keyword
      const hasCausalKeyword = CAUSAL_KEYWORDS.some((kw) =>
        seg.toLowerCase().includes(kw),
      );

      for (const word of words) {
        const cleaned = word.replace(/^[^a-zA-Z\u4e00-\u9fff]+|[^a-zA-Z\u4e00-\u9fff]+$/g, '');
        if (!cleaned || cleaned.length < 2) continue;
        if (/^(the|a|an|is|are|was|were|has|have|had|do|does|did|will|would|can|could|may|might|shall|should|这|那|的|了|是|在|有|和|就|不|人|都|而|及|与|着|或|一个|没有|我们|他们|它们|这个|那个|这些|那些)$/i.test(cleaned)) continue;

        const name = cleaned.length > 100 ? cleaned.slice(0, 100) : cleaned;
        const existing = variableMap.get(name.toLowerCase());

        if (existing) {
          existing.occurrences++;
          if (!existing.aliases.includes(name) && name !== existing.name) {
            existing.aliases.push(name);
          }
        } else {
          variableMap.set(name.toLowerCase(), {
            id: generateId(),
            name,
            aliases: [],
            context: seg.slice(0, 200),
            occurrences: 1,
          });
        }
      }

      // Extract noun phrases from causal-keyword segments
      if (hasCausalKeyword) {
        const phrases = extractNounPhrases(seg);
        for (const phrase of phrases) {
          const key = phrase.toLowerCase();
          if (!variableMap.has(key)) {
            variableMap.set(key, {
              id: generateId(),
              name: phrase,
              aliases: [],
              context: seg.slice(0, 200),
              occurrences: 1,
            });
          } else {
            variableMap.get(key)!.occurrences++;
          }
        }
      }
    }

    return Array.from(variableMap.values())
      .sort((a, b) => b.occurrences - a.occurrences);
  }
}
