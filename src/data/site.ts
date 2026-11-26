export const SITE = {
  name: 'SV Eintracht Berssen',
  legalName: 'SV Eintracht Berssen 1946 e.V.',
  founded: '30. Mai 1946',
  address: ['Zum Sportzentrum', '49777 Klein Berssen'],
  fanshop: 'https://eintracht-berssen.pd-server.com/',
  fussballdeClub: 'https://www.fussball.de/verein/sv-eintracht-berssen-niedersachsen/-/id/00ES8GN7U400005AVV0AG08LVUPGND5I',
  fussballdeWidget: '022010VSB4000000VS541L4KVVGEASRE',
};

export type NavItem = { label: string; href: string; children?: NavItem[] };

export const NAV: NavItem[] = [
  { label: 'Aktuelles', href: '/aktuelles/' },
  {
    label: 'Verein', href: '/verein/',
    children: [
      { label: 'Vorstand', href: '/verein/vorstand/' },
      { label: 'Chronik', href: '/verein/chronik/' },
      { label: 'Fotos', href: '/verein/fotos/' },
      { label: 'Sportgelände', href: '/verein/sportgelaende/' },
      { label: 'Belegungsplan', href: '/verein/belegungsplan/' },
      { label: 'Anfahrt', href: '/verein/anfahrt/' },
      { label: 'Downloads', href: '/verein/downloads/' },
    ],
  },
  {
    label: 'Sport', href: '/sport/',
    children: [
      { label: 'Fußball', href: '/sport/fussball/' },
      { label: 'Tennis', href: '/sport/tennis/' },
      { label: 'Volleyball', href: '/sport/volleyball/' },
      { label: 'Rückensport', href: '/sport/rueckensport/' },
      { label: 'Fitness/Gymnastik', href: '/sport/fitness-gymnastik/' },
    ],
  },
  { label: 'Kontakt', href: '/kontakt/' },
];
