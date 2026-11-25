import { getCollection, type CollectionEntry } from 'astro:content';
import { sortByDate, isPublished } from './posts';
import { TAGS, type Tag } from '../data/tags';

export type Post = CollectionEntry<'posts'>;

export async function getPosts(): Promise<Post[]> {
  // Beiträge mit Datum in der Zukunft erscheinen erst an diesem Tag (täglicher Neubau, siehe deploy.yml)
  return sortByDate(await getCollection('posts', (p) => isPublished(p)));
}

/** Tags in fester Reihenfolge, die mindestens einen Beitrag haben. */
export function usedTags(posts: Post[]): Tag[] {
  const used = new Set(posts.flatMap((p) => p.data.tags));
  return TAGS.filter((t) => used.has(t));
}

export const PAGE_SIZE = 12;
