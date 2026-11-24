// Liest Joomla-Beitragsseiten aus dem wget-Spiegel.
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

/** Zugesagte Altlasten: erledigte Kurzhinweise (Joomla-IDs). */
export const EXCLUDED_IDS = new Set([8, 16, 31, 32, 33, 53, 61, 81, 82, 83, 84, 86, 87, 88, 91, 92, 96, 100, 104, 107, 116, 117, 123, 124, 128, 161, 174, 179]);

const ORIGIN = /^https?:\/\/(www\.)?eintracht-berssen\.de/i;
export const localPath = (u) => decodeURI(u.replace(ORIGIN, '')).replace(/^([^/])/, '/$1');

export function parseArticle(html, file) {
  const m = /^(\d+)-(.+)\.html$/.exec(file.split('/').pop());
  if (!m) throw new Error(`Unerwarteter Dateiname: ${file}`);
  const $ = cheerio.load(html);
  const main = $('main');
  const title = main.find('.page-header h1').first().text().trim().replace(/\s+/g, ' ');
  const date = main.find('time[datetime]').first().attr('datetime') ?? '';
  const body = main.find('.com-content-article__body').first();

  const gallery = [];
  const inline = [];
  const add = (list, src) => { if (!src) return; const p = localPath(src); if (/\.(jpe?g|png|gif|webp)$/i.test(p) && !gallery.includes(p) && !inline.includes(p)) list.push(p); };
  body.find('.sige a').each((_, a) => add(gallery, $(a).attr('href')));
  body.find('img').each((_, img) => { const s = $(img).attr('src') ?? ''; if (!s.includes('/thumbs/') && !s.includes('/media/')) add(inline, s); });
  // Joomla-Feld "Beitragsbild" (figure.item-image) liegt außerhalb des Textes
  const fullImg = main.find('figure.item-image img').first().attr('src');
  const cover = fullImg ? localPath(fullImg) : undefined;
  const images = [...new Set([...(cover ? [cover] : []), ...inline, ...gallery])];

  const embeds = [];
  body.find('iframe').each((_, f) => {
    const src = $(f).attr('src') ?? '';
    embeds.push({ kind: /youtube|youtu\.be/.test(src) ? 'youtube' : /google\.[a-z.]+\/maps/.test(src) ? 'maps' : 'other', src });
  });

  return { id: Number(m[1]), slug: m[2], title, date, bodyHtml: body.html() ?? '', images, inline, gallery, cover, embeds };
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*' });
td.keep(['div']);
td.addRule('embed', {
  filter: (n) => n.nodeName === 'DIV' && n.getAttribute('class') === 'consent-embed',
  replacement: (_, n) => `\n\n${n.outerHTML}\n\n`,
});

/**
 * @param {string} bodyHtml
 * @param {Record<string,string>} imageMap  alter lokaler Pfad -> neuer öffentlicher Pfad
 * @param {(href:string)=>string|null} [mapLink] interne Links umschreiben (null = Link entfernen)
 */
export function htmlToMarkdown(bodyHtml, imageMap, mapLink = () => undefined) {
  const $ = cheerio.load(`<div id="root">${bodyHtml}</div>`);
  const root = $('#root');
  root.find('.sige, script, style').remove();
  root.find('joomla-hidden-mail').each((_, m) => {
    const b64 = (v) => Buffer.from(v ?? '', 'base64').toString('utf8');
    const mail = `${b64($(m).attr('first'))}@${b64($(m).attr('last'))}`;
    $(m).replaceWith(`<a href="mailto:${mail}">${mail}</a>`);
  });
  root.contents().filter((_, n) => n.type === 'comment').remove();
  root.find('img').each((_, img) => {
    const src = $(img).attr('src') ?? '';
    if (src.includes('/media/')) { $(img).remove(); return; } // Joomla-Emoticons
    const mapped = imageMap[localPath(src)];
    if (mapped) $(img).attr('src', mapped); else if (src.includes('/thumbs/')) $(img).remove();
  });
  root.find('iframe').each((_, f) => {
    const src = $(f).attr('src') ?? '';
    const kind = /youtube|youtu\.be/.test(src) ? 'youtube' : /google\.[a-z.]+\/maps/.test(src) ? 'maps' : 'other';
    const safe = src.replace(/"/g, '&quot;');
    // Inhalt nötig, sonst verwirft turndown das leere div; dient zugleich als Fallback-Link.
    $(f).replaceWith(`<div class="consent-embed" data-kind="${kind}" data-src="${safe}"><a href="${safe}">Externen Inhalt öffnen</a></div>`);
  });
  root.find('a').each((_, a) => {
    const href = $(a).attr('href') ?? '';
    if (/nextcloud\./i.test(href)) { $(a).replaceWith($(a).text()); return; }
    const mapped = mapLink(href);
    if (mapped === null) $(a).replaceWith($(a).text());
    else if (mapped) $(a).attr('href', mapped);
  });
  return td.turndown(root.html() ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
