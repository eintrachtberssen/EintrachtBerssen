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

import { gallerySchema } from '../src/lib/schemas';

describe('gallerySchema', () => {
  it('accepts an album saved by the CMS with empty images (null) instead of failing the whole build', () => {
    expect(gallerySchema.parse({ title: 'Neues Album', year: 2026, images: null }).images).toEqual([]);
  });
  it('accepts the year as string from the CMS', () => {
    expect(gallerySchema.parse({ title: 'A', year: '2025' }).year).toBe(2025);
  });
});

import { isPublished } from '../src/lib/posts';

describe('isPublished (zeitgesteuerte Veröffentlichung)', () => {
  const post = (d: string) => ({ id: d, data: { title: d, date: new Date(d), tags: [], gallery: [] } });
  const now = new Date('2026-12-01T10:00:00+01:00');
  it('shows posts dated today or earlier', () => {
    expect(isPublished(post('2026-12-01'), now)).toBe(true);
    expect(isPublished(post('2026-11-30'), now)).toBe(true);
  });
  it('hides posts dated in the future', () => {
    expect(isPublished(post('2026-12-02'), now)).toBe(false);
  });
  it('uses the German calendar day, not UTC (shortly after midnight in Berlin)', () => {
    // 00:30 Uhr am 2.12. in Berlin ist in UTC noch der 1.12.
    expect(isPublished(post('2026-12-02'), new Date('2026-12-01T23:30:00Z'))).toBe(true);
  });
});

import { extractFussballdeId } from '../src/lib/fussballde';

describe('extractFussballdeId', () => {
  const ID = '022010VSB4000000VS541L4KVVGEASRE';
  it('accepts a bare widget id', () => {
    expect(extractFussballdeId(ID)).toBe(ID);
    expect(extractFussballdeId(`  ${ID.toLowerCase()} `)).toBe(ID);
  });
  it('extracts the id from the old embed code (showWidget)', () => {
    expect(extractFussballdeId(`<div id="widget1"></div><script>new fussballdeWidgetAPI().showWidget('widget1', '${ID}');</script>`)).toBe(ID);
  });
  it('extracts the id from the new embed code (data-id)', () => {
    expect(extractFussballdeId(`<script src="https://www.fussball.de/widgets.js"></script><fussballde-widget data-id="${ID}" data-type="table"></fussballde-widget>`)).toBe(ID);
  });
  it('returns undefined for empty or unusable input', () => {
    expect(extractFussballdeId('')).toBeUndefined();
    expect(extractFussballdeId(null)).toBeUndefined();
    expect(extractFussballdeId('irgendein Text')).toBeUndefined();
  });
});

import { extractFussballdeType } from '../src/lib/fussballde';

describe('extractFussballdeType', () => {
  it('reads data-type from the new embed code and is undefined for the old API', () => {
    expect(extractFussballdeType('<div class="fussballde_widget" data-id="ABCDEFGHIJKLMNOPQRSTUV1234" data-type="table"></div>')).toBe('table');
    expect(extractFussballdeType("showWidget('w', 'ABCDEFGHIJKLMNOPQRSTUV1234')")).toBeUndefined();
  });
});

import { extractFussballdeScript } from '../src/lib/fussballde';

describe('extractFussballdeScript', () => {
  it('takes the script URL from a pasted fussball.de embed code', () => {
    expect(extractFussballdeScript('<script src="https://www.fussball.de/widgets.js"></script><div data-id="X"></div>')).toBe('https://www.fussball.de/widgets.js');
  });
  it('ignores scripts from other hosts and falls back to undefined', () => {
    expect(extractFussballdeScript('<script src="https://evil.example/x.js"></script>')).toBeUndefined();
    expect(extractFussballdeScript('ABCDEFGHIJKLMNOPQRSTUV1234')).toBeUndefined();
  });
});

import { parseFussballdeWidget } from '../src/lib/fussballde';

