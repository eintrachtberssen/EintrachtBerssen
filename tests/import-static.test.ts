import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as cheerio from 'cheerio';
import { parseContactList, decodeHiddenMail } from '../scripts/import/contacts.mjs';

const fixtureVorstand = readFileSync('tests/fixtures/kontakte-vorstand.html', 'utf8');

describe('decodeHiddenMail', () => {
  it('joins base64 first and last parts with @', () => {
    const $ = cheerio.load('<joomla-hidden-mail first="bWF4" last="ZXhhbXBsZS5vcmc="></joomla-hidden-mail>');
    expect(decodeHiddenMail($('joomla-hidden-mail').get(0), $)).toBe('max@example.org');
  });
});

describe('parseContactList', () => {
  const c = parseContactList(fixtureVorstand, 'Vorstand');
  it('reads name, role and phone', () => {
    expect(c.find((x: { name: string }) => x.name === 'Sebastian Untiedt')).toMatchObject({ role: '1. Vorsitzender', phone: '0162/2050448' });
  });
  it('decodes the e-mail address', () => {
    expect(c.find((x: { name: string }) => x.name === 'Sebastian Untiedt')!.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });
  it('reads all eleven board members with their group', () => {
    expect(c.length).toBe(11);
    expect(c.every((x: { group: string }) => x.group === 'Vorstand')).toBe(true);
  });
  it('leaves no Joomla spam-protection text in the role', () => {
    expect(c.some((x: { role: string }) => /Spambots/.test(x.role))).toBe(false);
  });
  it('drops address lines like "Klein Berssen, Niedersachsen, Deutschland" from the role', () => {
    const html = '<main><table><tbody><tr><th><a>Mike Dworak</a></th><td>Telefon: 05965/942155<br>1. Vorsitzender<br>Klein Berssen<br>Niedersachsen<br>Deutschland<br></td></tr></tbody></table></main>';
    expect(parseContactList(html, 'Vorstand Tennis')[0].role).toBe('1. Vorsitzender');
  });
});

import { extractPage, isPlaceholder } from '../scripts/import/pages.mjs';

describe('extractPage', () => {
  const html = '<main><div class="page-header"><h1> Volleyball </h1></div><div class="com-content-article__body"><p>Wir sind eine Hobby-Mannschaft.</p><p><img src="/images/sampledata/Statisch/v.jpg"></p></div></main>';
  it('reads title, body html and images', () => {
    const p = extractPage(html);
    expect(p.title).toBe('Volleyball');
    expect(p.images).toEqual(['/images/sampledata/Statisch/v.jpg']);
    expect(p.bodyHtml).toContain('Hobby-Mannschaft');
  });
  it('recognises the "Anpfiff folgt" construction-site placeholder and empty pages', () => {
    expect(isPlaceholder('AtWork Anpfiff folgt Diese Seite ist noch in Arbeit')).toBe(true);
    expect(isPlaceholder('   ')).toBe(true);
    expect(isPlaceholder('Wir sind eine Hobby-Mannschaft.')).toBe(false);
  });
});
