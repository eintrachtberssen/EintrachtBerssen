import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseArticle, htmlToMarkdown, EXCLUDED_IDS } from '../scripts/import/article.mjs';
import { suggestTags } from '../scripts/import/tagging.mjs';

const fixture182 = readFileSync('tests/fixtures/article-182.html', 'utf8');
const fixture94 = readFileSync('tests/fixtures/article-94.html', 'utf8');

describe('parseArticle', () => {
  const a = parseArticle(fixture182, '182-ein-besonderer-tag-fuer-unsere-jsg-suedhuemmling-c-juniorinnen.html');
  it('reads id, date and title', () => {
    expect(a.id).toBe(182);
    expect(a.slug).toBe('ein-besonderer-tag-fuer-unsere-jsg-suedhuemmling-c-juniorinnen');
    expect(a.date.startsWith('2026-08-10')).toBe(true);
    expect(a.title).toContain('JSG Südhümmling C- Juniorinnen');
  });
  it('collects full-size gallery images, not thumbs', () => {
    expect(a.images.length).toBeGreaterThanOrEqual(4);
    expect(a.images.every((i: string) => !i.includes('/thumbs/'))).toBe(true);
  });
  it('drops the SIGE gallery markup from the body', () => {
    expect(htmlToMarkdown(a.bodyHtml, {})).not.toContain('sige');
    expect(htmlToMarkdown(a.bodyHtml, {})).toContain('Einlaufkinder');
  });
  it('detects youtube iframes as embeds', () => {
    const b = parseArticle(fixture94, '94-fussballcamp-auf-unserem-sportgelaende.html');
    expect(b.embeds.some((e: { kind: string }) => e.kind === 'youtube')).toBe(true);
    expect(htmlToMarkdown(b.bodyHtml, {})).toContain('class="consent-embed"');
    expect(htmlToMarkdown(b.bodyHtml, {})).not.toContain('<iframe');
  });
});

describe('parseArticle cover image', () => {
  it('reads the Joomla full-text image outside the body as cover', () => {
    const a = parseArticle(readFileSync('tests/fixtures/article-177.html', 'utf8'), '177-ein-unvergessliches-wochenende-rueckblick-auf-unser-80-jaehriges-vereinsjubilaeum.html');
    expect(a.cover).toBe('/images/sampledata/2026/jubilaeum/spiel/010-DSC04716.jpg');
    expect(a.images).toContain(a.cover);
  });
});

describe('htmlToMarkdown', () => {
  it('removes nextcloud survey links but keeps their text', () => {
    expect(htmlToMarkdown('<p><a href="https://nextcloud.x/apps/forms/s/1">Zur Umfrage</a></p>', {})).toBe('Zur Umfrage');
  });
  it('decodes Joomla hidden e-mail elements into mailto links', () => {
    const md = htmlToMarkdown('<p>Mail: <joomla-hidden-mail first="bWF4" last="ZXhhbXBsZS5vcmc=">Diese E-Mail-Adresse ist vor Spambots geschützt!</joomla-hidden-mail></p>', {});
    expect(md).toContain('[max@example.org](mailto:max@example.org)');
    expect(md).not.toContain('Spambots');
  });
  it('rewrites mapped image sources', () => {
    expect(htmlToMarkdown('<p><img src="/images/a.jpg" alt="x"></p>', { '/images/a.jpg': '/images/posts/s/a.jpg' })).toContain('/images/posts/s/a.jpg');
  });
});

describe('EXCLUDED_IDS', () => {
  it('contains the agreed outdated notices only', () => {
    expect(EXCLUDED_IDS.has(179)).toBe(true);
    expect(EXCLUDED_IDS.has(185)).toBe(false);
    expect(EXCLUDED_IDS.size).toBe(28);
  });
});

describe('suggestTags', () => {
  it('tags team posts with team, group and Fußball', () => {
    expect(suggestTags('Neue Trikots für unsere D-Juniorinnen', '')).toEqual(
      expect.arrayContaining(['D-Juniorinnen', 'Juniorinnen', 'Fußball', 'Sponsoren']),
    );
  });
  it('tags tennis posts', () => {
    expect(suggestTags('Mixed-Turnier der Tennisabteilung', '')).toContain('Tennis');
  });
  it('falls back to Verein', () => {
    expect(suggestTags('Irgendwas', '')).toEqual(['Verein']);
  });
  it('does not match Rückensport inside other words', () => {
    expect(suggestTags('Ein besonderer Tag', 'mit unvergesslichen Eindrücken')).not.toContain('Rückensport');
  });
  it('takes team tags from the title only, not from the text', () => {
    const t = suggestTags('2. Damen - Meister der 2. Kreisklasse', 'Glückwunsch auch von der 1. Damen und der D-Jugend');
    expect(t).toContain('2. Damen');
    expect(t).not.toContain('1. Damen');
    expect(t).not.toContain('D-Jugend');
  });
  it('splits combined teams like A/B-Jugend', () => {
    expect(suggestTags('Neue Trikots für unsere A/B-Jugend', '')).toEqual(expect.arrayContaining(['A-Jugend', 'B-Jugend']));
  });
  it('maps "Zweite" to 2. Herren', () => {
    expect(suggestTags('"Zweite" spielt nun auswärts in grün', '')).toContain('2. Herren');
  });
  it('never returns duplicates', () => {
    const t = suggestTags('1. Herren und 1. Herren', 'Herren');
    expect(new Set(t).size).toBe(t.length);
  });
});

import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importDocumentLink } from '../scripts/import/images.mjs';

describe('importDocumentLink', () => {
  it('copies linked PDFs from the mirror into public/downloads and returns the new path', () => {
    const mirror = mkdtempSync(join(tmpdir(), 'mirror-'));
    mkdirSync(join(mirror, 'images/x'), { recursive: true });
    writeFileSync(join(mirror, 'images/x/Test_Dokument_Smoke.pdf'), '%PDF');
    const out = importDocumentLink('/images/x/Test_Dokument_Smoke.pdf', mirror);
    expect(out).toBe('/downloads/test-dokument-smoke.pdf');
    expect(existsSync('public/downloads/test-dokument-smoke.pdf')).toBe(true);
    rmSync('public/downloads/test-dokument-smoke.pdf');
  });
  it('ignores non-document links and missing files', () => {
    expect(importDocumentLink('/verein/chronik.html', '/nirgends')).toBeUndefined();
    expect(importDocumentLink('/images/fehlt.pdf', '/nirgends')).toBeUndefined();
  });
});
