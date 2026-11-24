// Weiterleitungsseiten für alte Joomla-Adressen (GitHub Pages kennt keine serverseitigen 301).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {Record<string,string>} map alter Pfad -> neuer Pfad (beide ohne Base)
 * @returns {{file:string, html:string}[]}
 */
export function redirectFiles(map, base, site) {
  const b = base.replace(/\/+$/, '');
  return Object.entries(map).map(([from, to]) => {
    const target = `${b}${to}`;
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Weiterleitung</title>`
      + `<meta http-equiv="refresh" content="0;url=${target}"><meta name="robots" content="noindex">`
      + `<link rel="canonical" href="${site.replace(/\/+$/, '')}${target}"></head>`
      + `<body><p>Diese Seite ist umgezogen: <a href="${target}">${target}</a></p></body></html>`;
    return { file: from.replace(/^\/+/, ''), html };
  });
}

/** Astro-Integration: schreibt die Weiterleitungsdateien nach dem Build in dist/. */
export function legacyRedirects(map, base, site) {
  return {
    name: 'legacy-redirects',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const files = redirectFiles(map, base, site);
        for (const f of files) {
          const p = join(out, f.file);
          mkdirSync(dirname(p), { recursive: true });
          writeFileSync(p, f.html);
        }
        logger.info(`${files.length} Weiterleitungen geschrieben`);
      },
    },
  };
}
