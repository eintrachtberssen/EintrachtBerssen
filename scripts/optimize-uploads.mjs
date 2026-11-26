// Verkleinert über die Eingabemaske hochgeladene Fotos vor dem Build (max. 1600 px Breite).
// Läuft im GitHub-Workflow; Dateinamen und Pfade bleiben gleich, damit Verweise gültig bleiben.
import sharp from 'sharp';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX = 1600;

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** @returns {Promise<number>} Anzahl verkleinerter Bilder */
export async function optimizeImages(dir, max = MAX) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const file of walk(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))) {
    const meta = await sharp(file).metadata();
    if (!meta.width || meta.width <= max) continue;
    const img = sharp(file, { failOn: 'none' }).rotate().resize({ width: max });
    const fmt = meta.format === 'png' ? img.png({ compressionLevel: 9 }) : meta.format === 'webp' ? img.webp({ quality: 80 }) : img.jpeg({ quality: 80, mozjpeg: true });
    writeFileSync(file, await fmt.toBuffer());
    n++;
  }
  return n;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dirs = process.argv.length > 2 ? process.argv.slice(2) : ['public/images/uploads', 'public/images/galerien'];
  let n = 0;
  for (const d of dirs) n += await optimizeImages(d);
  console.log(`${n} Bild(er) verkleinert`);
}
