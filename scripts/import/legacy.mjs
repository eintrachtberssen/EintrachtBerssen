// Abbildung alter Joomla-URLs auf neue Pfade (ohne Base-Pfad).
import { EXCLUDED_IDS } from './article.mjs';

/** @type {Map<number,string>} Joomla-ID -> neuer Beitrags-Slug */
export const postSlugById = new Map();

/** @param {Record<string,string>} obj Inhalt von src/data/legacy-posts.json */
export function loadPostSlugs(obj) {
  for (const [k, v] of Object.entries(obj)) postSlugById.set(Number(k), v);
}

const SPORT = {
  '/sportabteilungen.html': '/sport/',
  '/sportabteilungen/fussball.html': '/sport/fussball/',
  '/sportabteilungen/fussball/erste-herren.html': '/sport/fussball/herren/1-herren/',
  '/sportabteilungen/fussball/zweite-herren.html': '/sport/fussball/herren/2-herren/',
  '/sportabteilungen/fussball/erste-damen.html': '/sport/fussball/damen/1-damen/',
  '/sportabteilungen/fussball/zweite-damen.html': '/sport/fussball/damen/2-damen/',
  '/sportabteilungen/fussball/junioren.html': '/sport/fussball/junioren/',
  '/sportabteilungen/fussball/junioren/a-jugend.html': '/sport/fussball/junioren/a-jugend/',
  '/sportabteilungen/fussball/junioren/b-jugend.html': '/sport/fussball/junioren/b-jugend/',
  '/sportabteilungen/fussball/junioren/c-jugend1.html': '/sport/fussball/junioren/c-jugend/',
  '/sportabteilungen/fussball/junioren/d-jugend.html': '/sport/fussball/junioren/d-jugend/',
  '/sportabteilungen/fussball/junioren/e-jugend1.html': '/sport/fussball/junioren/e-jugend/',
  '/sportabteilungen/fussball/junioren/f-jugend.html': '/sport/fussball/junioren/f-jugend/',
  '/sportabteilungen/fussball/junioren/minikicker.html': '/sport/fussball/junioren/minikicker/',
  '/sportabteilungen/fussball/juniorinnen.html': '/sport/fussball/juniorinnen/',
  '/sportabteilungen/fussball/juniorinnen/b-juniorinnen.html': '/sport/fussball/juniorinnen/b-juniorinnen/',
  '/sportabteilungen/fussball/juniorinnen/c-jugend.html': '/sport/fussball/juniorinnen/c-juniorinnen/',
  '/sportabteilungen/fussball/juniorinnen/d-juniorinnen.html': '/sport/fussball/juniorinnen/d-juniorinnen/',
  '/sportabteilungen/fussball/juniorinnen/e-juniorinnen.html': '/sport/fussball/juniorinnen/e-juniorinnen/',
  '/sportabteilungen/tennis.html': '/sport/tennis/',
  '/sportabteilungen/volleyball.html': '/sport/volleyball/',
  '/sportabteilungen/rueckensportgruppe.html': '/sport/rueckensport/',
};

export function mapLegacyUrl(oldPath) {
  const p = decodeURI(oldPath.replace(/^https?:\/\/(www\.)?eintracht-berssen\.de/i, '').split('#')[0].split('?')[0]);
  const post = /^\/(\d+)-[^/]+\.html$/.exec(p);
  if (post) {
    const id = Number(post[1]);
    if (EXCLUDED_IDS.has(id)) return '/aktuelles/';
    return postSlugById.has(id) ? `/beitrag/${postSlugById.get(id)}/` : '/aktuelles/';
  }
  if (p === '/' || p === '/index.html') return '/';
  if (SPORT[p]) return SPORT[p];
  if (p.startsWith('/sportabteilungen/tennis/')) return '/sport/tennis/';
  if (p === '/kontakte.html' || p.startsWith('/kontakte/')) return '/kontakt/';
  if (p === '/impressum.html') return '/impressum/';
  if (p === '/datenschutzerklaerung.html') return '/datenschutz/';
  if (p === '/verein/intern.html') return '/';
  const foto = /^\/verein\/fotos\/(\d{4})\/(.+)\.html$/.exec(p);
  if (foto) return `/verein/fotos/${foto[1]}-${foto[2]}/`;
  const verein = /^\/verein\/([a-z-]+)\.html$/.exec(p);
  if (verein) return `/verein/${verein[1]}/`;
  return null;
}
