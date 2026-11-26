// Erzeugt die Belegungspläne als PDF (A4 quer) aus den Druckseiten /druck/platz/ und /druck/halle/.
// Usage: npm run build && node scripts/belegung-pdf.mjs [Zielordner]   (Standard: dist/downloads)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = process.argv[2] ?? 'dist/downloads';
const base = (process.env.BASE_PATH ?? '/EintrachtBerssen').replace(/\/+$/, '');
const PORT = 4341;
const FILES = [
  ['platz', 'Belegungsplan-Fussballplaetze.pdf'],
  ['halle', 'Belegungsplan-Turnhalle.pdf'],
];

mkdirSync(out, { recursive: true });
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'pipe', detached: true });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => { if (String(d).includes('localhost')) resolve(); });
  setTimeout(() => reject(new Error('preview startet nicht')), 20000);
});
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [bereich, file] of FILES) {
    await page.goto(`http://localhost:${PORT}${base}/druck/${bereich}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: `${out}/${file}`, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
    console.log(`${out}/${file}`);
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid); } catch {}
}
process.exit(0);
