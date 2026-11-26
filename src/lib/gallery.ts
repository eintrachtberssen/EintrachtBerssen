import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });

/**
 * Bilder eines Fotoalbums: zuerst die in der Eingabemaske gewählten (images),
 * dann automatisch alle Bilder im Ordner public/images/galerien/<album-id>/ (nach Dateiname sortiert).
 * So kann man Fotos in Masse einfach in den Ordner hochladen.
 */
export function albumImages(id: string, listed: string[], publicDir = 'public'): string[] {
  const dir = join(publicDir, 'images', 'galerien', id);
  const folder = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => IMG.test(f) && !f.startsWith('.'))
        .sort(collator.compare)
        .map((f) => `/images/galerien/${encodeURIComponent(id)}/${encodeURIComponent(f)}`)
    : [];
  const norm = (p: string) => encodeURI(decodeURI(p));
  const seen = new Set(listed.map(norm));
  return [...listed, ...folder.filter((p) => !seen.has(norm(p)))];
}

/** Text in Abschnitte zerlegen, URLs (http/https) werden zu Links. */
export function linkify(text: string): { text: string; href?: string }[] {
  const out: { text: string; href?: string }[] = [];
  const re = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], href: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
