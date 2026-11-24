// Usage: MIRROR=… node scripts/import/pages.mjs
// Erzeugt src/content/pages, src/content/sections, src/content/galleries, src/data/downloads.json
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToMarkdown, localPath } from './article.mjs';
import { importImage, importFile, importDocumentLink } from './images.mjs';
import { mapLegacyUrl } from './legacy.mjs';
import { mapPageUrl } from './pagemap.mjs';

export function extractPage(html) {
  const $ = cheerio.load(html);
  const main = $('main');
  const title = main.find('.page-header h1, h1').first().text().trim().replace(/\s+/g, ' ');
  const body = main.find('.com-content-article__body').first();
  const images = [];
  body.find('.sige a').each((_, a) => { const p = localPath($(a).attr('href') ?? ''); if (!images.includes(p)) images.push(p); });
  body.find('img').each((_, i) => { const s = $(i).attr('src') ?? ''; if (s && !s.includes('/thumbs/') && !s.includes('/media/')) { const p = localPath(s); if (!images.includes(p)) images.push(p); } });
  return { title, bodyHtml: body.html() ?? '', text: body.text().replace(/\s+/g, ' ').trim(), images };
}

export function isPlaceholder(text) {
  return !text.trim() || /Anpfiff folgt|noch in Arbeit/i.test(text);
}

