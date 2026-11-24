import type { Tag } from '../data/tags';

export type PostLike = { id: string; data: { title: string; date: Date; tags: Tag[]; image?: string; gallery: string[] } };

export function sortByDate<T extends PostLike>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function postsForTags<T extends PostLike>(posts: T[], tags: readonly Tag[]): T[] {
  return sortByDate(posts.filter((p) => p.data.tags.some((t) => tags.includes(t))));
}
