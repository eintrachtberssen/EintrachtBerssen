import { z } from 'astro/zod';

/** Fotoalben: tolerant gegenüber leeren Feldern aus der Eingabemaske. */
export const gallerySchema = z.object({
  title: z.string(),
  year: z.coerce.number().int(),
  images: z.array(z.string()).nullish().transform((v) => v ?? []),
});

const str = z.string().nullish().transform((v) => v?.trim() || undefined);
const list = <T extends z.ZodTypeAny>(t: T) => z.array(t).nullish().transform((v) => v ?? []);

/** Sportgelände (src/data/sportgelaende.json), tolerant gegenüber leeren Feldern aus der Eingabemaske. */
export const sportgelaendeSchema = z.object({
  intro: str,
  image: str,
  facts: list(z.object({ value: z.coerce.string(), label: z.string() })),
  areas: list(
    z.object({
      title: z.string().nullish(),
      subtitle: str,
      image: str,
      text: str,
      features: list(z.string()),
      isNew: z.boolean().nullish().transform((v) => v ?? false),
    }),
  ).transform((areas) => areas.filter((a): a is typeof a & { title: string } => Boolean(a.title?.trim()))),
});

/** Downloads (src/data/downloads.json): Datei-Upload oder externer Link; unvollständige Einträge werden ausgelassen. */
export const downloadsSchema = z
  .object({
    downloads: list(
      z.object({
        category: str,
        title: str,
        file: str,
        url: str,
        note: str,
      }),
    ),
  })
  .transform(({ downloads }) =>
    downloads
      .filter((d) => d.title && (d.file || d.url))
      .map((d) => ({ category: d.category ?? 'Weitere Dokumente', title: d.title!, href: (d.file ?? d.url)!, note: d.note })),
  );
