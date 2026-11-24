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

import { contactsForSection } from '../src/lib/contacts';

describe('contactsForSection', () => {
  const c = (name: string, group: string, role: string) => ({ id: name, data: { group, name, role } });
  const all = [
    c('A', 'Fußball Junioren', 'Trainer D-Junioren'),
    c('B', 'Fußball Junioren', 'E-Jugend Trainer'),
    c('C', 'Fußball Juniorinnen', 'Trainer D-Juniorinnen'),
    c('D', 'Fußball Senioren', '1. Herren Trainer'),
  ];
  it('narrows team pages to the matching coaches', () => {
    expect(contactsForSection(findSection(['fussball', 'junioren', 'd-jugend'])!, all).map((x) => x.id)).toEqual(['A']);
    expect(contactsForSection(findSection(['fussball', 'herren', '1-herren'])!, all).map((x) => x.id)).toEqual(['D']);
  });
  it('does not confuse D-Junioren with D-Juniorinnen', () => {
    expect(contactsForSection(findSection(['fussball', 'juniorinnen', 'd-juniorinnen'])!, all).map((x) => x.id)).toEqual(['C']);
  });
  it('falls back to the whole group when no coach matches', () => {
    expect(contactsForSection(findSection(['fussball', 'junioren', 'a-jugend'])!, all).map((x) => x.id)).toEqual(['A', 'B']);
  });
});

import { parseContacts } from '../src/lib/contacts';

describe('parseContacts', () => {
  it('reads the CMS-editable {contacts: [...]} file and adds stable ids', () => {
    const list = parseContacts(JSON.stringify({ contacts: [{ group: 'Vorstand', name: 'Max Müller', role: 'Kassenwart' }, { group: 'Vorstand Tennis', name: 'Max Müller' }] }));
    expect(list.map((c) => c.id)).toEqual(['vorstand-max-mueller', 'vorstand-tennis-max-mueller']);
  });
  it('makes duplicate names in one group unique instead of dropping one', () => {
    const list = parseContacts(JSON.stringify({ contacts: [{ group: 'Vorstand', name: 'A B' }, { group: 'Vorstand', name: 'A B' }] }));
    expect(new Set(list.map((c) => c.id)).size).toBe(2);
  });
  it('tolerates an empty file', () => {
    expect(parseContacts(JSON.stringify({}))).toEqual([]);
  });
});

import { existsSync } from 'node:fs';
import { flattenSections } from '../src/data/sections';

describe('section content files', () => {
  it('exist for every section so the CMS can edit training times and texts', () => {
    const missing = flattenSections().filter(({ section }) => !existsSync(`src/content/sections/${section.slug}.md`)).map(({ section }) => section.slug);
    expect(missing).toEqual([]);
  });
});
