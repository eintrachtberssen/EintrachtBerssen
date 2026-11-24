// Abbildung alter Joomla-Seiten-URLs auf neue Pfade. Vervollständigt in Task 5.
export function mapPageUrl(p) {
  const path = p.split('#')[0].split('?')[0];
  if (path === '/' || path === '/index.html') return '/';
  if (path.startsWith('/kontakte')) return '/kontakt/';
  if (path === '/verein/downloads.html') return '/verein/downloads/';
  const foto = /^\/verein\/fotos\/(\d{4})\/(.+)\.html$/.exec(path);
  if (foto) return `/verein/fotos/${foto[1]}-${foto[2]}/`;
  return null;
}
