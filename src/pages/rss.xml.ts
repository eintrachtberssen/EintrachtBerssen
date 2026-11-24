import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import { excerpt } from '../lib/format';
import { SITE } from '../data/site';
import { url } from '../lib/url';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).slice(0, 30);
  return rss({
    title: `${SITE.name} – Aktuelles`,
    description: `Neuigkeiten vom ${SITE.legalName}`,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      link: url(`/beitrag/${p.id}/`),
      description: excerpt(p.body, 300),
      categories: p.data.tags,
    })),
  });
}
