// Liest die Widget-ID (und ggf. den Typ) aus dem, was Schreiber in die Eingabemaske einfügen:
// nackte ID, alter Einbettungscode (showWidget) oder neuer Einbettungscode (data-id/data-type).
const ID = /^[A-Z0-9]{16,48}$/;

export function extractFussballdeId(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  const s = input.trim();
  const dataId = /data-id=["']([A-Za-z0-9]+)["']/.exec(s);
  if (dataId) return dataId[1].toUpperCase();
  const api = /showWidget\(\s*['"][^'"]*['"]\s*,\s*['"]([A-Za-z0-9]+)['"]/.exec(s);
  if (api) return api[1].toUpperCase();
  return ID.test(s.toUpperCase()) ? s.toUpperCase() : undefined;
}

export function extractFussballdeType(input: string | null | undefined): string | undefined {
  return input ? /data-type=["']([a-z_-]+)["']/i.exec(input)?.[1] : undefined;
}

/** Script-URL aus einem eingefügten Einbettungscode – nur von fussball.de. */
export function extractFussballdeScript(input: string | null | undefined): string | undefined {
  const src = input ? /<script[^>]+src=["']([^"']+)["']/i.exec(input)?.[1] : undefined;
  if (!src) return undefined;
  try {
    const u = new URL(src, 'https://www.fussball.de');
    return /(^|\.)fussball\.de$/.test(u.hostname) && u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}