const yaml = (v) => JSON.stringify(v);
const mapLink = (href) => {
  if (/^(mailto:|tel:|#)/.test(href)) return undefined;
  if (/^https?:/.test(href) && !/eintracht-berssen\.de/.test(href)) return undefined;
  const local = localPath(href);
  if (/^\/(download|images)\//.test(local)) return importDocumentLink(local, process.env.MIRROR);
  return mapLegacyUrl(local) ?? mapPageUrl(local) ?? undefined;
};

async function toMarkdown(page, imgDir, MIRROR, { dropFirstImage = false } = {}) {
  const imageMap = {};
  for (const src of page.images) { const out = await importImage(src, imgDir, MIRROR); if (out) imageMap[src] = out; }
  let html = page.bodyHtml;
  if (dropFirstImage && page.images[0]) {
    const $ = cheerio.load(`<div id="r">${html}</div>`);
    $('#r img').first().remove();
    html = $('#r').html() ?? '';
  }
  return { md: htmlToMarkdown(html, imageMap, mapLink), imageMap };
}

/** Feste Seiten: Quelle → Ziel-ID */
const PAGES = [
  ['verein/chronik.html', 'chronik'],
  ['verein/sportgelaende.html', 'sportgelaende'],
  ['verein/anfahrt.html', 'anfahrt'],
  ['verein/belegungsplan.html', 'belegungsplan'],
  ['impressum.html', 'impressum'],
  ['datenschutzerklaerung.html', 'datenschutz'],
];

/** Abteilungs-/Teamseiten: Quelle → Section-Slug (letztes Pfadsegment aus src/data/sections.ts) */
const SECTIONS = [
  ['sportabteilungen/fussball/erste-herren.html', '1-herren', '1. Herren'],
  ['sportabteilungen/fussball/zweite-herren.html', '2-herren', '2. Herren'],
  ['sportabteilungen/fussball/erste-damen.html', '1-damen', '1. Damen'],
  ['sportabteilungen/fussball/zweite-damen.html', '2-damen', '2. Damen'],
  ['sportabteilungen/fussball/junioren.html', 'junioren', 'Junioren'],
  ['sportabteilungen/fussball/juniorinnen.html', 'juniorinnen', 'Juniorinnen'],
  ['sportabteilungen/tennis.html', 'tennis', 'Tennis'],
  ['sportabteilungen/volleyball.html', 'volleyball', 'Volleyball'],
  ['sportabteilungen/rueckensportgruppe.html', 'rueckensport', 'Rückensport'],
];

async function run(MIRROR) {
  for (const d of ['pages', 'sections', 'galleries']) mkdirSync(`src/content/${d}`, { recursive: true });

  for (const [src, id] of PAGES) {
    const page = extractPage(readFileSync(join(MIRROR, src), 'utf8'));
    const { md } = await toMarkdown(page, `images/seiten/${id}`, MIRROR);
    writeFileSync(`src/content/pages/${id}.md`, `---\ntitle: ${yaml(page.title)}\n---\n\n${md}\n`);
  }

  for (const [src, slug, title] of SECTIONS) {
    const page = extractPage(readFileSync(join(MIRROR, src), 'utf8'));
    const cover = page.images[0] ? await importImage(page.images[0], `images/teams/${slug}`, MIRROR) : null;
    const textWithoutTitle = page.text.replace(page.title, '').trim();
    const { md } = isPlaceholder(textWithoutTitle) ? { md: '' } : await toMarkdown(page, `images/teams/${slug}`, MIRROR, { dropFirstImage: Boolean(cover) });
    if (!md && !cover) continue;
    const fm = ['---', `title: ${yaml(title)}`];
    if (cover) fm.push(`image: ${yaml(cover)}`);
    if (slug === 'tennis') {
      const t = extractPage(readFileSync(join(MIRROR, 'sportabteilungen/tennis/tennis-termine.html'), 'utf8'));
      fm.push(`training: ${yaml(htmlToMarkdown(t.bodyHtml, {}))}`);
    }
    fm.push('---', '');
    writeFileSync(`src/content/sections/${slug}.md`, `${fm.join('\n')}\n${md}\n`);
  }

  const fotoRoot = join(MIRROR, 'verein/fotos');
  for (const year of readdirSync(fotoRoot).filter((y) => /^\d{4}$/.test(y))) {
    for (const f of readdirSync(join(fotoRoot, year)).filter((x) => x.endsWith('.html'))) {
      const id = `${year}-${f.replace(/\.html$/, '')}`;
      const page = extractPage(readFileSync(join(fotoRoot, year, f), 'utf8'));
      const images = [];
      for (const src of page.images) { const out = await importImage(src, `images/galerien/${id}`, MIRROR); if (out) images.push(out); }
      writeFileSync(`src/content/galleries/${id}.md`, `---\ntitle: ${yaml(page.title)}\nyear: ${year}\nimages:\n${images.map((i) => `  - ${yaml(i)}`).join('\n')}\n---\n`);
    }
  }

  const sv = importFile('/download/Aufnahmeantrag/Aufnahmeantrag_Sportverein.pdf', 'downloads', MIRROR);
  const tv = importFile('/download/Aufnahmeantrag/Aufnahmeantrag_Tennisverein.pdf', 'downloads', MIRROR);
  const gv = importFile('/download/Protokoll_Generalversammlung/gv_25.pdf', 'downloads', MIRROR);
  const downloads = [
    { category: 'Mitgliedschaft', title: 'Aufnahmeantrag Sportverein', href: sv },
    { category: 'Mitgliedschaft', title: 'Aufnahmeantrag Tennisverein', href: tv, note: 'Der Tennisverein bietet eine separate Mitgliedschaft an.' },
    { category: 'Fußball', title: 'Antrag auf eine Spielerlaubnis (NFV)', href: 'https://www.nfv.de/fileadmin/user_upload/NFV/Inhalt/Spielbetrieb/Passstelle/Spielerlaubnisantrag_0624.pdf' },
    { category: 'Protokolle', title: 'Protokoll Generalversammlung 2025', href: gv },
  ];
  writeFileSync('src/data/downloads.json', JSON.stringify(downloads, null, 2) + '\n');
  console.log('Seiten, Abteilungen, Galerien und Downloads importiert');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const MIRROR = process.env.MIRROR;
  if (!MIRROR) throw new Error('MIRROR nicht gesetzt');
  if (existsSync('src/data/legacy-posts.json')) {
    const { postSlugById } = await import('./legacy.mjs');
    for (const [k, v] of Object.entries(JSON.parse(readFileSync('src/data/legacy-posts.json', 'utf8')))) postSlugById.set(Number(k), v);
  }
  await run(MIRROR);
}
