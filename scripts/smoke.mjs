// Startet `astro preview` und prüft die wichtigsten Seiten im Browser (Desktop + Handy).
// Usage: npm run build && npm run smoke   (Screenshots optional: SHOTS=<ordner>)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = (process.env.BASE_PATH ?? '/EintrachtBerssen').replace(/\/+$/, '');
const PORT = 4329;
const PAGES = ['/', '/aktuelles/', '/beitrag/2020-09-17-fussballcamp-auf-unserem-sportgelaende/', '/sport/tennis/', '/sport/fussball/juniorinnen/d-juniorinnen/', '/kontakt/', '/sport/fussball/', '/spielplan/', '/verein/fotos/2026-legendenspiel/', '/impressum.html'];

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'pipe', detached: true });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => { if (String(d).includes('localhost')) resolve(); });
  setTimeout(() => reject(new Error('preview startet nicht')), 20000);
});

const failures = [];

// Auswerten nach Abschluss evtl. Weiterleitungen (Meta-Refresh alter Adressen)
async function evalSettled(page, fn) {
  for (let i = 0; i < 5; i++) {
    try { return await page.evaluate(fn); } catch (e) {
      if (!String(e).includes('Execution context was destroyed')) throw e;
      await page.waitForLoadState('load');
    }
  }
  return page.evaluate(fn);
}
const browser = await chromium.launch();
try {
  for (const [width, label] of [[1280, 'desktop'], [375, 'mobil']]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: process.env.SHOTS ? 2 : 1 });
    const extRequests = [];
    page.on('request', (r) => { if (!r.url().startsWith(`http://localhost:${PORT}`)) extRequests.push(r.url()); });
    for (const path of PAGES) {
      const res = await page.goto(`http://localhost:${PORT}${base}${path}`, { waitUntil: 'networkidle' });
      if (!res || res.status() !== 200) failures.push(`${label} ${path}: Status ${res?.status()}`);
      const overflow = await evalSettled(page, () => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) failures.push(`${label} ${path}: ${overflow}px horizontales Scrollen`);
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${label}${path.replace(/[/.]+/g, '_')}.png`, fullPage: false });
    }
    // Alte Spielplan-Adresse muss auf die Fußball-Seite führen
    await page.goto(`http://localhost:${PORT}${base}/spielplan/`);
    await page.waitForURL(/\/sport\/fussball\/#spielplan$/, { timeout: 5000 }).catch(() => failures.push(`${label}: /spielplan/ leitet nicht auf die Fußball-Seite`));
    if (extRequests.length) failures.push(`${label}: externe Anfragen ohne Klick: ${[...new Set(extRequests)].join(', ')}`);

    if (label === 'mobil') {
      // Alle gebauten Seiten auf Handybreite: kein horizontales Scrollen
      const { readdirSync, statSync } = await import('node:fs');
      const walk = (d) => readdirSync(d).flatMap((f) => { const p = `${d}/${f}`; return statSync(p).isDirectory() ? walk(p) : [p]; });
      const all = walk('dist').filter((f) => f.endsWith('/index.html') && !f.includes('/_astro/') && !f.includes('/druck/')) // Druckseiten sind feste A4-Seiten.map((f) => f.slice(4, -10) || '/');
      for (const path of all) {
        await page.goto(`http://localhost:${PORT}${base}${path}`, { waitUntil: 'load' });
        const overflow = await evalSettled(page, () => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 0) failures.push(`mobil ${path}: ${overflow}px horizontales Scrollen`);
      }

      await page.goto(`http://localhost:${PORT}${base}/`);
      await page.click('.burger');
      if (!(await page.isVisible('#site-nav a[href$="/kontakt/"]'))) failures.push('mobil: Menü öffnet nicht');
      // Das geöffnete Menü muss den Bildschirm unter dem Header füllen (nicht abgeschnitten)
      const nav = await page.evaluate(() => { const r = document.getElementById('site-nav').getBoundingClientRect(); return { bottom: r.bottom, h: r.height, vh: window.innerHeight }; });
      if (nav.bottom < nav.vh - 1) failures.push(`mobil: Menü nur ${Math.round(nav.h)}px hoch, Bildschirm ${nav.vh}px`);
      // Jeder Menüpunkt muss tatsächlich sichtbar und anklickbar sein
      const hidden = await page.evaluate(() => [...document.querySelectorAll('#site-nav a')].filter((a) => {
        a.scrollIntoView({ block: 'center' });
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(hit && (hit === a || a.contains(hit)));
      }).map((a) => a.textContent.trim()));
      if (hidden.length) failures.push(`mobil: Menüpunkte verdeckt/abgeschnitten: ${hidden.join(', ')}`);
    }
    await page.goto(`http://localhost:${PORT}${base}/beitrag/2020-09-17-fussballcamp-auf-unserem-sportgelaende/`);
    if (await page.locator('iframe').count()) failures.push(`${label}: iframe vor Klick`);
    if (label === 'desktop') {
      // Beitragsseite auf breitem Bildschirm: nichts breiter als Logo-Anfang bis Navigations-Ende
      await page.setViewportSize({ width: 1920, height: 1000 });
      const out = await page.evaluate(() => {
        const box = (e) => e.getBoundingClientRect();
        const left = box(document.querySelector('.brand')).left, right = box(document.querySelector('.nav > ul')).right;
        return [...document.querySelectorAll('article .post-head > *, article .body, article .body > *, article .cover, article .gallery')]
          .filter((e) => { const r = box(e); return r.width && (r.left < left - 1 || r.right > right + 1); })
          .map((e) => `${e.tagName.toLowerCase()}.${e.className.split(' ')[0]} ${Math.round(box(e).left)}–${Math.round(box(e).right)} (erlaubt ${Math.round(left)}–${Math.round(right)})`);
      });
      if (out.length) failures.push(`desktop 1920px Beitrag zu breit: ${[...new Set(out)].slice(0, 4).join('; ')}`);
      await page.setViewportSize({ width: 1280, height: 900 });
    }
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
