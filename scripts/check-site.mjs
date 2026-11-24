// Prüft den Build in dist/: interne Links/Bilder existieren und tragen den Base-Pfad,
// keine externen Skripte/iframes/Fonts im ausgelieferten HTML, Weiterleitungsziele existieren.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const base = (process.env.BASE_PATH ?? '/EintrachtBerssen').replace(/\/+$/, '');
const errors = [];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function exists(urlPath) {
  let p = decodeURI(urlPath.split('#')[0].split('?')[0]);
  if (base && !p.startsWith(`${base}/`) && p !== base) return false;
  p = p.slice(base.length) || '/';
  const f = join(DIST, p);
  if (p.endsWith('/')) return existsSync(join(f, 'index.html'));
  return existsSync(f) && statSync(f).isFile();
}

const html = walk(DIST).filter((f) => f.endsWith('.html'));
for (const file of html) {
  const s = readFileSync(file, 'utf8');
  const rel = file.slice(DIST.length);
  for (const m of s.matchAll(/<script[^>]+src="(https?:)?\/\/[^"]+"/g)) errors.push(`${rel}: externes Skript ${m[0]}`);
  if (/<iframe/i.test(s)) errors.push(`${rel}: iframe im ausgelieferten HTML`);
  if (/fonts\.(googleapis|gstatic)\.com/.test(s)) errors.push(`${rel}: Google Fonts`);
  const refs = [...s.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  const refresh = /http-equiv="refresh" content="0;url=([^"]+)"/.exec(s);
  if (refresh) refs.push(refresh[1]);
  for (const r of refs) {
    if (!r.startsWith('/') || r.startsWith('//')) continue;
    if (!exists(r)) errors.push(`${rel}: kaputter Link ${r}`);
  }
}

if (errors.length) {
  const uniq = [...new Set(errors)];
  console.error(uniq.slice(0, 60).join('\n'));
  console.error(`\n${uniq.length} Fehler in ${html.length} Seiten`);
  process.exit(1);
}
console.log(`OK: ${html.length} HTML-Dateien geprüft, keine Fehler`);
