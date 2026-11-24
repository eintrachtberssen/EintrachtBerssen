import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { TAGS } from './data/tags';
import { parseContacts } from './lib/contacts';

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.enum(TAGS)).nullish().transform((t) => t ?? []),
    image: z.string().nullish().transform((v) => v || undefined),
    gallery: z.array(z.string()).nullish().transform((g) => g ?? []),
    legacyId: z.number().optional(),
  }),
});

const sections = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    image: z.string().nullish().transform((v) => v || undefined),
    training: z.string().nullish().transform((v) => v || undefined),
  }),
});

const galleries = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/galleries' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    images: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string() }),
});

const contacts = defineCollection({
  loader: file('./src/data/contacts.json', { parser: parseContacts }),
  schema: z.object({
    group: z.string(),
    name: z.string(),
    role: z.string().default(''),
    phone: z.string().nullish(),
    email: z.string().nullish(),
    image: z.string().nullish(),
  }),
});

export const collections = { posts, sections, galleries, pages, contacts };
