import type { Tag } from '../data/tags';

export type PostLike = { id: string; data: { title: string; date: Date; tags: Tag[]; image?: string; gallery: string[] } };

export function sortByDate<T extends PostLike>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function postsForTags<T extends PostLike>(posts: T[], tags: readonly Tag[]): T[] {
  return sortByDate(posts.filter((p) => p.data.tags.some((t) => tags.includes(t))));
}

const berlinDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Beiträge mit Datum in der Zukunft sind noch nicht veröffentlicht (Kalendertag in Deutschland). */
export function isPublished(post: PostLike, now: Date = new Date()): boolean {
  const postDay = post.data.date.toISOString().slice(0, 10); // Datum aus dem Frontmatter (UTC-Mitternacht)
  return postDay <= berlinDay.format(now);
}
