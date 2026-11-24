// Usage: node scripts/import/redirects.mjs → src/data/redirects.json (alter Pfad -> neuer Pfad)
import { readFileSync, writeFileSync } from 'node:fs';
import { mapLegacyUrl, loadPostSlugs } from './legacy.mjs';

loadPostSlugs(JSON.parse(readFileSync('src/data/legacy-posts.json', 'utf8')));
const paths = readFileSync('tests/fixtures/legacy-paths.txt', 'utf8').split('\n').filter((p) => p && p !== '/index.html');
const out = {};
for (const p of paths) {
  const to = mapLegacyUrl(p);
  if (!to) throw new Error(`Keine Weiterleitung für ${p}`);
  out[p] = to;
}
writeFileSync('src/data/redirects.json', JSON.stringify(out, null, 2) + '\n');
console.log(`${Object.keys(out).length} Weiterleitungen`);
