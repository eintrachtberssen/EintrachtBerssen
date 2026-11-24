/** Interner Link inkl. Base-Pfad (z. B. /EintrachtBerssen/aktuelles/). */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
