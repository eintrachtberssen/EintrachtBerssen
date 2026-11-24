// Abbildung alter Joomla-URLs auf neue Pfade (ohne Base). Wird in Task 5 erweitert.
import { EXCLUDED_IDS } from './article.mjs';

/** @type {Map<number,string>} Joomla-ID -> neuer Beitrags-Slug */
export const postSlugById = new Map();

export function mapLegacyUrl(oldPath) {
  const p = decodeURI(oldPath.replace(/^https?:\/\/(www\.)?eintracht-berssen\.de/i, '').split('#')[0]);
  const post = /^\/(\d+)-[^/]+\.html$/.exec(p);
  if (post) {
    const id = Number(post[1]);
    if (EXCLUDED_IDS.has(id)) return '/aktuelles/';
    return postSlugById.has(id) ? `/beitrag/${postSlugById.get(id)}/` : '/aktuelles/';
  }
  return null;
}
