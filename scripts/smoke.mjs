// Startet `astro preview` und prüft die wichtigsten Seiten im Browser (Desktop + Handy).
// Usage: npm run build && npm run smoke   (Screenshots optional: SHOTS=<ordner>)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = (process.env.BASE_PATH ?? '/EintrachtBerssen').replace(/\/+$/, '');
const PORT = 4329;
const PAGES = ['/', '/aktuelles/', '/beitrag/2020-09-17-fussballcamp-auf-unserem-sportgelaende/', '/sport/tennis/', '/sport/fussball/juniorinnen/d-juniorinnen/', '/kontakt/', '/spielplan/', '/verein/fotos/2026-legendenspiel/', '/impressum.html'];

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'pipe', detached: true });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => { if (String(d).includes('localhost')) resolve(); });
  setTimeout(() => reject(new Error('preview startet nicht')), 20000);
});

const failures = [];
const browser = await chromium.launch();
try {
  for (const [width, label] of [[1280, 'desktop'], [375, 'mobil']]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: process.env.SHOTS ? 2 : 1 });
    const extRequests = [];
    page.on('request', (r) => { if (!r.url().startsWith(`http://localhost:${PORT}`)) extRequests.push(r.url()); });
    for (const path of PAGES) {
      const res = await page.goto(`http://localhost:${PORT}${base}${path}`, { waitUntil: 'networkidle' });
      if (!res || res.status() !== 200) failures.push(`${label} ${path}: Status ${res?.status()}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) failures.push(`${label} ${path}: ${overflow}px horizontales Scrollen`);
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${label}${path.replace(/[/.]+/g, '_')}.png`, fullPage: false });
    }
    if (extRequests.length) failures.push(`${label}: externe Anfragen ohne Klick: ${[...new Set(extRequests)].join(', ')}`);

    if (label === 'mobil') {
      // Alle gebauten Seiten auf Handybreite: kein horizontales Scrollen
      const { readdirSync, statSync } = await import('node:fs');
      const walk = (d) => readdirSync(d).flatMap((f) => { const p = `${d}/${f}`; return statSync(p).isDirectory() ? walk(p) : [p]; });
      const all = walk('dist').filter((f) => f.endsWith('/index.html') && !f.includes('/_astro/')).map((f) => f.slice(4, -10) || '/');
      for (const path of all) {
        await page.goto(`http://localhost:${PORT}${base}${path}`, { waitUntil: 'load' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 0) failures.push(`mobil ${path}: ${overflow}px horizontales Scrollen`);
      }

      await page.goto(`http://localhost:${PORT}${base}/`);
      await page.click('.burger');
      if (!(await page.isVisible('#site-nav a[href$="/kontakt/"]'))) failures.push('mobil: Menü öffnet nicht');
    }
    await page.goto(`http://localhost:${PORT}${base}/beitrag/2020-09-17-fussballcamp-auf-unserem-sportgelaende/`);
    if (await page.locator('iframe').count()) failures.push(`${label}: iframe vor Klick`);
    await page.route(/youtube/, (r) => r.abort());
    await page.locator('[data-consent-load]').first().click();
    if ((await page.locator('iframe[src*="youtube-nocookie.com"]').count()) !== 1) failures.push(`${label}: Zwei-Klick lädt kein Video`);
    await page.close();
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid); } catch {}
}

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`OK: ${PAGES.length} Seiten × 2 Ansichten, Menü, Zwei-Klick`);
process.exit(0);
