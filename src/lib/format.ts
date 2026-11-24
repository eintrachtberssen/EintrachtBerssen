const fmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' });
export const formatDate = (d: Date) => fmt.format(d);

/** Erste ~n Zeichen Klartext aus Markdown (für Teaser). */
export function excerpt(md: string | undefined, n = 160): string {
  if (!md) return '';
  const text = md
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > n ? `${text.slice(0, n).replace(/\s+\S*$/, '')} …` : text;
}
