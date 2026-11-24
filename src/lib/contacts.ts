import { slugify } from './slug';
import type { Section } from '../data/sections';

export type ContactLike = { id: string; data: { group: string; name: string; role?: string; phone?: string | null; email?: string | null } };

function teamPattern(title: string): RegExp {
  const youth = /^([A-F])-Jugend$/.exec(title);
  if (youth) return new RegExp(`\\b${youth[1]}-(Jugend|Junioren)\\b`, 'i');
  const girls = /^([A-F])-Juniorinnen$/.exec(title);
  if (girls) return new RegExp(`\\b${girls[1]}-Juniorinnen\\b`, 'i');
  return new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

/** Ansprechpartner eines Bereichs; auf Teamseiten nur die passenden Trainer (sonst die ganze Gruppe). */
export function contactsForSection<T extends ContactLike>(section: Section, contacts: T[]): T[] {
  const inGroup = contacts.filter((c) => section.contactGroups.includes(c.data.group));
  if (section.children?.length) return inGroup;
  const re = teamPattern(section.title);
  const matching = inGroup.filter((c) => re.test(c.data.role ?? ''));
  return matching.length ? matching : inGroup;
}

/** Parser für src/data/contacts.json ({ contacts: [...] }), vergibt stabile IDs aus Gruppe + Name. */
export function parseContacts(text: string): ({ id: string } & Record<string, unknown>)[] {
  const list: Record<string, unknown>[] = JSON.parse(text).contacts ?? [];
  const seen = new Map<string, number>();
  return list.map((c) => {
    const base = slugify(`${c.group ?? ''} ${c.name ?? ''}`);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { ...c, id: n > 1 ? `${base}-${n}` : base };
  });
}
