// Usage: MIRROR=<pfad>/eintracht-berssen.de node scripts/import/posts.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parseArticle, htmlToMarkdown, EXCLUDED_IDS, localPath } from './article.mjs';
import { suggestTags } from './tagging.mjs';
import { importImage } from './images.mjs';
import { mapLegacyUrl, postSlugById } from './legacy.mjs';
import { mapPageUrl } from './pagemap.mjs';

const MIRROR = process.env.MIRROR;
if (!MIRROR) throw new Error('MIRROR nicht gesetzt');

const OUT = 'src/content/posts';
const files = readdirSync(MIRROR).filter((f) => /^\d+-.+\.html$/.test(f));
const articles = files.map((f) => parseArticle(readFileSync(join(MIRROR, f), 'utf8'), f));
const keep = articles.filter((a) => !EXCLUDED_IDS.has(a.id));

for (const a of keep) postSlugById.set(a.id, `${a.date.slice(0, 10)}-${a.slug}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const report = ['# Import-Bericht Beiträge', '', `Gefunden: ${articles.length}, ausgeschlossen: ${articles.length - keep.length}, übernommen: ${keep.length}`, '', '| ID | Datum | Titel | Tags |', '|---|---|---|---|'];

const yaml = (v) => JSON.stringify(v);
for (const a of keep) {
  const fileSlug = postSlugById.get(a.id);
  const dir = `images/posts/${fileSlug}`;
  const imageMap = {};
  for (const src of a.images) {
    const out = await importImage(src, dir, MIRROR);
    if (out) imageMap[src] = out;
  }
  const gallery = a.gallery.map((g) => imageMap[g]).filter(Boolean);
  let cover = (a.cover && imageMap[a.cover]) || gallery[0];
  let bodyHtml = a.bodyHtml;
  if (!cover && a.inline.length && imageMap[a.inline[0]]) {
    cover = imageMap[a.inline[0]];
  }
  const mapLink = (href) => {
    if (/^(mailto:|tel:|#)/.test(href)) return undefined;
    const local = /^https?:/.test(href) && !/eintracht-berssen\.de/.test(href) ? null : localPath(href);
    if (!local) return undefined;
    return mapLegacyUrl(local) ?? mapPageUrl(local) ?? undefined;
  };
  const text = htmlToMarkdown(bodyHtml, imageMap, mapLink);
  const tags = suggestTags(a.title, text);
  const fm = ['---', `title: ${yaml(a.title)}`, `date: ${a.date.slice(0, 10)}`, `tags: ${yaml(tags)}`];
  if (cover) fm.push(`image: ${yaml(cover)}`);
  if (gallery.length) fm.push(`gallery:\n${gallery.map((g) => `  - ${yaml(g)}`).join('\n')}`);
  fm.push(`legacyId: ${a.id}`, '---', '');
  writeFileSync(join(OUT, `${fileSlug}.md`), `${fm.join('\n')}\n${text}\n`);
  report.push(`| ${a.id} | ${a.date.slice(0, 10)} | ${a.title.replace(/\|/g, '/')} | ${tags.join(', ')} |`);
}
writeFileSync('docs/import-report.md', report.join('\n') + '\n');
writeFileSync('src/data/legacy-posts.json', JSON.stringify(Object.fromEntries(postSlugById), null, 0) + '\n');
console.log(`übernommen: ${keep.length} von ${articles.length}`);