describe('parseFussballdeWidget', () => {
  const NEW_BODY = '<div class="fussballde_widget" data-id="02TESTWIDGETID0000000000000000AB" data-type="team-matches"></div>';
  it('loads widgets.js automatically when only the body part of the new code is pasted', () => {
    expect(parseFussballdeWidget(NEW_BODY)).toEqual({ id: '02TESTWIDGETID0000000000000000AB', type: 'team-matches', script: 'https://www.fussball.de/widgets.js' });
  });
  it('accepts head and body part pasted together', () => {
    const both = '<script type="text/javascript" src="https://www.fussball.de/widgets.js"></script>\n' + NEW_BODY;
    expect(parseFussballdeWidget(both)?.script).toBe('https://www.fussball.de/widgets.js');
  });
  it('keeps the old API (no script, no type) for old codes and bare ids', () => {
    expect(parseFussballdeWidget('022010VSB4000000VS541L4KVVGEASRE')).toEqual({ id: '022010VSB4000000VS541L4KVVGEASRE', type: undefined, script: undefined });
  });
  it('returns undefined when only the head script is pasted (no widget id)', () => {
    expect(parseFussballdeWidget('<script type="text/javascript" src="https://www.fussball.de/widgets.js"></script>')).toBeUndefined();
  });
});

describe('parseFussballdeWidget with the real new fussball.de code (UUID ids)', () => {
  const REAL = '<div \n  class="fussballde_widget"\n  data-id="138b2849-4bc8-4b61-8460-7d80eff6bbf1"\n  data-type="team-matches"\n  style="width: 600px"\n></div>';
  it('keeps the UUID exactly as given (lower case, with hyphens)', () => {
    expect(parseFussballdeWidget(REAL)).toEqual({ id: '138b2849-4bc8-4b61-8460-7d80eff6bbf1', type: 'team-matches', script: 'https://www.fussball.de/widgets.js' });
  });
  it('accepts a bare UUID as well', () => {
    expect(extractFussballdeId(' 138b2849-4bc8-4b61-8460-7d80eff6bbf1 ')).toBe('138b2849-4bc8-4b61-8460-7d80eff6bbf1');
  });
});

import { sportgelaendeSchema } from '../src/lib/schemas';

describe('sportgelaendeSchema', () => {
  it('tolerates empty lists and fields saved by the CMS', () => {
    const d = sportgelaendeSchema.parse({ intro: null, facts: null, areas: [{ title: 'C-Platz', features: null, image: '', isNew: null }] });
    expect(d.facts).toEqual([]);
    expect(d.areas[0]).toMatchObject({ title: 'C-Platz', features: [], image: undefined, isNew: false });
  });
  it('drops areas without a title instead of failing the build', () => {
    expect(sportgelaendeSchema.parse({ areas: [{ title: '' }, { title: 'Hauptplatz' }] }).areas.map((a) => a.title)).toEqual(['Hauptplatz']);
  });
});

import { downloadsSchema } from '../src/lib/schemas';

describe('downloadsSchema', () => {
  it('uses the uploaded file, else the external link', () => {
    const d = downloadsSchema.parse({ downloads: [
      { category: 'Mitgliedschaft', title: 'Antrag', file: '/images/uploads/antrag.pdf', url: '' },
      { category: 'Fußball', title: 'NFV', file: null, url: 'https://www.nfv.de/x.pdf' },
    ] });
    expect(d.map((x) => x.href)).toEqual(['/images/uploads/antrag.pdf', 'https://www.nfv.de/x.pdf']);
  });
  it('drops entries without title or without file/link instead of failing the build', () => {
    expect(downloadsSchema.parse({ downloads: [{ title: '', file: '/a.pdf' }, { title: 'Ohne Datei' }, { title: 'Ok', file: '/b.pdf' }] }).map((x) => x.title)).toEqual(['Ok']);
  });
  it('puts entries without category under "Weitere Dokumente" and tolerates an empty file', () => {
    expect(downloadsSchema.parse({ downloads: [{ title: 'X', file: '/x.pdf', category: null }] })[0].category).toBe('Weitere Dokumente');
    expect(downloadsSchema.parse({})).toEqual([]);
  });
});

describe('sportgelaendeSchema link button', () => {
  it('keeps an optional link with label and drops a link without target', () => {
    const d = sportgelaendeSchema.parse({ areas: [
      { title: 'Turnhalle', link: '/verein/belegungsplan/#halle', linkLabel: 'Hallenzeiten ansehen' },
      { title: 'Ohne Ziel', link: '', linkLabel: 'Klick' },
    ] });
    expect(d.areas[0]).toMatchObject({ link: '/verein/belegungsplan/#halle', linkLabel: 'Hallenzeiten ansehen' });
    expect(d.areas[1].link).toBeUndefined();
  });
});
