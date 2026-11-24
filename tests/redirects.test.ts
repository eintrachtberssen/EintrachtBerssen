import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { mapLegacyUrl, loadPostSlugs } from '../scripts/import/legacy.mjs';
import { flattenSections } from '../src/data/sections';

loadPostSlugs(JSON.parse(readFileSync('src/data/legacy-posts.json', 'utf8')));
const legacy = readFileSync('tests/fixtures/legacy-paths.txt', 'utf8').split('\n').filter(Boolean);

const posts = new Set(readdirSync('src/content/posts').map((f) => f.replace(/\.md$/, '')));
const galleries = new Set(readdirSync('src/content/galleries').map((f) => f.replace(/\.md$/, '')));
const sections = new Set(flattenSections().map((s) => `/sport/${s.path.join('/')}/`));
const STATIC = new Set(['/', '/aktuelles/', '/kontakt/', '/sport/', '/verein/', '/verein/vorstand/', '/verein/chronik/', '/verein/fotos/', '/verein/sportgelaende/', '/verein/belegungsplan/', '/verein/anfahrt/', '/verein/downloads/', '/impressum/', '/datenschutz/', '/spielplan/']);

function routeExists(p: string): boolean {
  const post = /^\/beitrag\/([^/]+)\/$/.exec(p);
  if (post) return posts.has(post[1]);
  const album = /^\/verein\/fotos\/([^/]+)\/$/.exec(p);
  if (album) return galleries.has(album[1]);
  return STATIC.has(p) || sections.has(p);
}

describe('mapLegacyUrl', () => {
  it('maps every old page of the Joomla site to an existing new route', () => {
    const broken = legacy.map((p) => [p, mapLegacyUrl(p)] as const).filter(([, to]) => !to || !routeExists(to));
    expect(broken).toEqual([]);
  });
  it('maps kept posts to their new page', () => {
    expect(mapLegacyUrl('/183-rot-weisse-nacht-beim-sv-eintracht-berssen.html')).toMatch(/rot-weisse-nacht-beim-sv-eintracht-berssen\/$/);
  });
  it('sends removed notices to the news overview', () => {
    expect(mapLegacyUrl('/179-einladung-zur-generalversammlung-2026.html')).toBe('/aktuelles/');
  });
  it('maps renamed team pages', () => {
    expect(mapLegacyUrl('/sportabteilungen/fussball/juniorinnen/c-jugend.html')).toBe('/sport/fussball/juniorinnen/c-juniorinnen/');
    expect(mapLegacyUrl('/sportabteilungen/fussball/erste-herren.html')).toBe('/sport/fussball/herren/1-herren/');
    expect(mapLegacyUrl('/kontakte/vorstand/51-sebastian-untiedt.html')).toBe('/kontakt/');
  });
});

import { redirectFiles } from '../src/lib/redirects.mjs';

describe('redirectFiles', () => {
  const files = redirectFiles({ '/impressum.html': '/impressum/', '/verein/fotos/2015/dorfpokal.html': '/verein/fotos/2015-dorfpokal/' }, '/EintrachtBerssen/', 'https://sebutd.github.io');
  it('writes a real .html file at the old path (not a folder)', () => {
    expect(files.map((f) => f.file)).toEqual(['impressum.html', 'verein/fotos/2015/dorfpokal.html']);
  });
  it('points to the new page including the base path', () => {
    expect(files[0].html).toContain('url=/EintrachtBerssen/impressum/');
    expect(files[0].html).toContain('rel="canonical" href="https://sebutd.github.io/EintrachtBerssen/impressum/"');
  });
  it('works without base path for the custom domain', () => {
    expect(redirectFiles({ '/impressum.html': '/impressum/' }, '/', 'https://eintracht-berssen.de')[0].html).toContain('url=/impressum/');
  });
});
