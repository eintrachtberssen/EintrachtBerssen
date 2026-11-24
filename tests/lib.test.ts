import { describe, expect, it } from 'vitest';
import { slugify } from '../src/lib/slug';
import { TAGS, type Tag } from '../src/data/tags';
import { SECTIONS, allTags, findSection, type Section } from '../src/data/sections';
import { postsForTags } from '../src/lib/posts';

describe('slugify', () => {
  it('handles umlauts, ß, slash and dots', () => {
    expect(slugify('Fußball')).toBe('fussball');
    expect(slugify('Fitness/Gymnastik')).toBe('fitness-gymnastik');
    expect(slugify('1. Herren')).toBe('1-herren');
    expect(slugify('Rückensport')).toBe('rueckensport');
  });
  it('produces no collisions across the tag list', () => {
    expect(new Set(TAGS.map(slugify)).size).toBe(TAGS.length);
  });
});

describe('sections', () => {
  it('parent sections inherit the tags of their children', () => {
    expect(allTags(findSection(['fussball'])!)).toEqual(
      expect.arrayContaining(['Fußball', '1. Herren', 'D-Juniorinnen', 'Minikicker']),
    );
  });
  it('finds nested sections by path', () => {
    expect(findSection(['fussball', 'juniorinnen', 'd-juniorinnen'])?.title).toBe('D-Juniorinnen');
    expect(findSection(['gibtsnicht'])).toBeUndefined();
  });
  it('only uses tags from the fixed list', () => {
    const f = (s: Section): Tag[] => [...s.tags, ...(s.children ?? []).flatMap(f)];
    expect(SECTIONS.flatMap(f).every((t) => (TAGS as readonly string[]).includes(t))).toBe(true);
  });
});

describe('postsForTags', () => {
  const p = (id: string, date: string, tags: Tag[]) => ({ id, data: { title: id, date: new Date(date), tags, gallery: [] } });
  it('returns matching posts newest first and skips untagged ones', () => {
    const posts = [p('a', '2024-01-01', ['Tennis']), p('b', '2025-01-01', ['Tennis', 'Verein']), p('c', '2026-01-01', [])];
    expect(postsForTags(posts, ['Tennis']).map((x) => x.id)).toEqual(['b', 'a']);
  });
});
