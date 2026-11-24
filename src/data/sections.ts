import type { Tag } from './tags';

export type Section = {
  slug: string;
  title: string;
  tags: Tag[];
  contactGroups: string[];
  children?: Section[];
};

const team = (slug: string, title: Tag, group: string): Section => ({ slug, title, tags: [title], contactGroups: [group] });

export const SECTIONS: Section[] = [
  {
    slug: 'fussball', title: 'Fußball', tags: ['Fußball'], contactGroups: ['Fußball Senioren', 'Fußball Junioren', 'Fußball Juniorinnen'],
    children: [
      {
        slug: 'herren', title: 'Herren', tags: ['Herren'], contactGroups: ['Fußball Senioren'],
        children: [team('1-herren', '1. Herren', 'Fußball Senioren'), team('2-herren', '2. Herren', 'Fußball Senioren'), team('alte-herren', 'Alte Herren', 'Fußball Senioren')],
      },
      {
        slug: 'damen', title: 'Damen', tags: ['Damen'], contactGroups: ['Fußball Senioren'],
        children: [team('1-damen', '1. Damen', 'Fußball Senioren'), team('2-damen', '2. Damen', 'Fußball Senioren')],
      },
      {
        slug: 'junioren', title: 'Junioren', tags: ['Junioren'], contactGroups: ['Fußball Junioren'],
        children: (['A-Jugend', 'B-Jugend', 'C-Jugend', 'D-Jugend', 'E-Jugend', 'F-Jugend', 'Minikicker'] as Tag[]).map((t) => team(t.toLowerCase(), t, 'Fußball Junioren')),
      },
      {
        slug: 'juniorinnen', title: 'Juniorinnen', tags: ['Juniorinnen'], contactGroups: ['Fußball Juniorinnen'],
        children: (['B-Juniorinnen', 'C-Juniorinnen', 'D-Juniorinnen', 'E-Juniorinnen'] as Tag[]).map((t) => team(t.toLowerCase(), t, 'Fußball Juniorinnen')),
      },
    ],
  },
  { slug: 'tennis', title: 'Tennis', tags: ['Tennis'], contactGroups: ['Vorstand Tennis'] },
  { slug: 'volleyball', title: 'Volleyball', tags: ['Volleyball'], contactGroups: ['Fitness/Gymnastik'] },
  { slug: 'rueckensport', title: 'Rückensport', tags: ['Rückensport'], contactGroups: ['Fitness/Gymnastik'] },
  { slug: 'fitness-gymnastik', title: 'Fitness/Gymnastik', tags: ['Fitness/Gymnastik'], contactGroups: ['Fitness/Gymnastik'] },
];

export function allTags(s: Section): Tag[] {
  return [...new Set([...s.tags, ...(s.children ?? []).flatMap(allTags)])];
}

export function findSection(path: string[], list: Section[] = SECTIONS): Section | undefined {
  const [head, ...rest] = path;
  const s = list.find((x) => x.slug === head);
  if (!s || rest.length === 0) return s;
  return findSection(rest, s.children ?? []);
}

/** Alle Abschnitte mit ihrem Pfad, für getStaticPaths und Navigation. */
export function flattenSections(list: Section[] = SECTIONS, prefix: string[] = []): { path: string[]; section: Section }[] {
  return list.flatMap((s) => [{ path: [...prefix, s.slug], section: s }, ...flattenSections(s.children ?? [], [...prefix, s.slug])]);
}
