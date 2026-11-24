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
