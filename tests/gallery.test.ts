import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { albumImages } from '../src/lib/gallery';

function setup(files: string[]) {
  const pub = mkdtempSync(join(tmpdir(), 'pub-'));
  const dir = join(pub, 'images/galerien/2026-test');
  mkdirSync(dir, { recursive: true });
  for (const f of files) writeFileSync(join(dir, f), 'x');
  return pub;
}

describe('albumImages', () => {
  it('lists every image in the album folder, sorted by file name (numbers in natural order)', () => {
    const pub = setup(['10-b.jpg', '2-a.JPG', '1-c.png', 'notiz.txt', '.DS_Store']);
    expect(albumImages('2026-test', [], pub)).toEqual([
      '/images/galerien/2026-test/1-c.png',
      '/images/galerien/2026-test/2-a.JPG',
      '/images/galerien/2026-test/10-b.jpg',
    ]);
  });
  it('keeps images chosen in the CMS first and does not list them twice', () => {
    const pub = setup(['1.jpg', '2.jpg']);
    expect(albumImages('2026-test', ['/images/uploads/x.jpg', '/images/galerien/2026-test/2.jpg'], pub)).toEqual([
      '/images/uploads/x.jpg', '/images/galerien/2026-test/2.jpg', '/images/galerien/2026-test/1.jpg',
    ]);
  });
  it('encodes spaces in uploaded file names so the links work', () => {
    const pub = setup(['Foto 1.jpg']);
    expect(albumImages('2026-test', [], pub)).toEqual(['/images/galerien/2026-test/Foto%201.jpg']);
  });
  it('returns the CMS list (or nothing) when the folder does not exist', () => {
    expect(albumImages('gibt-es-nicht', [], '/nirgends')).toEqual([]);
    expect(albumImages('gibt-es-nicht', ['/images/uploads/a.jpg'], '/nirgends')).toEqual(['/images/uploads/a.jpg']);
  });
});

import { linkify } from '../src/lib/gallery';

describe('linkify', () => {
  it('splits text into plain parts and clickable links', () => {
    expect(linkify('Originale hier entlang: https://photos.app.goo.gl/abc123 – viel Spaß!')).toEqual([
      { text: 'Originale hier entlang: ' },
      { text: 'https://photos.app.goo.gl/abc123', href: 'https://photos.app.goo.gl/abc123' },
      { text: ' – viel Spaß!' },
    ]);
  });
  it('does not swallow a trailing full stop or bracket', () => {
    expect(linkify('Siehe (https://example.org/x).')).toEqual([{ text: 'Siehe (' }, { text: 'https://example.org/x', href: 'https://example.org/x' }, { text: ').' }]);
  });
  it('leaves text without links unchanged', () => {
    expect(linkify('Nur Text')).toEqual([{ text: 'Nur Text' }]);
  });
});
