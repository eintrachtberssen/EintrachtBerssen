// Schlägt Tags für Alt-Beiträge anhand von Stichwörtern vor.
// Team-Tags nur aus dem Titel (Texte erwähnen oft andere Teams), allgemeine Tags aus Titel + Textanfang.
const JUNIOREN = { A: 'A-Jugend', B: 'B-Jugend', C: 'C-Jugend', D: 'D-Jugend', E: 'E-Jugend', F: 'F-Jugend' };
const JUNIORINNEN = { B: 'B-Juniorinnen', C: 'C-Juniorinnen', D: 'D-Juniorinnen', E: 'E-Juniorinnen' };

const TITLE_RULES = [
  [/\b1\.\s*herren|\berste[n]? herren|\bder ersten\b/i, ['1. Herren', 'Herren', 'Fußball']],
  [/\b2\.\s*herren|\bzweite[n]? herren|["„]zweite["“]/i, ['2. Herren', 'Herren', 'Fußball']],
  [/alte[n]? herren|altherren|legendenspiel/i, ['Alte Herren', 'Herren', 'Fußball']],
  [/\b1\.\s*damen|damenmannschaft|unsere damen|\berste[n]? damen/i, ['1. Damen', 'Damen', 'Fußball']],
  [/\b2\.\s*damen|\bzweite[n]? damen/i, ['2. Damen', 'Damen', 'Fußball']],
  [/\bminis\b|minikicker|kinderfußball|kinderfussball|funino|minitore/i, ['Minikicker', 'Junioren', 'Fußball']],
  [/jugendmannschaft/i, ['Junioren', 'Fußball']],
  [/juniorinnen|mädels|mädchen/i, ['Juniorinnen', 'Fußball']],
];

const TEXT_RULES = [
  [/tennis/i, ['Tennis']],
  [/volleyball/i, ['Volleyball']],
  [/rückensport|frauensportgruppe/i, ['Rückensport']],
  [/kinderturnen|gymnastik|fitness/i, ['Fitness/Gymnastik']],
  [/fußball|fussball|kreispokal|samtgemeindepokal|kreisliga|bezirksliga|derby|schiedsrichter|einlaufkinder|\bjsg\b/i, ['Fußball']],
  [/nachruf|verstorben|trauer/i, ['Nachruf']],
  [/spende|spendet|sponsor|trikot|trainingsanz|unterstützt|hoodie|rucksäcke|ausgerüstet|ausgestattet|überraschung/i, ['Sponsoren']],
  [/jubiläum|\bfest\b|feier|turnier|rot-weiße nacht|footballspiel|platzeinweihung|camp\b|fußballschule|fussballschule/i, ['Veranstaltung']],
  [/generalversammlung|vorstand|schließanlage|reinigungskraft|vereinssocken|mitglied|ehrung|fanshop/i, ['Verein']],
];

/** @returns {string[]} */
export function suggestTags(title, text = '') {
  const hay = `${title}\n${text.slice(0, 400)}`;
  const out = new Set();
  for (const m of title.matchAll(/\b([A-F](?:\s*[/&]\s*[A-F])*)\s*-\s*(Jugend|Junioren|Juniorinnen)/gi))
  for (const letter of m[1].toUpperCase().split(/\s*[/&]\s*/)) {
    if (/innen/i.test(m[2])) {
      out.add('Juniorinnen');
      if (JUNIORINNEN[letter]) out.add(JUNIORINNEN[letter]);
    } else {
      out.add('Junioren');
      out.add(JUNIOREN[letter]);
    }
    out.add('Fußball');
  }
  for (const [re, tags] of TITLE_RULES) if (re.test(title)) tags.forEach((t) => out.add(t));
  for (const [re, tags] of TEXT_RULES) if (re.test(hay)) tags.forEach((t) => out.add(t));
  if (out.size === 0) out.add('Verein');
  return [...out];
}
