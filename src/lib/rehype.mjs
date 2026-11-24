// Rehype-Plugins für Markdown-Inhalte.
import { visit } from 'unist-util-visit';

export const PROVIDERS = {
  youtube: 'YouTube (Google)',
  maps: 'Google Maps',
  fussballde: 'fussball.de',
  other: 'einem externen Anbieter',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** HTML für den Zwei-Klick-Platzhalter. Wird von ConsentEmbed.astro und rehypeConsentEmbed genutzt. */
export function consentHtml(kind, src, title = 'Externer Inhalt') {
  const provider = PROVIDERS[kind] ?? PROVIDERS.other;
  const k = PROVIDERS[kind] ? kind : 'other';
  return `<div class="consent consent--${k}" data-consent-kind="${k}" data-consent-src="${esc(src)}" data-consent-title="${esc(title)}">`
    + `<div class="consent__inner"><p class="consent__title">${esc(title)}</p>`
    + `<p class="consent__text">Dieser Inhalt wird von ${esc(provider)} bereitgestellt. Beim Laden werden Daten (z.&nbsp;B. deine IP-Adresse) an ${esc(provider)} übertragen.</p>`
    + `<button type="button" class="btn" data-consent-load>Inhalt laden</button></div></div>`;
}

/** Ersetzt <div class="consent-embed" data-kind data-src> durch den Zwei-Klick-Platzhalter. */
const RAW_EMBED = /<div class="consent-embed" data-kind="([a-z]+)" data-src="([^"]*)">[\s\S]*?<\/div>/g;
const titleFor = (kind) => (kind === 'youtube' ? 'Video' : kind === 'maps' ? 'Karte' : 'Externer Inhalt');
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

export function rehypeConsentEmbed() {
  return (tree) => {
    visit(tree, 'raw', (node) => {
      node.value = node.value.replace(RAW_EMBED, (_, kind, src) => consentHtml(kind, unesc(src), titleFor(kind)));
    });
    visit(tree, 'element', (node, index, parent) => {
      const cls = node.properties?.className;
      if (node.tagName !== 'div' || !parent || !(Array.isArray(cls) ? cls.includes('consent-embed') : cls === 'consent-embed')) return;
      const kind = node.properties.dataKind ?? 'other';
      const src = node.properties.dataSrc ?? '';
      parent.children[index] = { type: 'raw', value: consentHtml(kind, src, titleFor(kind)) };
    });
  };
}

/** Setzt den Base-Pfad vor wurzel-relative src/href (z. B. /images/… → /EintrachtBerssen/images/…). */
export function rehypeBase({ base = '/' } = {}) {
  const b = base.replace(/\/+$/, '');
  return (tree) => {
    if (!b) return;
    const esc = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rawRe = new RegExp(`(\\s(?:src|href)=["'])\\/(?!\\/)(?!${esc.slice(1)}\\/)`, 'g');
    visit(tree, 'raw', (node) => { node.value = node.value.replace(rawRe, `$1${b}/`); });
    visit(tree, 'element', (node) => {
      for (const attr of ['src', 'href']) {
        const v = node.properties?.[attr];
        if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.startsWith(`${b}/`)) node.properties[attr] = `${b}${v}`;
      }
    });
  };
}
