import { z } from 'astro/zod';

export const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;
export type Day = (typeof DAYS)[number];

const str = z.string().nullish().transform((v) => v?.trim() || undefined);
const list = <T extends z.ZodTypeAny>(t: T) => z.array(t).nullish().transform((v) => (v ?? []).filter(Boolean));

/** "9:00", "09.00", "9.30" → "09:00"; ungültig → undefined */
const time = z
  .string()
  .nullish()
  .transform((v) => {
    const m = /^(\d{1,2})[:.](\d{2})$/.exec(v?.trim() ?? '');
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return undefined;
    return `${m[1].padStart(2, '0')}:${m[2]}`;
  });

const entry = z.object({
  day: z.string().nullish(),
  from: time,
  to: time,
  team: str,
  place: str,
  club: str,
  note: str,
});
type RawEntry = z.infer<typeof entry>;
export type Entry = { day: Day; from: string; to: string; team: string; place?: string; club?: string; note?: string };

const valid = (e: RawEntry): e is RawEntry & Entry =>
  Boolean(e.team && e.from && e.to && (DAYS as readonly string[]).includes(e.day ?? ''));

const area = z
  .object({ title: str, season: str, intro: str, notes: list(z.string()), entries: list(entry) })
  .nullish()
  .transform((a) => ({ title: a?.title, season: a?.season, intro: a?.intro, notes: a?.notes ?? [], entries: (a?.entries ?? []).filter(valid) as Entry[] }));

/** Belegungsplan (src/data/belegung.json), tolerant gegenüber Eingabefehlern aus der Eingabemaske. */
export const belegungSchema = z.object({ platz: area, halle: area });

export function byDay(entries: Entry[], days: readonly Day[]): { day: Day; entries: Entry[] }[] {
  return days.map((day) => ({
    day,
    entries: entries.filter((e) => e.day === day).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)),
  }));
}

export function teamKind(team: string): 'jugend' | 'senioren' {
  return /junior|jugend|minikicker|minis|bambini/i.test(team) ? 'jugend' : 'senioren';
}

export function clubKey(club: string | undefined): 'berssen' | 'stavern' | 'hueven' | 'other' {
  const c = (club ?? '').toLowerCase();
  if (/ber(ss|ß)en|eintr/.test(c)) return 'berssen';
  if (/stavern/.test(c)) return 'stavern';
  if (/hüven|hueven|eisten/.test(c)) return 'hueven';
  return 'other';
}
