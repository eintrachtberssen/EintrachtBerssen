import sharp from 'sharp';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const slug = (s) => s.toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Kopiert ein Bild aus dem Spiegel nach public/, verkleinert auf max. 1600 px.
 * @param {string} localSrc  Pfad wie /images/sampledata/2026/x.jpg
 * @param {string} publicDir Ziel relativ zu public/, z. B. images/posts/<slug>
 * @returns {Promise<string|null>} öffentlicher Pfad (/images/posts/<slug>/x.jpg) oder null, wenn die Quelle fehlt
 */
export async function importImage(localSrc, publicDir, mirror = process.env.MIRROR) {
  const src = join(mirror, localSrc);
  if (!existsSync(src)) return null;
  const ext = extname(src).toLowerCase();
  const name = slug(basename(src, extname(src))) || 'bild';
  const outDir = join('public', publicDir);
  mkdirSync(outDir, { recursive: true });
  const isPng = ext === '.png';
  const outName = `${name}${isPng ? '.png' : '.jpg'}`;
  const out = join(outDir, outName);
  if (!existsSync(out)) {
    try {
      const img = sharp(src, { failOn: 'none' }).rotate().resize({ width: 1600, withoutEnlargement: true });
      await (isPng ? img.png({ compressionLevel: 9, palette: true }) : img.jpeg({ quality: 80, mozjpeg: true })).toFile(out);
    } catch {
      copyFileSync(src, out);
    }
  }
  return `/${publicDir}/${outName}`;
}

/** Kopiert eine Datei (PDF o. ä.) unverändert. */
export function importFile(localSrc, publicDir, mirror = process.env.MIRROR) {
  const src = join(mirror, localSrc);
  if (!existsSync(src)) return null;
  const outDir = join('public', publicDir);
  mkdirSync(outDir, { recursive: true });
  const outName = `${slug(basename(src, extname(src)))}${extname(src).toLowerCase()}`;
  copyFileSync(src, join(outDir, outName));
  return `/${publicDir}/${outName}`;
}

/** Verlinkte Dokumente (PDF, Office) aus dem Spiegel nach public/downloads kopieren. */
export function importDocumentLink(localPath, mirror = process.env.MIRROR) {
  if (!/\.(pdf|docx?|xlsx?|pptx?)$/i.test(localPath)) return undefined;
  return importFile(localPath, 'downloads', mirror) ?? undefined;
}
