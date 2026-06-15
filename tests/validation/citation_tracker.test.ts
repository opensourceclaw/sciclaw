import { describe, it, expect } from 'vitest';
import { CitationTracker } from '../../src/validation/citation_tracker.js';

describe('CitationTracker', () => {
  let tracker: CitationTracker;

  beforeEach(() => {
    tracker = new CitationTracker();
  });

  it('should add a citation', () => {
    const cit = tracker.addCitation('https://example.com/article', 'Test Article');
    expect(cit.url).toBe('https://example.com/article');
    expect(cit.title).toBe('Test Article');
    expect(cit.sourceId).toBeDefined();
    expect(cit.sourceId.length).toBe(8);
  });

  it('should deduplicate by URL and keep higher quality score', () => {
    const first = tracker.addCitation('https://example.com/article', 'Test', 0.5);
    const second = tracker.addCitation('https://example.com/article', 'Test', 0.9);
    expect(first.sourceId).toBe(second.sourceId);
    expect(first.qualityScore).toBe(0.9);
  });

  it('should get citation by sourceId', () => {
    const cit = tracker.addCitation('https://example.com/article');
    const found = tracker.getCitation(cit.sourceId);
    expect(found).toBeDefined();
    expect(found!.url).toBe('https://example.com/article');
  });

  it('should get citation by URL', () => {
    tracker.addCitation('https://example.com/article');
    const found = tracker.getCitationByUrl('https://example.com/article');
    expect(found).toBeDefined();
  });

  it('should return all citations', () => {
    tracker.addCitation('https://example.com/a');
    tracker.addCitation('https://example.com/b');
    expect(tracker.getAllCitations().length).toBe(2);
  });

  it('should filter citations by domain', () => {
    tracker.addCitation('https://example.com/a');
    tracker.addCitation('https://example.com/b');
    tracker.addCitation('https://other.com/c');
    const domainCits = tracker.getCitationsByDomain('example.com');
    expect(domainCits.length).toBe(2);
  });

  it('should filter by quality score', () => {
    tracker.addCitation('https://example.com/a', '', 0.3);
    tracker.addCitation('https://example.com/b', '', 0.7);
    const high = tracker.getCitationsByQuality(0.6);
    expect(high.length).toBe(1);
  });

  it('should remove a citation', () => {
    const cit = tracker.addCitation('https://example.com/article');
    expect(tracker.removeCitation(cit.sourceId)).toBe(true);
    expect(tracker.getAllCitations().length).toBe(0);
  });

  it('should return false when removing nonexistent citation', () => {
    expect(tracker.removeCitation('nonexistent')).toBe(false);
  });

  it('should compute statistics', () => {
    tracker.addCitation('https://example.com/a', '', 0.8);
    tracker.addCitation('https://example.com/b', '', 0.6);
    const stats = tracker.getStatistics();
    expect(stats.totalCitations).toBe(2);
    expect(stats.uniqueDomains).toBe(1);
    expect(stats.averageQuality).toBe(0.7);
  });

  it('should serialize and deserialize to JSON', () => {
    tracker.addCitation('https://example.com/a', 'Test', 0.8, 'snippet', new Date('2024-01-15'));
    const json = tracker.toJSON();
    const restored = CitationTracker.fromJSON(json);
    expect(restored.getAllCitations().length).toBe(1);
    expect(restored.getAllCitations()[0]!.url).toBe('https://example.com/a');
  });
});
