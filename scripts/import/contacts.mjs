// Usage: MIRROR=… node scripts/import/contacts.mjs  → src/data/contacts.json
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const b64 = (s) => Buffer.from(s ?? '', 'base64').toString('utf8');

export function decodeHiddenMail(el, $) {
  const e = $(el);
  return `${b64(e.attr('first'))}@${b64(e.attr('last'))}`;
}


export function parseContactList(html, group) {
  const $ = cheerio.load(html);
  const out = [];
  $('main tbody tr').each((_, tr) => {
    const name = $(tr).find('th a').text().trim().replace(/\s+/g, ' ');
    if (!name) return;
    const td = $(tr).find('td').first();
    let email;
    td.find('joomla-hidden-mail').each((__, m) => { email = decodeHiddenMail(m, $); $(m).remove(); });
    const lines = (td.html() ?? '').split(/<br\s*\/?>/i).map((l) => cheerio.load(l).text().trim().replace(/\s+/g, ' ')).filter(Boolean);
    let phone;
    const role = [];
    for (const l of lines) {
      const ph = /^(?:Mobil|Telefon|Tel\.?|Handy|Fax)\s*:\s*(.+)$/i.exec(l);
      if (ph && !phone) phone = ph[1].trim();
      else if (!ph && !/^(Deutschland|Niedersachsen|Klein Berssen|Groß Berssen|\d{5}\b)/.test(l)) role.push(l);
    }
    out.push({ group, name, role: role.join(', '), ...(phone && { phone }), ...(email && { email }) });
  });
  return out;
}

const GROUPS = [
  ['vorstand', 'Vorstand'],
  ['vorstand-tennis', 'Vorstand Tennis'],
  ['fussball-senioren', 'Fußball Senioren'],
  ['fussball-junioren', 'Fußball Junioren'],
  ['fussball-juniorinnen', 'Fußball Juniorinnen'],
  ['fitness-gymnastik', 'Fitness/Gymnastik'],
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const MIRROR = process.env.MIRROR;
  if (!MIRROR) throw new Error('MIRROR nicht gesetzt');
  const all = GROUPS.flatMap(([file, group]) => parseContactList(readFileSync(join(MIRROR, 'kontakte', `${file}.html`), 'utf8'), group));
  writeFileSync('src/data/contacts.json', JSON.stringify({ contacts: all }, null, 2) + '\n');
  console.log(`${all.length} Kontakte`);
}
